import { createClient } from "@/utils/supabase/client";
import { Tables } from "@/types/database.types";

const supabase = createClient();

export interface ListingWithCategory extends Tables<"listings"> {
  categories?: Tables<"categories"> | null;
}

/**
 * Get current user ID from JWT claims
 */
export async function getCurrentUserId(): Promise<string | null> {
  const { data, error } = await supabase.auth.getClaims();

  if (error || !data?.claims) {
    return null;
  }

  return data.claims.sub || null;
}

/**
 * Fetch top categories
 */
export async function fetchCategories(
  limit = 6
): Promise<Tables<"categories">[]> {
  const { data, error } = await supabase
    .from("categories")
    .select("*")
    .order("name")
    .limit(limit);

  if (error) {
    console.error("Error fetching categories:", error);
    return [];
  }

  return data || [];
}

/**
 * Fetch featured listings excluding current user's listings
 * @param limit - Number of listings to fetch
 * @param currentUserId - Optional user ID to exclude their listings
 */
export async function fetchFeaturedListings(
  limit = 4,
  currentUserId?: string | null
): Promise<ListingWithCategory[]> {
  const { data, error } = await supabase
    .from("listings")
    .select(
      `
            *,
            categories (
                *
            )
        `
    )
    .order("created_at", { ascending: false })
    .limit(20); // Fetch more to ensure we get enough after filtering

  if (error) {
    console.error("Error fetching featured listings:", error);
    return [];
  }

  // Filter out current user's listings and take only the requested limit
  const filteredListings = (data || [])
    .filter((listing) => !currentUserId || listing.user_id !== currentUserId)
    .slice(0, limit);

  return filteredListings;
}
