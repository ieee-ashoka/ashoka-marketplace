"use client";

import { createClient } from "@/utils/supabase/client";

// Create a single Supabase client instance
const supabase = createClient();

/**
 * Sign out the current user
 */
export async function signOut(): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    const { error } = await supabase.auth.signOut();

    if (error) {
      console.error("Error signing out:", error);
      return {
        success: false,
        error: error.message,
      };
    }

    return {
      success: true,
    };
  } catch (error) {
    console.error("Unexpected error signing out:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}
