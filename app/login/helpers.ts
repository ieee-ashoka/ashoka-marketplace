"use client";

import { createClient } from "@/utils/supabase/client";

// Create a single Supabase client instance
const supabase = createClient();

/**
 * Check if user is already logged in
 */
export async function checkUserLoggedIn(): Promise<boolean> {
  const { data } = await supabase.auth.getClaims();
  return !!data?.claims;
}

/**
 * Sign in with OAuth provider
 */
export async function signInWithOAuth(
  provider: "google" | "github",
  redirectUrl: string
): Promise<void> {
  await supabase.auth.signInWithOAuth({
    provider,
    options: {
      redirectTo: redirectUrl,
    },
  });
}
