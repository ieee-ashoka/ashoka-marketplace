"use client";

import { createClient } from "@/utils/supabase/client";
import { deleteImage } from "@/utils/images/storage";
import { Database } from "@/types/database.types";

// Create a single Supabase client instance
const supabase = createClient();

// Type definitions
type Profile = Database["public"]["Tables"]["profiles"]["Row"];
type Listing = Database["public"]["Tables"]["listings"]["Row"];
type ListingWithCategory = Listing & {
  categories?: Database["public"]["Tables"]["categories"]["Row"] | null;
};

/**
 * Get current user ID from JWT claims
 */
async function getCurrentUserId(): Promise<string | null> {
  const { data, error } = await supabase.auth.getClaims();

  if (error || !data?.claims) {
    console.error("Error getting user claims:", error);
    return null;
  }

  return data.claims.sub || null;
}

/**
 * Fetch user profile data
 */
export async function fetchProfile(): Promise<Profile | null> {
  const userId = await getCurrentUserId();
  if (!userId) return null;

  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("user_id", userId)
    .single();

  if (error) {
    console.error("Error fetching profile:", error);
    return null;
  }

  return data;
}

/**
 * Fetch user's listings with category details
 */
export async function fetchMyListings(): Promise<ListingWithCategory[]> {
  const userId = await getCurrentUserId();
  if (!userId) return [];

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
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching listings:", error);
    return [];
  }

  return data || [];
}

/**
 * Fetch user's wishlist items with category details
 */
export async function fetchWishlistItems(): Promise<ListingWithCategory[]> {
  const userId = await getCurrentUserId();
  if (!userId) return [];

  // First get wishlist entries
  const { data: wishlistEntries, error: wishlistError } = await supabase
    .from("wishlist")
    .select("listing_id")
    .eq("user_id", userId);

  if (wishlistError) {
    console.error("Error fetching wishlist entries:", wishlistError);
    return [];
  }

  if (!wishlistEntries || wishlistEntries.length === 0) {
    return [];
  }

  // Extract listing IDs
  const listingIds = wishlistEntries
    .map((item) => item.listing_id)
    .filter((id): id is number => id !== null);

  if (listingIds.length === 0) {
    return [];
  }

  // Fetch actual listing data
  const { data: listings, error: listingsError } = await supabase
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
    .in("id", listingIds);

  if (listingsError) {
    console.error("Error fetching wishlist listings:", listingsError);
    return [];
  }

  return listings || [];
}

/**
 * Update user's phone number
 */
export async function updatePhoneNumber(phoneNumber: string): Promise<{
  success: boolean;
  message: string;
  error?: string;
}> {
  try {
    const userId = await getCurrentUserId();

    if (!userId) {
      return {
        success: false,
        message: "You must be logged in to update your profile",
        error: "Not authenticated",
      };
    }

    const { error } = await supabase
      .from("profiles")
      .update({ phn_no: phoneNumber })
      .eq("user_id", userId);

    if (error) {
      console.error("Error updating phone number:", error);
      return {
        success: false,
        message: "Failed to update phone number",
        error: error.message,
      };
    }

    return {
      success: true,
      message: "Phone number updated successfully",
    };
  } catch (error) {
    console.error("Unexpected error updating phone number:", error);
    return {
      success: false,
      message: "An unexpected error occurred",
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

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
    // Get current user
    const userId = await getCurrentUserId();

    if (!userId) {
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
      .eq("user_id", userId)
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
          await deleteImage(imageUrl, "ashoka-marketplace");
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
      .eq("user_id", userId);

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
    const userId = await getCurrentUserId();

    if (!userId) {
      return {
        success: false,
        message: "You must be logged in",
        error: "Not authenticated",
      };
    }

    const { error } = await supabase
      .from("wishlist")
      .delete()
      .eq("user_id", userId)
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
