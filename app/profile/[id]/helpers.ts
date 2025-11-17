"use client";

import { createClient } from "@/utils/supabase/client";
import { Database } from "@/types/database.types";

// Create a single Supabase client instance
const supabase = createClient();

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
 * Fetch user profile by user_id or username
 */
export async function fetchUserProfile(identifier: string): Promise<{
  profile: Profile | null;
  isOwnProfile: boolean;
}> {
  try {
    const currentUserId = await getCurrentUserId();

    // Determine lookup method - by user_id (UUID) or username
    let profileQuery = supabase.from("profiles").select("*");

    // Try to match by user_id first (if it's a UUID format)
    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (uuidRegex.test(identifier)) {
      profileQuery = profileQuery.eq("user_id", identifier);
    } else {
      // Otherwise match by username
      profileQuery = profileQuery.eq("username", identifier);
    }

    const { data: profileData, error: profileError } =
      await profileQuery.single();

    if (profileError || !profileData) {
      console.error("Error fetching profile:", profileError);
      return { profile: null, isOwnProfile: false };
    }

    return {
      profile: profileData,
      isOwnProfile: currentUserId === profileData.user_id,
    };
  } catch (error) {
    console.error("Error in fetchUserProfile:", error);
    return { profile: null, isOwnProfile: false };
  }
}

/**
 * Fetch user's active listings with category details
 */
export async function fetchUserActiveListings(
  userId: string
): Promise<ListingWithCategory[]> {
  try {
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
      .is("expired_at", null)
      .order("created_at", { ascending: false });

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
