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
import BuyerProfileCard from "@/components/BuyerProfileCard";
import { useParams } from "next/navigation";
import {
    isListingOwnerAndListingExists
} from "./helpers";

export default function ListingsPage() {
  const params = useParams();
  const listingId = params.id as string;
    // State management
    const [buyers, setBuyers] = useState<Array<{avatar: string | null; name: string | null; created_at: string | null; user_id: string | null}>>([]);;
    const [loading, setLoading] = useState(true);
    const [isOwnerAndExists, setIsOwnerAndExists] = useState<boolean>(false);
    const [searchQuery, setSearchQuery] = useState("");
    const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
    const [currentPage, setCurrentPage] = useState(1);
    const [name, setName] = useState<string | null>(null);
    const itemsPerPage = 12;

    const supabase = createClient();

    async function getListingBuyers(
  listingId: string | number
): Promise<Array<{avatar: string | null; name: string | null; created_at: string | null; user_id: string | null}>> {
    try {
      setLoading(true);
      const id = typeof listingId === "string" ? parseInt(listingId) : listingId;
      const buyers: Array<{avatar: string | null; name: string | null; created_at: string | null; user_id: string | null}> = [];

      const { data, error } = await supabase
      .from("interested")
      .select()
      .eq("listing_id", id)
      .single();

      if (error) {
        console.error("Error fetching listing:", error);
        setLoading(false);
        return [];
      };

      for (const userId of data.interested) {
      const { data: userData, error: userError } = await supabase
          .from("profiles")
          .select("avatar, name, created_at, user_id")
          .eq("user_id", userId)
          .single();
      if (userError) {
          console.error("Error fetching user data:", userError);
          continue;
      }
        buyers.push(userData);
      }

      setLoading(false);

      return buyers;
    } catch (error) {
        console.error("Error fetching listing buyers:", error);
        setLoading(false);
        return [];
    }
  }

    // Fetch listings on component mount
    useEffect(() => {
        async function fetchBuyers() {
            const buyers = await getListingBuyers(listingId);
            setBuyers(buyers);
        }
        fetchBuyers();
    }, [listingId]);

    useEffect(() => {
        async function checkIsOwnerAndExists() {
            const owner = await isListingOwnerAndListingExists(listingId);
            setIsOwnerAndExists(owner.cond);
            setName(owner.name);
        }
        checkIsOwnerAndExists();
    }, [listingId]);

    // Filter and search logic
    const processedBuyers = useMemo(() => {
        let result = [...buyers];

        // Search filter
        if (searchQuery) {
            const query = searchQuery.toLowerCase();
            result = result.filter(
                (buyer) =>
                    buyer.name?.toLowerCase().includes(query) ||
                    buyer.user_id?.toLowerCase().includes(query)
            );
        }

        return result;
    }, [buyers, searchQuery]);

    // Pagination
    const paginatedListings = useMemo(() => {
        const startIndex = (currentPage - 1) * itemsPerPage;
        return buyers.slice(startIndex, startIndex + itemsPerPage);
    }, [buyers, currentPage]);

    const totalPages = Math.ceil(buyers.length / itemsPerPage);

    // Reset page when filters change
    useEffect(() => {
        setCurrentPage(1);
    }, [searchQuery]);

    // Clear all filters
    const clearFilters = () => {
        setSearchQuery("");
    };

    // Not authorized
    if (!isOwnerAndExists || !listingId) {
        return (
            <div className="container mx-auto px-4 py-8 max-w-2xl">
                <div className="bg-red-100 dark:bg-red-900/30 border border-red-400 dark:border-red-700 text-red-700 dark:text-red-400 rounded-lg p-4">
                    {"You don't have permission to edit this listing."}
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background">
            {/* Header */}
            <div className="bg-content1 border-b border-divider sticky top-0 z-40">
                <div className="max-w-7xl mx-auto px-4 py-4">
                    <div className="flex flex-col gap-4">
                        {/* Title and Stats */}
                        <div className="flex justify-between items-center">
                            <div>
                                <h1 className="text-2xl font-bold text-foreground">Sell {name}</h1>
                                <p className="text-foreground-500 text-sm mt-1">
                                    {buyers.length} interested buyers
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
                                placeholder="Search buyers..."
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
                                {buyers.length === 0 ? (
                                    <Card className="p-8 text-center">
                                        <CardBody>
                                            <p className="text-foreground-500 text-lg mb-4">No buyers interested</p>
                                            <p className="text-foreground-400">
                                                Once buyers express interest, they will appear here.
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
                                            {processedBuyers.map((buyer) => (
                                                <BuyerProfileCard
                                                    key={buyer.user_id}
                                                    {...buyer}
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