"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { createClient } from "@/utils/supabase/client";
import type { User } from "@supabase/supabase-js";
import type { JwtClaims } from "@/types/supabase";

// Create a single Supabase client instance
const supabase = createClient();

interface AuthContextType {
    user: User | null;
    userId: string | null;
    isLoading: boolean;
    signOut: () => Promise<void>;
    refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [userId, setUserId] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    const refreshUser = React.useCallback(async () => {
        try {
            // Add timeout to prevent infinite hanging
            const timeoutPromise = new Promise((_, reject) =>
                setTimeout(() => reject(new Error('Auth timeout')), 5000)
            );

            const claimsPromise = supabase.auth.getClaims();

            const { data, error } = await Promise.race([
                claimsPromise,
                timeoutPromise
            ]) as Awaited<typeof claimsPromise>;

            if (error || !data?.claims) {
                setUser(null);
                setUserId(null);
                return;
            }

            // Type-safe access to JWT claims
            const claims = data.claims as JwtClaims;
            const userId = claims.sub;

            if (!userId) {
                setUser(null);
                setUserId(null);
                return;
            }

            setUserId(userId);

            // Build user object from properly typed claims
            const userFromClaims: User = {
                id: userId,
                email: claims.email || '',
                phone: claims.phone || '',
                aud: typeof claims.aud === 'string' ? claims.aud : claims.aud[0] || 'authenticated',
                created_at: new Date(claims.iat * 1000).toISOString(),
                user_metadata: claims.user_metadata || {},
                app_metadata: claims.app_metadata || {},
                role: claims.role,
            } as User;

            setUser(userFromClaims);
        } catch (error) {
            console.error("Error refreshing user:", error);
            setUser(null);
            setUserId(null);
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
        } = supabase.auth.onAuthStateChange(async (event) => {
            if (!mounted) return;

            if (event === "SIGNED_IN" || event === "TOKEN_REFRESHED") {
                await refreshUser();
            } else if (event === "SIGNED_OUT") {
                setUser(null);
                setUserId(null);
            }
        });

        return () => {
            mounted = false;
            subscription.unsubscribe();
        };
    }, []);

    const signOut = async () => {
        await supabase.auth.signOut();
        setUser(null);
        setUserId(null);
    };

    return (
        <AuthContext.Provider
            value={{
                user,
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
