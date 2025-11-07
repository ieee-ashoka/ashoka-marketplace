"use client";
import React, { useState, useEffect, useMemo, useCallback } from "react";
import {
    Input,
    Button,
    Select,
    SelectItem,
    Slider,
    Card,
    CardBody,
    CardHeader,
    Chip,
    Spinner,
    Pagination,
    Modal,
    ModalContent,
    ModalHeader,
    ModalBody,
    useDisclosure,
    Accordion,
    AccordionItem,
} from "@heroui/react";
import {
    Search,
    Filter,
    Grid3X3,
    List
} from "lucide-react";
import { createClient } from "@/utils/supabase/client";
import { Tables } from "@/types/database.types";
import ListingCard from "@/components/ListingCard";

// Enhanced listing type with category details
interface ListingWithCategory extends Tables<"listings"> {
    categories?: Tables<"categories"> | null;
}

export default function ListingsPage() {
    // State management
    const [listings, setListings] = useState<ListingWithCategory[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 12;

    const supabase = createClient();

    const fetchListings = useCallback(async () => {
        try {
            setLoading(true);

            // Fetch listings with category details
            const { data: userData, error: userError } = await supabase.auth.getUser();
            if (userError) throw userError;
            const user = userData?.user;
            if (!user) {
                // No logged-in user — return empty results
                setListings([]);
                return;
            }

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
                .eq("user_id", user.id)
                .not("expired_at", "lt", new Date().toISOString());

            if (listingsError) throw listingsError;

            setListings(listingsData || []);
        } catch (error) {
            console.error("Error fetching data:", error);
        } finally {
            setLoading(false);
        }
    }, [supabase]);

    // Fetch listings on component mount
    useEffect(() => {
        fetchListings();
    }, [fetchListings]);

    // Filter and search logic
    const processedListings = useMemo(() => {
        let result = [...listings];

        // Search filter
        if (searchQuery) {
            const query = searchQuery.toLowerCase();
            result = result.filter(
                (listing) =>
                    listing.name?.toLowerCase().includes(query) ||
                    listing.description?.toLowerCase().includes(query) ||
                    listing.categories?.name?.toLowerCase().includes(query)
            );
        }

        return result;
    }, [listings, searchQuery]);

    // Pagination
    const paginatedListings = useMemo(() => {
        const startIndex = (currentPage - 1) * itemsPerPage;
        return processedListings.slice(startIndex, startIndex + itemsPerPage);
    }, [processedListings, currentPage]);

    const totalPages = Math.ceil(processedListings.length / itemsPerPage);

    // Reset page when filters change
    useEffect(() => {
        setCurrentPage(1);
    }, [searchQuery]);

    // Clear all filters
    const clearFilters = () => {
        setSearchQuery("");
    };

    return (
        <div className="min-h-screen bg-background">
            {/* Header */}
            <div className="bg-content1 border-b border-divider sticky top-0 z-40">
                <div className="max-w-7xl mx-auto px-4 py-4">
                    <div className="flex flex-col gap-4">
                        {/* Title and Stats */}
                        <div className="flex justify-between items-center">
                            <div>
                                <h1 className="text-2xl font-bold text-foreground">My Active Listings</h1>
                                <p className="text-foreground-500 text-sm mt-1">
                                    {processedListings.length} items listed
                                </p>
                            </div>

                            {/* View Mode Toggle - Desktop */}
                            <div className="hidden md:flex gap-2">
                                <Button
                                    isIconOnly
                                    variant={viewMode === "grid" ? "solid" : "light"}
                                    color="primary"
                                    onPress={() => setViewMode("grid")}
                                >
                                    <Grid3X3 size={18} />
                                </Button>
                                <Button
                                    isIconOnly
                                    variant={viewMode === "list" ? "solid" : "light"}
                                    color="primary"
                                    onPress={() => setViewMode("list")}
                                >
                                    <List size={18} />
                                </Button>
                            </div>
                        </div>

                        {/* Search Bar */}
                        <div className="flex gap-3">
                            {/* Search Input */}
                            <Input
                                placeholder="Search products..."
                                startContent={<Search size={18} className="text-foreground-400" />}
                                value={searchQuery}
                                onValueChange={setSearchQuery}
                                className="flex-1"
                                isClearable
                            />
                        </div>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 py-6">
                <div className="flex gap-6">
                    {/* Main Content */}
                    <main className="flex-1 min-w-0">
                        {loading ? (
                            <div className="flex justify-center py-12">
                                <Spinner size="lg" />
                            </div>
                        ) : (
                            <>
                                {/* Results Grid/List */}
                                {paginatedListings.length === 0 ? (
                                    <Card className="p-8 text-center">
                                        <CardBody>
                                            <p className="text-foreground-500 text-lg mb-4">No products found</p>
                                            <p className="text-foreground-400">
                                                Try adjusting your filters or search terms
                                            </p>
                                            <Button
                                                color="primary"
                                                variant="flat"
                                                onPress={clearFilters}
                                                className="mt-4"
                                            >
                                                Clear Filters
                                            </Button>
                                        </CardBody>
                                    </Card>
                                ) : (
                                    <>
                                        <div className={
                                            viewMode === "grid"
                                                ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
                                                : "flex flex-col gap-4"
                                        }>
                                            {paginatedListings.map((listing) => (
                                                <ListingCard
                                                    key={listing.id}
                                                    product={listing}
                                                    className={viewMode === "list" ? "flex-row" : ""}
                                                />
                                            ))}
                                        </div>

                                        {/* Pagination */}
                                        {totalPages > 1 && (
                                            <div className="flex justify-center mt-8">
                                                <Pagination
                                                    total={totalPages}
                                                    page={currentPage}
                                                    onChange={setCurrentPage}
                                                    showControls
                                                    showShadow
                                                    color="primary"
                                                />
                                            </div>
                                        )}
                                    </>
                                )}
                            </>
                        )}
                    </main>
                </div>
            </div>
        </div>
    );
}