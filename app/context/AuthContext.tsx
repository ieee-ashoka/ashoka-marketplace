"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { createClient } from "@/utils/supabase/client";
import type { JwtClaims } from "@/types/supabase";

// Create a single Supabase client instance
const supabase = createClient();

interface AuthContextType {
    claims: JwtClaims | null;
    userId: string | null;
    isLoading: boolean;
    signOut: () => Promise<void>;
    refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [claims, setClaims] = useState<JwtClaims | null>(null);
    const [userId, setUserId] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const isRefreshing = React.useRef(false);

    const refreshUser = React.useCallback(async () => {
        // Prevent concurrent refresh calls
        if (isRefreshing.current) {
            return;
        }

        try {
            isRefreshing.current = true;

            const { data, error } = await supabase.auth.getClaims();

            if (error || !data?.claims) {
                setClaims(null);
                setUserId(null);
                return;
            }

            // Type-safe access to JWT claims
            const jwtClaims = data.claims as JwtClaims;
            const userId = jwtClaims.sub;

            if (!userId) {
                setClaims(null);
                setUserId(null);
                return;
            }

            setUserId(userId);
            setClaims(jwtClaims);
        } catch (error) {
            console.error("Error refreshing user:", error);
            setClaims(null);
            setUserId(null);
        } finally {
            isRefreshing.current = false;
        }
    }, []);

    useEffect(() => {
        let mounted = true;

        // Initial auth check with proper cleanup
        const initAuth = async () => {
            if (!mounted) return;
            await refreshUser();
            if (mounted) {
                setIsLoading(false);
            }
        };

        initAuth();

        // Listen for auth changes
        const {
            data: { subscription },
        } = supabase.auth.onAuthStateChange(async (event, session) => {
            if (!mounted) return;

            // Only refresh on actual auth events, not on passive state changes
            if (event === "SIGNED_IN") {
                await refreshUser();
            } else if (event === "SIGNED_OUT") {
                setClaims(null);
                setUserId(null);
            } else if (event === "TOKEN_REFRESHED" && session) {
                // Update claims directly from session instead of refetching
                const jwtClaims = session.user as unknown as JwtClaims;
                setClaims(jwtClaims);
                setUserId(jwtClaims.sub);
            }
        });

        return () => {
            mounted = false;
            subscription.unsubscribe();
        };
    }, [refreshUser]);

    const signOut = async () => {
        await supabase.auth.signOut();
        setClaims(null);
        setUserId(null);
    };

    return (
        <AuthContext.Provider
            value={{
                claims,
                userId,
                isLoading,
                signOut,
                refreshUser,
            }}
        >
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error("useAuth must be used within an AuthProvider");
    }
    return context;
}
