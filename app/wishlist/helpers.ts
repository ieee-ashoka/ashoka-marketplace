import { createClient } from "@/utils/supabase/client";
import { Tables } from "@/types/database.types";

const supabase = createClient();

// Enhanced listing type with category details
export interface ListingWithCategory extends Tables<"listings"> {
  categories?: Tables<"categories"> | null;
}

export interface WishlistItem extends Tables<"wishlist"> {
  listings?: ListingWithCategory | null;
}

/**
 * Get current user ID from JWT claims
 */
export async function getCurrentUserId(): Promise<string | null> {
  const { data, error } = await supabase.auth.getClaims();

  if (error || !data?.claims) {
    console.error("Error getting user claims:", error);
    return null;
  }

  return data.claims.sub || null;
}

/**
 * Fetch wishlist items for a user
 */
export async function fetchWishlistItems(
  userId: string
): Promise<WishlistItem[]> {
  const { data, error } = await supabase
    .from("wishlist")
    .select(
      `
            *,
            listings (
                *,
                categories (
                    id,
                    name,
                    key,
                    icon,
                    color,
                    iconColor
                )
            )
        `
    )
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching wishlist:", error);
    return [];
  }

  // Filter out items where listing is null (deleted listings)
  return (data || []).filter((item) => item.listings !== null);
}

/**
 * Remove item from wishlist
 */
export async function removeFromWishlist(wishlistId: number): Promise<boolean> {
  const { error } = await supabase
    .from("wishlist")
    .delete()
    .eq("id", wishlistId);

  if (error) {
    console.error("Error removing from wishlist:", error);
    return false;
  }

  return true;
}
