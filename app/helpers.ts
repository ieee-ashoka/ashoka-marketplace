import { createClient } from "@/utils/supabase/client";
import { Tables } from "@/types/database.types";

const supabase = createClient();

export interface ListingWithCategory extends Tables<"listings"> {
  categories?: Tables<"categories"> | null;
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
 * @param currentUserId - Optional user ID to exclude their listings (from useAuth)
 */
export async function fetchFeaturedListings(
  limit = 4,
  currentUserId?: string | null
): Promise<ListingWithCategory[]> {
  let query = supabase
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
    .limit(limit);

  // Filter out current user's listings in SQL if userId is provided
  if (currentUserId) {
    query = query.neq("user_id", currentUserId);
  }

  const { data, error } = await query;

  if (error) {
    console.error("Error fetching featured listings:", error);
    return [];
  }

  return data || [];
}
