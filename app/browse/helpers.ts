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
 * Fetch all active listings with category details
 */
export async function fetchActiveListings(): Promise<ListingWithCategory[]> {
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
 * Fetch all categories
 */
export async function fetchCategories(): Promise<Category[]> {
  try {
    const { data, error } = await supabase
      .from("categories")
      .select("*")
      .order("name");

    if (error) {
      console.error("Error fetching categories:", error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error("Unexpected error fetching categories:", error);
    return [];
  }
}
