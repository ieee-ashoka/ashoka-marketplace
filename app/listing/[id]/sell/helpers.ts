"use client";

import { createClient } from "@/utils/supabase/client";

export async function getListingBuyers(
  listingId: string | number
): Promise<Array<{avatar: string | null; name: string | null; created_at: string | null; user_id: string | null}>> {
  try {
    const supabase = createClient();
    const id = typeof listingId === "string" ? parseInt(listingId) : listingId;
    const buyers: Array<{avatar: string | null; name: string | null; created_at: string | null; user_id: string | null}> = [];

    const { data, error } = await supabase
      .from("interested")
      .select()
      .eq("listing_id", id)
      .single();

    if (error) {
      console.error("Error fetching listing:", error);
      return [];
    };

    for (const userId of data.interested) {
      const { data: userData, error: userError } = await supabase
        .from("profiles")
        .select("avatar, name, created_at, user_id")
        .eq("user_id", userId)
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
): Promise<{ cond: boolean, name: string | null }> {
  let userId: string | null = null;
  const id = typeof listingId === "string" ? parseInt(listingId) : listingId;
  const supabase = createClient();
  try {
    const { data: userData, error: userError } = await supabase.auth.getClaims();

    if (userError) {
      console.error("Error getting current user:", userError);
      return { cond: false, name: null };
    }

    if (userData?.claims) {
      userId = userData.claims.sub;
    } else {
      return { cond: false, name: null };
    }

    if (!userId) return { cond: false, name: null };

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
