import { createClient } from "@/utils/supabase/client";
import { Database } from "@/types/database.types";
import { GoogleOAuthProvider, GoogleLogin } from '@react-oauth/google';
import { google } from "googleapis";
// import {init, Server, readFile} from "universal-fs";


// Type definitions based on your database schema
type Listing = Database["public"]["Tables"]["listings"]["Row"];
type Profile = Database["public"]["Tables"]["profiles"]["Row"];

// Enhanced listing type with category details
export interface ListingWithCategory extends Listing {
  categories?: Database["public"]["Tables"]["categories"]["Row"] | null;
}
// type Wishlist = Database["public"]["Tables"]["wishlist"]["Row"];
// type User = { id: string };

// Initialize Supabase client
const supabase = createClient();

/**
 * Get the currently authenticated user
 */
export async function getCurrentUser() {
  const { data, error } = await supabase.auth.getClaims();

  if (error) {
    console.error("Error getting current user:", error);
    return null;
  }

  return data?.claims ? { id: data.claims.sub } : null;
}

export const handleSend = async (name, seller) => {
  const supabase = createClient();
  const userdata = await supabase.auth.getUser();
  var data_ = {}
  if (userdata != null) {
    data_ = {
      to: seller,
      subject: name,
      who: `${userdata?.data.user.user_metadata.full_name} (${userdata?.data.user.email})`
    };
  } else {
    data_ = {
      to: seller,
      subject: name,
      who: `ERROR UNKNOWN`
    }
    console.error("Not logged in")
    alert("Please log in.")
  }
  const res = await fetch("/api/email-send", {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data_)
  });
  const data = await res.json();
  console.log(data.success ? "Email sent!" : `Error: ${data.error}`);
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
