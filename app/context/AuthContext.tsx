"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { createClient } from "@/utils/supabase/client";
import type { User } from "@supabase/supabase-js";

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

    const refreshUser = async () => {
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

            // Build user object from claims - no need for second getUser() call
            const userId = data.claims.sub || null;
            setUserId(userId);

            // Create a minimal user object from claims
            if (userId) {
                const userFromClaims: User = {
                    id: userId,
                    email: data.claims.email as string,
                    user_metadata: data.claims.user_metadata || {},
                    app_metadata: {},
                    aud: 'authenticated',
                    created_at: '',
                } as User;
                setUser(userFromClaims);
            } else {
                setUser(null);
            }
        } catch (error) {
            console.error("Error refreshing user:", error);
            setUser(null);
            setUserId(null);
        }
    };

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
