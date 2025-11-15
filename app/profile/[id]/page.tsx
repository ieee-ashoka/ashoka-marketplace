"use client";

import React, { useEffect, useState } from "react";
import { createClient } from "@/utils/supabase/client";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
    Button,
    Chip,
} from "@heroui/react";
import {
    ArrowLeft,
    ShoppingBag,
} from "lucide-react";
import { Database } from "@/types/database.types";
import ProductCard from "@/components/ProductCard";
import ProfileSkeleton from "@/components/loading/profile";
import ProfileCard from "@/components/ProfileCard";

// Use types from the database schema
type Profile = Database["public"]["Tables"]["profiles"]["Row"];
type Listing = Database["public"]["Tables"]["listings"]["Row"];

// Enhanced listing type with category details
type ListingWithCategory = Listing & {
    categories?: Database["public"]["Tables"]["categories"]["Row"] | null;
};

// Initialize Supabase client
const supabase = createClient();

export default function UserProfilePage() {
    const params = useParams();
    const router = useRouter();
    const userId = params.id as string;

    const [profile, setProfile] = useState<Profile | null>(null);
    const [userListings, setUserListings] = useState<ListingWithCategory[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isOwnProfile, setIsOwnProfile] = useState(false);

    useEffect(() => {
        async function fetchUserProfile() {
            try {
                // Check if viewing own profile
                const { data: authData } = await supabase.auth.getClaims();
                const currentUserId = authData?.claims?.sub;

                // Determine lookup method - by user_id (UUID) or username
                let profileQuery = supabase.from("profiles").select("*");

                // Try to match by user_id first (if it's a UUID format)
                const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
                if (uuidRegex.test(userId)) {
                    profileQuery = profileQuery.eq("user_id", userId);
                } else {
                    // Otherwise match by username
                    profileQuery = profileQuery.eq("username", userId);
                }

                const { data: profileData, error: profileError } = await profileQuery.single();

                if (profileError || !profileData) {
                    console.error("Error fetching profile:", profileError);
                    setIsLoading(false);
                    return;
                }

                setProfile(profileData);
                setIsOwnProfile(currentUserId === profileData.user_id);

                // Fetch user's active listings
                const { data: listingsData, error: listingsError } = await supabase
                    .from("listings")
                    .select(`
            *,
            categories (
              id,
              name,
              key,
              icon,
              color,
              iconColor
            )
          `)
                    .eq("user_id", profileData.user_id)
                    .is("expired_at", null)
                    .order("created_at", { ascending: false });

                if (listingsError) {
                    console.error("Error fetching listings:", listingsError);
                } else {
                    setUserListings(listingsData || []);
                }
            } catch (error) {
                console.error("Error in fetchUserProfile:", error);
            } finally {
                setIsLoading(false);
            }
        }

        if (userId) {
            fetchUserProfile();
        }
    }, [userId]);

    // Function to determine listing status
    const getListingStatus = (listing: Listing) => {
        if (!listing.expired_at) return "active";
        const now = new Date();
        const expiredAt = new Date(listing.expired_at);
        return now > expiredAt ? "expired" : "active";
    };

    if (isLoading) {
        return <ProfileSkeleton />;
    }

    if (!profile) {
        return (
            <div className="container mx-auto px-2 sm:px-4 py-8 sm:py-16 text-center">
                <h2 className="text-xl sm:text-2xl font-bold mb-3 sm:mb-4">Profile Not Found</h2>
                <p className="text-gray-600 dark:text-gray-400 mb-6 sm:mb-8">
                    We couldn&apos;t find this user&apos;s profile. They may not exist or their profile may be private.
                </p>
                <Button as={Link} href="/browse" color="primary" size="sm" className="sm:text-base">
                    Browse Listings
                </Button>
            </div>
        );
    }

    // Redirect to own profile if viewing own user ID
    if (isOwnProfile) {
        router.push("/profile");
        return null;
    }

    // Calculate stats
    const activeListings = userListings.filter(l => getListingStatus(l) === "active");
    const reputationScore = 4.8; // Placeholder - would come from actual reviews
    const transactionsCompleted = 0; // Placeholder - would come from actual sales

    return (
        <div className="container bg-background mx-auto px-6 sm:px-4 py-6 sm:py-8 mb-10 max-w-6xl">
            {/* Back Button */}
            <Button
                as={Link}
                href="/browse"
                variant="light"
                startContent={<ArrowLeft size={18} />}
                className="mb-4"
            >
                Back to Browse
            </Button>

            {/* Profile Header Card */}
            <ProfileCard
                profile={profile}
                viewOnly={true}
                listingsCount={activeListings.length}
                transactionsCount={transactionsCompleted}
                wishlistCount={0} // Don't show wishlist count for other users
                reputationScore={reputationScore}
            />

            {/* User's Active Listings */}
            <div className="mb-6">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl sm:text-2xl font-bold text-foreground flex items-center gap-2">
                        Active Listings
                        <Chip size="sm" color="primary" variant="flat">
                            {activeListings.length}
                        </Chip>
                    </h2>
                </div>

                {activeListings.length === 0 ? (
                    <div className="text-center py-12 bg-default-50 rounded-lg">
                        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-default-100 mb-4">
                            <ShoppingBag size={32} className="text-default-400" />
                        </div>
                        <h3 className="text-lg sm:text-xl font-semibold mb-2 text-foreground">No Active Listings</h3>
                        <p className="text-sm sm:text-base text-gray-500 dark:text-gray-400 max-w-md mx-auto">
                            {profile.name || "This user"} doesn&apos;t have any active listings at the moment.
                        </p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4">
                        {activeListings.map((listing) => (
                            <ProductCard
                                key={listing.id}
                                product={listing}
                                showActive={false}
                                isActive={true}
                            />
                        ))}
                    </div>
                )}
            </div>

            {/* Additional Info */}
            <div className="mt-8 p-4 bg-default-50 rounded-lg">
                <p className="text-sm text-default-600 text-center">
                    Want to report this user or listing? Contact us at{" "}
                    {/* Add email with subject as report for user/listing mentioning the user name and id*/}
                    <Link
                        href={`mailto:ieee.asb@ashoka.edu.in?subject=Report%20User%20${encodeURIComponent(profile.name || "Unknown")}%20(ID:%20${userId})`}
                        target="_blank"
                        className="text-primary hover:underline"
                    >
                        IEEE Ashoka Support Email
                    </Link>
                </p>
            </div>
        </div>
    );
}
