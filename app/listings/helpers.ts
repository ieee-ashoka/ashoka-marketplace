"use client";

import { createClient } from "@/utils/supabase/client";
import { Database } from "@/types/database.types";

// Create a single Supabase client instance
const supabase = createClient();

type Listing = Database["public"]["Tables"]["listings"]["Row"];
type Category = Database["public"]["Tables"]["categories"]["Row"];
type ListingWithCategory = Listing & {
  categories?: Category | null;
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
 * Fetch all active listings for current user
 */
export async function fetchUserListings(): Promise<ListingWithCategory[]> {
  try {
    const userId = await getCurrentUserId();
    if (!userId) {
      return [];
    }

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
      .not("expired_at", "lt", new Date().toISOString())
      .not("is_sold", "eq", true);

    if (error) {
      console.error("Error fetching listings:", error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error("Unexpected error fetching listings:", error);
    return [];
  }
}

/**
 * Delete a listing
 */
export async function deleteListing(listingId: number): Promise<{
  success: boolean;
  message: string;
  error?: string;
}> {
  try {
    const { error } = await supabase
      .from("listings")
      .delete()
      .eq("id", listingId)
      .single();

    if (error) {
      console.error("Error deleting listing:", error);
      return {
        success: false,
        message: "Failed to delete listing",
        error: error.message,
      };
    }

    return {
      success: true,
      message: "Listing deleted successfully",
    };
  } catch (error) {
    console.error("Unexpected error deleting listing:", error);
    return {
      success: false,
      message: "An unexpected error occurred",
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}
