"use client";

import React from "react";
import {
    Avatar,
    Button,
    Card,
    CardFooter,
    CardHeader,
    Tooltip,
} from "@heroui/react";
import Link from "next/link";
import { Edit, Settings, Share2 } from "lucide-react";
import { Database } from "@/types/database.types";

type Profile = Database["public"]["Tables"]["profiles"]["Row"];

interface ProfileCardProps {
    profile: Profile;
    viewOnly?: boolean; // If true, hides edit/settings/share buttons
    listingsCount: number;
    transactionsCount: number;
    wishlistCount: number;
    reputationScore: number;
    className?: string;
}

export default function ProfileCard({
    profile,
    viewOnly = false,
    listingsCount,
    transactionsCount,
    wishlistCount,
    reputationScore,
    className = "",
}: ProfileCardProps) {
    // Function to format date
    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString("en-US", {
            year: "numeric",
            month: "long",
            day: "numeric",
        });
    };

    return (
        <Card className={`mb-4 sm:mb-8 ${className}`}>
            <CardHeader className="flex flex-col sm:flex-row gap-4 sm:gap-6 p-4 sm:p-6">
                <Avatar
                    src={profile.avatar || "https://i.pravatar.cc/300"}
                    name={profile.name || "User"}
                    className="w-20 h-20 sm:w-24 sm:h-24 md:w-32 md:h-32 text-large mx-auto sm:mx-0"
                    size="lg"
                    color="primary"
                    isBordered
                    showFallback
                />

                <div className="flex flex-col flex-grow text-center sm:text-left">
                    <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:justify-between mb-2">
                        <div>
                            <h1 className="text-xl sm:text-2xl md:text-3xl font-bold">
                                {profile.name || "Ashoka User"}
                            </h1>
                            <p className="text-sm sm:text-base text-gray-500 dark:text-gray-400">
                                {profile.email}
                            </p>
                        </div>

                        {!viewOnly && (
                            <div className="flex gap-2 mt-2 sm:mt-0 justify-center sm:justify-start">
                                <Tooltip content="Edit Profile">
                                    <Button
                                        isIconOnly
                                        as={Link}
                                        href="/profile/edit"
                                        variant="flat"
                                        className="text-default-500"
                                        size="sm"
                                    >
                                        <Edit size={16} />
                                    </Button>
                                </Tooltip>

                                <Tooltip content="Settings">
                                    <Button
                                        isIconOnly
                                        as={Link}
                                        href="/profile/settings"
                                        variant="flat"
                                        className="text-default-500"
                                        size="sm"
                                    >
                                        <Settings size={16} />
                                    </Button>
                                </Tooltip>

                                <Tooltip content="Share Profile">
                                    <Button
                                        isIconOnly
                                        variant="flat"
                                        className="text-default-500"
                                        size="sm"
                                    >
                                        <Share2 size={16} />
                                    </Button>
                                </Tooltip>
                            </div>
                        )}
                    </div>

                    {profile.phn_no && (
                        <p className="text-sm sm:text-base text-gray-700 dark:text-gray-300 mb-3 sm:mb-4">
                            Contact: {profile.phn_no}
                        </p>
                    )}

                    <div className="flex flex-wrap justify-center sm:justify-start gap-4 sm:gap-6 mt-2">
                        <div className="flex flex-col items-center sm:items-start">
                            <span className="text-base sm:text-lg font-semibold">
                                {listingsCount}
                            </span>
                            <span className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">
                                Listings
                            </span>
                        </div>

                        <div className="flex flex-col items-center sm:items-start">
                            <span className="text-base sm:text-lg font-semibold">
                                {transactionsCount}
                            </span>
                            <span className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">
                                Sold
                            </span>
                        </div>

                        <div className="flex flex-col items-center sm:items-start">
                            <span className="text-base sm:text-lg font-semibold">{wishlistCount}</span>
                            <span className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">
                                Wishlist
                            </span>
                        </div>

                        <div className="flex flex-col items-center sm:items-start">
                            <div className="flex items-center">
                                <span className="text-base sm:text-lg font-semibold">
                                    {reputationScore}
                                </span>
                                <span className="text-yellow-500 ml-1">★</span>
                            </div>
                            <span className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">
                                Rating
                            </span>
                        </div>
                    </div>
                </div>
            </CardHeader>

            <CardFooter className="py-2 sm:py-3 px-4 sm:px-6 text-xs sm:text-sm text-gray-500 dark:text-gray-400 border-t border-default-200">
                <p>Member since {formatDate(profile.created_at)}</p>
            </CardFooter>
        </Card>
    );
}