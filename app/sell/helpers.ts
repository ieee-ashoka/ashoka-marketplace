"use client";

import { createClient } from "@/utils/supabase/client";
import { TablesInsert } from "@/types/database.types";
import { uploadImage } from "@/utils/images/storage";
import {
  compressImage,
  isValidImage,
  type CompressionOptions,
  type CompressionResult,
} from "@/utils/images/compression";

export interface CreateListingResult {
  success: boolean;
  message: string;
  listingId?: number;
  error?: string;
}

/**
 * Creates a new listing in the database
 */
export async function createListing(
  data: Omit<TablesInsert<"listings">, "created_at"> & {
    imageUrls: string[];
  }
): Promise<CreateListingResult> {
  try {
    const supabase = await createClient();

    // Get the current user
    const { data: supabaseData, error: userError } =
      await supabase.auth.getClaims();

    if (userError || !supabaseData?.claims) {
      return {
        success: false,
        message: "You must be logged in to create a listing",
        error: userError?.message || "Not authenticated",
      };
    }

    // Validate required fields
    if (!data.name || !data.category || !data.condition) {
      return {
        success: false,
        message: "Please fill in all required fields",
        error: "Missing required fields",
      };
    }

    // Validate price (if provided)
    if (data.price !== null && data.price !== undefined && data.price <= 0) {
      return {
        success: false,
        message: "Price must be greater than 0",
        error: "Invalid price",
      };
    }

    // Validate images
    if (!data.imageUrls || data.imageUrls.length === 0) {
      return {
        success: false,
        message: "Please upload at least one image",
        error: "No images provided",
      };
    }

    // Calculate expiration date (30 days from now)
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30);

    // Prepare listing data using TablesInsert type
    const listingData: TablesInsert<"listings"> = {
      user_id: supabaseData.claims.sub,
      name: data.name,
      description: data.description || null,
      price: data.price ?? null,
      category: data.category,
      condition: data.condition,
      image: data.imageUrls,
      productAge: data.productAge,
      expired_at: expiresAt.toISOString(),
    };

    // Insert the listing
    const { data: listing, error: insertError } = await supabase
      .from("listings")
      .insert(listingData)
      .select("id")
      .single();

    if (insertError) {
      console.error("Error creating listing:", insertError);
      return {
        success: false,
        message: "Failed to create listing. Please try again.",
        error: insertError.message,
      };
    }

    return {
      success: true,
      message: "Listing created successfully!",
      listingId: listing.id,
    };
  } catch (error) {
    console.error("Unexpected error creating listing:", error);
    return {
      success: false,
      message: "An unexpected error occurred. Please try again.",
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Uploads an image to Supabase storage with comprehensive validation and compression
 */
export async function uploadListingImage(
  file: File,
  userId: string,
  options?: {
    maxSizeMB?: number;
    maxWidthOrHeight?: number;
    quality?: number;
  }
): Promise<{
  success: boolean;
  url?: string;
  error?: string;
  compressionInfo?: CompressionResult["compressionInfo"];
}> {
  try {
    // Step 1: Validate file type
    if (!isValidImage(file)) {
      return {
        success: false,
        error: `Invalid file type: ${file.type}. Please upload a valid image file (JPEG, PNG, WebP, etc.).`,
      };
    }

    // Step 2: Check file size (before compression)
    const maxFileSizeMB = 10; // 10MB limit
    if (file.size > maxFileSizeMB * 1024 * 1024) {
      return {
        success: false,
        error: `File too large: ${(file.size / 1024 / 1024).toFixed(
          2
        )}MB. Maximum size is ${maxFileSizeMB}MB.`,
      };
    }

    // Step 3: Set up compression options optimized for listings
    const compressionOptions: CompressionOptions = {
      maxSizeMB: options?.maxSizeMB || 2, // Default to 2MB for listings
      maxWidthOrHeight: options?.maxWidthOrHeight || 1200, // Good for marketplace listings
      quality: options?.quality || 0.85, // High quality for product images
      useWebWorker: true,
      fileType: "image/webp", // Convert to WebP for better compression and browser support
    };

    // Step 5: Compress the image
    let compressionResult;
    try {
      compressionResult = await compressImage(file, compressionOptions);
      console.log(
        "Image compression completed:",
        compressionResult.compressionInfo
      );
    } catch (compressionError) {
      console.error("Error compressing image:", compressionError);
      return {
        success: false,
        error: `Failed to compress image: ${
          compressionError instanceof Error
            ? compressionError.message
            : "Unknown compression error"
        }`,
      };
    }

    // Step 6: Upload the compressed image to Supabase storage
    const uploadResult = await uploadImage(
      compressionResult.file,
      "ashoka-marketplace",
      userId,
      "listing-images" // Organize in a products subfolder
    );

    if (!uploadResult.success) {
      return {
        success: false,
        error: `Upload failed: ${uploadResult.error}`,
      };
    }

    // Step 8: Return success with compression info for logging/debugging
    return {
      success: true,
      url: uploadResult.url,
      compressionInfo: compressionResult.compressionInfo,
    };
  } catch (error) {
    console.error("Unexpected error in uploadListingImage:", error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "An unexpected error occurred during image upload",
    };
  }
}

/**
 * Uploads multiple images with compression and validation
 */
export async function uploadMultipleListingImages(
  files: File[],
  userId: string,
  options?: {
    maxSizeMB?: number;
    maxWidthOrHeight?: number;
    quality?: number;
  },
  onProgress?: (progress: number, current: number, total: number) => void
): Promise<{
  success: boolean;
  urls: string[];
  errors: string[];
  compressionInfo: Array<
    { index: number; filename: string } & CompressionResult["compressionInfo"]
  >;
}> {
  const results = {
    success: true,
    urls: [] as string[],
    errors: [] as string[],
    compressionInfo: [] as Array<
      { index: number; filename: string } & CompressionResult["compressionInfo"]
    >,
  };

  // Validate that we don't exceed the maximum number of images
  if (files.length > 3) {
    return {
      ...results,
      success: false,
      errors: ["Maximum 3 images allowed per listing"],
    };
  }

  // Upload images one by one to provide progress feedback
  for (let i = 0; i < files.length; i++) {
    const file = files[i];

    // Call progress callback if provided
    onProgress?.(Math.round((i / files.length) * 100), i, files.length);

    try {
      const uploadResult = await uploadListingImage(file, userId, options);

      if (uploadResult.success && uploadResult.url) {
        results.urls.push(uploadResult.url);
        if (uploadResult.compressionInfo) {
          results.compressionInfo.push({
            index: i,
            filename: file.name,
            ...uploadResult.compressionInfo,
          });
        }
      } else {
        results.success = false;
        results.errors.push(
          `Image ${i + 1} (${file.name}): ${uploadResult.error}`
        );
      }
    } catch (error) {
      results.success = false;
      results.errors.push(
        `Image ${i + 1} (${file.name}): ${
          error instanceof Error ? error.message : "Upload failed"
        }`
      );
    }
  }

  // Final progress callback
  onProgress?.(100, files.length, files.length);

  return results;
}

/**
 * Gets all listings for a user
 */
export async function getUserListings() {
  try {
    const supabase = await createClient();

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return {
        success: false,
        listings: [],
        error: "Not authenticated",
      };
    }

    const { data: listings, error } = await supabase
      .from("listings")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching listings:", error);
      return {
        success: false,
        listings: [],
        error: error.message,
      };
    }

    return {
      success: true,
      listings: listings || [],
    };
  } catch (error) {
    console.error("Unexpected error fetching listings:", error);
    return {
      success: false,
      listings: [],
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Deletes a listing and its associated images
 */
export async function deleteListing(
  listingId: number
): Promise<{ success: boolean; message: string; error?: string }> {
  try {
    const supabase = await createClient();

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return {
        success: false,
        message: "You must be logged in to delete a listing",
        error: "Not authenticated",
      };
    }

    // Get the listing to verify ownership and get image URLs
    const { data: listing, error: fetchError } = await supabase
      .from("listings")
      .select("*")
      .eq("id", listingId)
      .eq("user_id", user.id)
      .single();

    if (fetchError || !listing) {
      return {
        success: false,
        message: "Listing not found or you don't have permission to delete it",
        error: fetchError?.message || "Not found",
      };
    }

    // Delete the listing (images will be cleaned up separately if needed)
    const { error: deleteError } = await supabase
      .from("listings")
      .delete()
      .eq("id", listingId)
      .eq("user_id", user.id);

    if (deleteError) {
      console.error("Error deleting listing:", deleteError);
      return {
        success: false,
        message: "Failed to delete listing. Please try again.",
        error: deleteError.message,
      };
    }

    return {
      success: true,
      message: "Listing deleted successfully!",
    };
  } catch (error) {
    console.error("Unexpected error deleting listing:", error);
    return {
      success: false,
      message: "An unexpected error occurred. Please try again.",
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}
