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
            const { data, error } = await supabase.auth.getClaims();

            if (error || !data?.claims) {
                setUser(null);
                setUserId(null);
                return;
            }

            // Get full user object for additional data
            const { data: userData } = await supabase.auth.getUser();

            setUserId(data.claims.sub || null);
            setUser(userData?.user || null);
        } catch (error) {
            console.error("Error refreshing user:", error);
            setUser(null);
            setUserId(null);
        }
    };

    useEffect(() => {
        // Initial auth check
        refreshUser().finally(() => setIsLoading(false));

        // Listen for auth changes
        const {
            data: { subscription },
        } = supabase.auth.onAuthStateChange(async (event) => {
            if (event === "SIGNED_IN" || event === "TOKEN_REFRESHED") {
                await refreshUser();
            } else if (event === "SIGNED_OUT") {
                setUser(null);
                setUserId(null);
            }
        });

        return () => {
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
