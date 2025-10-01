"use client";

import { createClient } from "@/utils/supabase/client";
import { deleteImage } from "@/utils/images/storage";

/**
 * Deletes a listing and all its associated images
 * Client-side helper for profile page
 */
export async function deleteListing(listingId: number): Promise<{
  success: boolean;
  message: string;
  error?: string;
}> {
  try {
    const supabase = createClient();

    // Get current user
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

    // Delete images from storage if they exist
    if (
      listing.image &&
      Array.isArray(listing.image) &&
      listing.image.length > 0
    ) {
      console.log(`Deleting ${listing.image.length} images...`);

      // Delete all images concurrently
      const deletePromises = listing.image.map(async (imageUrl: string) => {
        try {
          await deleteImage(imageUrl, "listing_images");
          console.log(`Deleted image: ${imageUrl}`);
        } catch (error) {
          console.error(`Failed to delete image ${imageUrl}:`, error);
          // Don't throw - continue with other deletions
        }
      });

      await Promise.allSettled(deletePromises);
    }

    // Delete the listing from database
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

/**
 * Removes an item from the user's wishlist
 */
export async function removeFromWishlist(listingId: number): Promise<{
  success: boolean;
  message: string;
  error?: string;
}> {
  try {
    const supabase = createClient();

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return {
        success: false,
        message: "You must be logged in",
        error: "Not authenticated",
      };
    }

    const { error } = await supabase
      .from("wishlist")
      .delete()
      .eq("user_id", user.id)
      .eq("listing_id", listingId);

    if (error) {
      console.error("Error removing from wishlist:", error);
      return {
        success: false,
        message: "Failed to remove from wishlist",
        error: error.message,
      };
    }

    return {
      success: true,
      message: "Removed from wishlist",
    };
  } catch (error) {
    console.error("Unexpected error removing from wishlist:", error);
    return {
      success: false,
      message: "An unexpected error occurred",
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}
