"use client";

import { createClient } from "@/utils/supabase/client";

// Create a single Supabase client instance
const supabase = createClient();

type BuyerProfile = {
  avatar: string | null;
  name: string | null;
  created_at: string | null;
  user_id: string | null;
};

/**
 * Get current user ID from JWT claims
 */
async function getCurrentUserId(): Promise<string | null> {
  try {
    const { data, error } = await supabase.auth.getClaims();

    if (error || !data?.claims) {
      console.error("Error getting user claims:", error);
      return null;
    }

    return data.claims.sub || null;
  } catch (error) {
    console.error("Exception getting user claims:", error);
    return null;
  }
}

export async function getListingBuyers(
  listingId: string | number
): Promise<BuyerProfile[]> {
  try {
    const id = typeof listingId === "string" ? parseInt(listingId) : listingId;
    const buyers: BuyerProfile[] = [];

    // Get all interested users for this listing
    const { data: interestedData, error } = await supabase
      .from("interested")
      .select("user_id")
      .eq("listing_id", id);

    if (error) {
      console.error("Error fetching interested users:", error);
      return [];
    }

    if (!interestedData || interestedData.length === 0) {
      return [];
    }

    // Fetch profile data for each interested user
    for (const row of interestedData) {
      if (!row.user_id) continue;

      const { data: userData, error: userError } = await supabase
        .from("profiles")
        .select("avatar, name, created_at, user_id")
        .eq("user_id", row.user_id)
        .single();

      if (userError) {
        console.error("Error fetching user data:", userError);
        continue;
      }
      buyers.push(userData);
    }

    return buyers;
  } catch (error) {
    console.error("Error fetching listing buyers:", error);
    return [];
  }
}

export async function isListingOwnerAndListingExists(
  listingId: string | number
): Promise<{ cond: boolean; name: string | null }> {
  try {
    const userId = await getCurrentUserId();
    if (!userId) {
      return { cond: false, name: null };
    }

    const id = typeof listingId === "string" ? parseInt(listingId) : listingId;

    const { data, error } = await supabase
      .from("listings")
      .select("user_id, name")
      .eq("id", id)
      .single();

    if (error) {
      console.error("Error fetching listing:", error);
      return { cond: false, name: null };
    }

    return { cond: data.user_id === userId, name: data.name };
  } catch (error) {
    console.error("Error checking listing owner:", error);
    return { cond: false, name: null };
  }
}

/**
 * Mark a listing as sold
 */
export async function markListingAsSold(listingId: string | number): Promise<{
  success: boolean;
  message: string;
  error?: string;
}> {
  try {
    const id = typeof listingId === "string" ? parseInt(listingId) : listingId;

    const { error } = await supabase
      .from("listings")
      .update({ is_sold: true })
      .eq("id", id)
      .single();

    if (error) {
      console.error("Error marking listing sold:", error);
      return {
        success: false,
        message: "Failed to mark listing as sold",
        error: error.message,
      };
    }

    return {
      success: true,
      message: "Listing marked as sold successfully",
    };
  } catch (error) {
    console.error("Unexpected error in markListingAsSold:", error);
    return {
      success: false,
      message: "An unexpected error occurred",
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}
