"use client";

import { createClient } from "@/utils/supabase/client";
import { Tables, TablesUpdate } from "@/types/database.types";
import { uploadImage, deleteImage } from "@/utils/images/storage";
import {
  compressImage,
  isValidImage,
  type CompressionOptions,
  type CompressionResult,
} from "@/utils/images/compression";

export interface UpdateListingResult {
  success: boolean;
  message: string;
  listingId?: number;
  error?: string;
}

export interface ListingWithCategory extends Tables<"listings"> {
  categories?: Tables<"categories"> | null;
}

/**
 * Get a listing by ID for editing (must be owned by current user)
 */
export async function getListingForEdit(
  listingId: string | number
): Promise<{ listing: ListingWithCategory | null; isOwner: boolean }> {
  try {
    const supabase = createClient();
    const id = typeof listingId === "string" ? parseInt(listingId) : listingId;

    // Get current user
    const { data: userData } = await supabase.auth.getClaims();
    if (!userData?.claims) {
      return { listing: null, isOwner: false };
    }

    // Fetch listing with category
    const { data, error } = await supabase
      .from("listings")
      .select(
        `
        *,
        categories (
          id,
          name,
          key,
          icon,
          color,
          iconColor
        )
      `
      )
      .eq("id", id)
      .single();

    if (error) {
      console.error("Error fetching listing:", error);
      return { listing: null, isOwner: false };
    }

    const isOwner = data.user_id === userData.claims.sub;

    return { listing: data, isOwner };
  } catch (error) {
    console.error("Error in getListingForEdit:", error);
    return { listing: null, isOwner: false };
  }
}

/**
 * Get all categories for the dropdown
 */
export async function getCategories(): Promise<Tables<"categories">[]> {
  try {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("categories")
      .select("*")
      .order("name");

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error("Error fetching categories:", error);
    return [];
  }
}

/**
 * Upload multiple images with compression and progress tracking
 */
export async function uploadMultipleListingImages(
  files: File[],
  userId: string,
  options?: CompressionOptions,
  onProgress?: (progress: number) => void
): Promise<{
  success: boolean;
  urls: string[];
  errors: string[];
  compressionInfo: CompressionResult["compressionInfo"][];
}> {
  const urls: string[] = [];
  const errors: string[] = [];
  const compressionInfo: CompressionResult["compressionInfo"][] = [];

  for (let i = 0; i < files.length; i++) {
    const file = files[i];

    try {
      // Validate file type
      if (!isValidImage(file)) {
        errors.push(
          `${file.name}: Invalid file type. Please upload a valid image file.`
        );
        continue;
      }

      // Compress the image
      const compressionResult = await compressImage(file, options);

      compressionInfo.push(compressionResult.compressionInfo);

      // Upload the compressed image
      const uploadResult = await uploadImage(
        compressionResult.file,
        "ashoka-marketplace",
        userId,
        "listing-images"
      );

      if (!uploadResult.success || !uploadResult.url) {
        errors.push(`${file.name}: ${uploadResult.error || "Upload failed"}`);
        continue;
      }

      urls.push(uploadResult.url);

      // Update progress
      if (onProgress) {
        const progress = ((i + 1) / files.length) * 100;
        onProgress(progress);
      }
    } catch (error) {
      console.error(`Error processing ${file.name}:`, error);
      errors.push(
        `${file.name}: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  }

  return {
    success: urls.length > 0,
    urls,
    errors,
    compressionInfo,
  };
}

/**
 * Update an existing listing
 */
export async function updateListing(
  listingId: number,
  data: {
    name?: string;
    description?: string;
    price?: number | null;
    category?: number;
    condition?: string;
    imageUrls?: string[];
    productAge?: number;
  }
): Promise<UpdateListingResult> {
  try {
    const supabase = createClient();

    // Get the current user
    const { data: userData, error: userError } =
      await supabase.auth.getClaims();

    if (userError || !userData?.claims) {
      return {
        success: false,
        message: "You must be logged in to update a listing",
        error: userError?.message || "Not authenticated",
      };
    }

    // Verify ownership
    const { data: existingListing, error: fetchError } = await supabase
      .from("listings")
      .select("user_id, image")
      .eq("id", listingId)
      .single();

    if (fetchError || !existingListing) {
      return {
        success: false,
        message: "Listing not found",
        error: fetchError?.message || "Listing does not exist",
      };
    }

    if (existingListing.user_id !== userData.claims.sub) {
      return {
        success: false,
        message: "You don't have permission to edit this listing",
        error: "Unauthorized",
      };
    }

    // Validate fields if provided
    if (data.name !== undefined && !data.name.trim()) {
      return {
        success: false,
        message: "Product name cannot be empty",
        error: "Invalid name",
      };
    }

    if (data.price !== undefined && data.price !== null && data.price <= 0) {
      return {
        success: false,
        message: "Price must be greater than 0",
        error: "Invalid price",
      };
    }

    if (data.imageUrls !== undefined && data.imageUrls.length === 0) {
      return {
        success: false,
        message: "Please upload at least one image",
        error: "No images provided",
      };
    }

    // Prepare update data
    const updateData: TablesUpdate<"listings"> = {};

    if (data.name !== undefined) updateData.name = data.name;
    if (data.description !== undefined)
      updateData.description = data.description || null;
    if (data.price !== undefined) updateData.price = data.price;
    if (data.category !== undefined) updateData.category = data.category;
    if (data.condition !== undefined) updateData.condition = data.condition;
    if (data.productAge !== undefined) updateData.productAge = data.productAge;
    if (data.imageUrls !== undefined) {
      updateData.image = data.imageUrls;

      // Delete old images that are no longer used
      const oldImages = (existingListing.image as string[]) || [];
      const imagesToDelete = oldImages.filter(
        (oldUrl) => !data.imageUrls!.includes(oldUrl)
      );

      // Clean up deleted images
      for (const imageUrl of imagesToDelete) {
        try {
          await deleteImage(imageUrl, "ashoka-marketplace");
        } catch (cleanupError) {
          console.error("Failed to cleanup image:", imageUrl, cleanupError);
        }
      }
    }

    // Update the listing
    const { error: updateError } = await supabase
      .from("listings")
      .update(updateData)
      .eq("id", listingId);

    if (updateError) {
      console.error("Error updating listing:", updateError);
      return {
        success: false,
        message: "Failed to update listing. Please try again.",
        error: updateError.message,
      };
    }

    return {
      success: true,
      message: "Listing updated successfully!",
      listingId,
    };
  } catch (error) {
    console.error("Unexpected error updating listing:", error);
    return {
      success: false,
      message: "An unexpected error occurred. Please try again.",
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}
