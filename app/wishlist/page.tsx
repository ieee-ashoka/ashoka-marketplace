"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import ProductCard from "@/components/ProductCard";
import { Button, Spinner } from "@heroui/react";
import { Heart, ShoppingBag } from "lucide-react";
import Link from "next/link";
import {
    getCurrentUserId,
    fetchWishlistItems,
    removeFromWishlist,
    WishlistItem,
    ListingWithCategory
} from "./helpers";

export default function WishlistPage() {
    const router = useRouter();
    const [wishlistItems, setWishlistItems] = useState<WishlistItem[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [currentUserId, setCurrentUserId] = useState<string | null>(null);

    useEffect(() => {
        async function loadWishlist() {
            try {
                // Get current user
                const userId = await getCurrentUserId();

                if (!userId) {
                    // Redirect to login if not authenticated
                    router.push("/login");
                    return;
                }

                setCurrentUserId(userId);

                // Fetch wishlist items
                const items = await fetchWishlistItems(userId);
                setWishlistItems(items);
            } catch (error) {
                console.error("Error:", error);
            } finally {
                setIsLoading(false);
            }
        }

        loadWishlist();
    }, [router]);

    // Handle removing item from wishlist
    const handleRemoveFromWishlist = async (wishlistId: number) => {
        if (!currentUserId) return;

        const success = await removeFromWishlist(wishlistId);

        if (success) {
            // Update local state
            setWishlistItems(prev => prev.filter(item => item.id !== wishlistId));
        }
    };

    if (isLoading) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center">
                <Spinner size="lg" color="primary" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background">
            <div className="max-w-7xl mx-auto px-4 py-8">
                {/* Header */}
                <div className="mb-8">
                    <div className="flex items-center gap-3 mb-2">
                        <Heart className="h-8 w-8 text-red-500" fill="currentColor" />
                        <h1 className="text-3xl font-bold text-foreground">My Wishlist</h1>
                    </div>
                    <p className="text-foreground-500">
                        {wishlistItems.length} {wishlistItems.length === 1 ? 'item' : 'items'} saved
                    </p>
                </div>

                {/* Wishlist Items */}
                {wishlistItems.length === 0 ? (
                    <div className="text-center py-16">
                        <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-default-100 mb-6">
                            <Heart className="h-12 w-12 text-default-400" />
                        </div>
                        <h2 className="text-2xl font-semibold text-foreground mb-2">
                            Your wishlist is empty
                        </h2>
                        <p className="text-foreground-500 mb-6 max-w-md mx-auto">
                            Start adding items you love to your wishlist. Browse our marketplace to discover amazing deals!
                        </p>
                        <Button
                            as={Link}
                            href="/browse"
                            color="primary"
                            size="lg"
                            startContent={<ShoppingBag size={20} />}
                        >
                            Browse Marketplace
                        </Button>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                        {wishlistItems.map((item) => (
                            item.listings && (
                                <ProductCard
                                    key={item.id}
                                    product={item.listings as ListingWithCategory}
                                    onWishlistChange={() => handleRemoveFromWishlist(item.id)}
                                    isInWishlist={true}
                                />
                            )
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
