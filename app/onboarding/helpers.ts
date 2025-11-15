"use client";

import { createClient } from "@/utils/supabase/client";
import { TablesInsert } from "@/types/database.types";

// Create a single Supabase client instance
const supabase = createClient();

/**
 * Get current user ID and metadata from JWT claims
 */
export async function getCurrentUserData(): Promise<{
  userId: string | null;
  metadata: Record<string, unknown> | null;
}> {
  const { data, error } = await supabase.auth.getClaims();

  if (error || !data?.claims) {
    console.error("Error getting user claims:", error);
    return { userId: null, metadata: null };
  }

  // Get full user object for metadata
  const { data: userData } = await supabase.auth.getUser();

  return {
    userId: data.claims.sub || null,
    metadata: userData?.user?.user_metadata || null,
  };
}

/**
 * Check if profile exists for current user
 */
export async function checkProfileExists(userId: string): Promise<boolean> {
  const { data } = await supabase
    .from("profiles")
    .select("*")
    .eq("user_id", userId)
    .single();

  return !!data;
}

/**
 * Create a new profile
 */
export async function createProfile(
  profileData: TablesInsert<"profiles">
): Promise<{
  success: boolean;
  message: string;
  error?: string;
}> {
  try {
    const { error } = await supabase.from("profiles").insert([profileData]);

    if (error) {
      console.error("Error creating profile:", error);
      return {
        success: false,
        message: "Failed to create profile",
        error: error.message,
      };
    }

    return {
      success: true,
      message: "Profile created successfully",
    };
  } catch (error) {
    console.error("Unexpected error creating profile:", error);
    return {
      success: false,
      message: "An unexpected error occurred",
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}
