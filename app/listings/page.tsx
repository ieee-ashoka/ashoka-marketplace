"use client";
import React, { useState, useEffect, useMemo, useCallback } from "react";
import {
    Input,
    Button,
    Card,
    CardBody,
    Spinner,
    Pagination,
    useDisclosure,
    Modal,
    ModalHeader,
    ModalContent,
    ModalFooter,
    ModalBody
} from "@heroui/react";
import {
    Search,
    Grid3X3,
    List
} from "lucide-react";
import { Tables } from "@/types/database.types";
import ListingCard from "@/components/ListingCard";
import { fetchUserListings, deleteListing as deleteListingHelper } from "./helpers";

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
    const [selectedListingId, setSelectedListingId] = useState<number | null>(null);
    const { isOpen, onOpen, onOpenChange } = useDisclosure();
    const [isDeleted, setIsDeleted] = useState(false);
    const itemsPerPage = 12;

    async function deleteListing() {
        const id = typeof selectedListingId === "string" ? parseInt(selectedListingId) : selectedListingId;
        if (!id) return;

        try {
            setLoading(true);
            setIsDeleted(false);

            const result = await deleteListingHelper(id);

            if (!result.success) {
                console.error("Error deleting listing:", result.error);
                setLoading(false);
                return;
            }

            setListings((prev) => prev.filter((l) => l.id !== id));
            setIsDeleted(true);
            onOpen();
        } catch (err) {
            console.error("Unexpected error in delete():", err);
        } finally {
            setLoading(false);
        }
    }


    const fetchListings = useCallback(async () => {
        try {
            setLoading(true);

            const listingsData = await fetchUserListings();
            setListings(listingsData);
        } catch (error) {
            console.error("Error fetching data:", error);
        } finally {
            setLoading(false);
        }
    }, []);

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
        <>
            <Modal isOpen={isOpen} onOpenChange={onOpenChange}>
                <ModalContent>
                    {(onClose) => (
                        <>
                            <ModalHeader className="flex flex-col gap-1">{isDeleted ? "Listing Deleted" : "Delete Listing?"}</ModalHeader>
                            <ModalBody>
                                <p>
                                    {!isDeleted ? "This action will remove the listing from the marketplace." : "The listing has been sucessfully deleted."}
                                </p>
                                {!isDeleted && <p>
                                    Deleting this listing is permanent and cannot be undone. Are you sure you want to proceed?
                                </p>}
                            </ModalBody>
                            <ModalFooter>
                                <Button color="primary" onPress={() => { onClose(); }}>
                                    Close
                                </Button>
                                {!isDeleted && <Button color="danger" onPress={() => { deleteListing(); onClose(); }}>
                                    Delete
                                </Button>}
                            </ModalFooter>
                        </>
                    )}
                </ModalContent>
            </Modal>
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
                                                        onDelete={() => { setSelectedListingId(listing.id); onOpen(); }}
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
        </>
    );
}