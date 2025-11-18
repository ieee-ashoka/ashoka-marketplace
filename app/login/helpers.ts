"use client";

import { createClient } from "@/utils/supabase/client";
import type { JwtClaims } from "@/types/supabase";

// Create a single Supabase client instance
const supabase = createClient();

/**
 * Check if user is already logged in
 */
export async function checkUserLoggedIn(): Promise<boolean> {
  const { data } = await supabase.auth.getClaims();
  if (!data?.claims) return false;

  const claims = data.claims as JwtClaims;
  return !!claims.sub;
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
