import { createClient } from "@/utils/supabase/client";
import { Database } from "@/types/database.types";

// Type definitions based on your database schema
type Listing = Database["public"]["Tables"]["listings"]["Row"];
type Profile = Database["public"]["Tables"]["profiles"]["Row"];

// Enhanced listing type with category details
export interface ListingWithCategory extends Listing {
  categories?: Database["public"]["Tables"]["categories"]["Row"] | null;
}

// Initialize Supabase client
const supabase = createClient();

/**
 * Get the currently authenticated user
 */
export async function getCurrentUser() {
  try {
    const { data, error } = await supabase.auth.getClaims();

    if (error) {
      console.error("Error getting current user:", error);
      return null;
    }

    return data?.claims ? { id: data.claims.sub, user: data.claims } : null;
  } catch (error) {
    console.error("Exception getting current user:", error);
    return null;
  }
}

export const handleSend = async (
  name: string,
  seller: string,
  sellerName: string,
  userName: string,
  userEmail: string
): Promise<boolean> => {
  const userdata = await getCurrentUser();
  if (!userdata?.id) {
    console.error("No user logged in");
    return false;
  }

  const data_ = {
    to: seller,
    toName: sellerName,
    subject: name,
    fromName: userName,
    fromEmail: userEmail,
  };

  console.log("Sending email with data:", data_);

  try {
    const res = await fetch("/api/email-send", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data_),
    });
    const data = await res.json();

    if (data.success) {
      console.log("Email sent!");
      return true;
    } else {
      console.error(`Error: ${data.error}`);
      return false;
    }
  } catch (error) {
    console.error("Failed to send email:", error);
    return false;
  }
};

/**
 * Fetch a listing by ID with category details
 */
export async function getListingById(
  listingId: string | number
): Promise<ListingWithCategory | null> {
  const id = typeof listingId === "string" ? parseInt(listingId) : listingId;

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
    return null;
  }

  return data;
}

/**
 * Check if a listing is in the user's wishlist
 */
export async function isListingInWishlist(
  userId: string,
  listingId: number
): Promise<boolean> {
  const { data, error } = await supabase
    .from("wishlist")
    .select("*")
    .eq("user_id", userId)
    .eq("listing_id", listingId)
    .maybeSingle();

  if (error) {
    console.error("Error checking wishlist:", error);
    return false;
  }

  return !!data;
}

/**
 * Get seller profile by user ID
 */
export async function getSellerProfile(
  userId: string
): Promise<Profile | null> {
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("user_id", userId)
    .single();

  if (error) {
    console.error("Error fetching seller profile:", error);
    return null;
  }

  return data;
}

/**
 * Get similar listings by category
 */
export async function getSimilarListings(
  categoryId: number,
  currentListingId: number,
  limit = 4
): Promise<ListingWithCategory[]> {
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
    .eq("category", categoryId)
    .neq("id", currentListingId)
    .not("expired_at", "lt", new Date().toISOString())
    .limit(limit);

  if (error) {
    console.error("Error fetching similar listings:", error);
    return [];
  }

  return data || [];
}

/**
 * Add a listing to user's wishlist
 */
export async function addToWishlist(
  userId: string,
  listingId: number
): Promise<boolean> {
  const { error } = await supabase.from("wishlist").insert({
    user_id: userId,
    listing_id: listingId,
  });

  if (error) {
    console.error("Error adding to wishlist:", error);
    return false;
  }

  return true;
}

/**
 * Remove a listing from user's wishlist
 */
export async function removeFromWishlist(
  userId: string,
  listingId: number
): Promise<boolean> {
  const { error } = await supabase
    .from("wishlist")
    .delete()
    .eq("user_id", userId)
    .eq("listing_id", listingId);

  if (error) {
    console.error("Error removing from wishlist:", error);
    return false;
  }

  return true;
}

/**
 * Check if a listing is active (not expired)
 */
export function isListingActive(listing: Listing): boolean {
  if (!listing.expired_at) return true;
  return new Date(listing.expired_at) > new Date();
}

export async function isInterested(
  listingId: string | number,
  userId: string
): Promise<boolean> {
  const id = typeof listingId === "string" ? parseInt(listingId) : listingId;

  const { data, error } = await supabase
    .from("interested")
    .select()
    .eq("listing_id", id)
    .eq("user_id", userId)
    .maybeSingle();

  if (error) {
    console.error("Error checking if user is interested:", error);
    return false;
  }

  return !!data; // Returns true if a row exists
}

export async function getInterestedCount(
  listingId: string | number
): Promise<number> {
  const id = typeof listingId === "string" ? parseInt(listingId) : listingId;

  const { count, error } = await supabase
    .from("interested")
    .select("*", { count: "exact", head: true })
    .eq("listing_id", id);

  if (error) {
    console.error("Error fetching interested count:", error);
    return 0;
  }

  return count || 0;
}

export async function addInterestedUser(
  listingId: string | number,
  userId: string
): Promise<boolean> {
  const id = typeof listingId === "string" ? parseInt(listingId) : listingId;

  // Insert new interested row
  const { error } = await supabase.from("interested").insert({
    listing_id: id,
    user_id: userId,
  });

  if (error) {
    console.error("Error adding interested user:", error);
    return false;
  }

  return true;
}

export async function removeInterestedUser(
  listingId: string | number,
  userId: string
): Promise<boolean> {
  const id = typeof listingId === "string" ? parseInt(listingId) : listingId;

  // Delete the interested row
  const { error } = await supabase
    .from("interested")
    .delete()
    .eq("listing_id", id)
    .eq("user_id", userId);

  if (error) {
    console.error("Error removing interested user:", error);
    return false;
  }

  return true;
}
