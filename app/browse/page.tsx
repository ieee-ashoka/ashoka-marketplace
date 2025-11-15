"use client";
import React, { useState, useEffect, useMemo, useCallback, Suspense } from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
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
import { Tables } from "@/types/database.types";
import ProductCard from "@/components/ProductCard";
import { fetchActiveListings, fetchCategories as fetchCategoriesHelper } from "./helpers";

// Enhanced listing type with category details
interface ListingWithCategory extends Tables<"listings"> {
    categories?: Tables<"categories"> | null;
}

// Filter interfaces
interface PriceRange {
    min: number;
    max: number;
}

interface Filters {
    category: number | null;
    condition: string;
    priceRange: PriceRange;
    productAge: number | null;
    sortBy: string;
}

// Categories will be fetched from database

const CONDITIONS = [
    "New",
    "Like New",
    "Good",
    "Fair",
    "Poor"
];

const SORT_OPTIONS = [
    { key: "newest", label: "Newest First" },
    { key: "oldest", label: "Oldest First" },
    { key: "price_low", label: "Price: Low to High" },
    { key: "price_high", label: "Price: High to Low" },
    { key: "name_asc", label: "Name: A to Z" },
    { key: "name_desc", label: "Name: Z to A" },
];

function BrowseContent() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const pathname = usePathname();

    // State management
    const [listings, setListings] = useState<ListingWithCategory[]>([]);
    const [categories, setCategories] = useState<Tables<"categories">[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 12;
    const [initialLoadDone, setInitialLoadDone] = useState(false);

    // Filters state
    const [filters, setFilters] = useState<Filters>({
        category: null,
        condition: "",
        priceRange: { min: 0, max: 100000 },
        productAge: null,
        sortBy: "newest"
    });

    // Mobile filter modal
    const { isOpen: isFilterOpen, onOpen: onFilterOpen, onOpenChange: onFilterOpenChange } = useDisclosure();

    const fetchListings = useCallback(async () => {
        try {
            setLoading(true);

            // Fetch listings with category details
            const listingsData = await fetchActiveListings();

            // Fetch categories for filters
            const categoriesData = await fetchCategoriesHelper();

            setListings(listingsData);
            setCategories(categoriesData);
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

    // Read all params from URL on mount and update filters
    useEffect(() => {
        // Wait for categories to load before processing URL params
        if (categories.length === 0) return;

        const urlSearch = searchParams.get('search');
        const urlCategory = searchParams.get('category');
        const urlCondition = searchParams.get('condition');
        const urlMinPrice = searchParams.get('minPrice');
        const urlMaxPrice = searchParams.get('maxPrice');
        const urlSortBy = searchParams.get('sortBy');
        const urlProductAge = searchParams.get('productAge');

        if (urlSearch) {
            setSearchQuery(urlSearch);
        }

        // Handle category - only support category key (string)
        let categoryId: number | null = null;
        if (urlCategory) {
            // Find the matching category by key
            const matchingCategory = categories.find(cat => cat.key === urlCategory);
            if (matchingCategory) {
                categoryId = matchingCategory.id;
            }
        }

        setFilters(prev => ({
            ...prev,
            category: categoryId,
            condition: urlCondition || "",
            priceRange: {
                min: urlMinPrice ? parseInt(urlMinPrice) : 0,
                max: urlMaxPrice ? parseInt(urlMaxPrice) : 100000,
            },
            sortBy: urlSortBy || "newest",
            productAge: urlProductAge ? parseInt(urlProductAge) : null,
        }));

        setInitialLoadDone(true);
    }, [searchParams, categories]);

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

        // Category filter
        if (filters.category) {
            result = result.filter((listing) => listing.category === filters.category);
        }

        // Condition filter
        if (filters.condition) {
            result = result.filter((listing) => listing.condition === filters.condition);
        }

        // Price range filter
        result = result.filter((listing) => {
            if (!listing.price) return true; // Include "Price on request" items
            return listing.price >= filters.priceRange.min && listing.price <= filters.priceRange.max;
        });

        // Product age filter
        if (filters.productAge !== null) {
            result = result.filter((listing) => {
                if (!listing.productAge) return false;
                return listing.productAge <= filters.productAge!;
            });
        }

        // Sorting
        result.sort((a, b) => {
            switch (filters.sortBy) {
                case "newest":
                    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
                case "oldest":
                    return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
                case "price_low":
                    return (a.price || 0) - (b.price || 0);
                case "price_high":
                    return (b.price || 0) - (a.price || 0);
                case "name_asc":
                    return (a.name || "").localeCompare(b.name || "");
                case "name_desc":
                    return (b.name || "").localeCompare(a.name || "");
                default:
                    return 0;
            }
        });

        return result;
    }, [listings, searchQuery, filters]);

    // Pagination
    const paginatedListings = useMemo(() => {
        const startIndex = (currentPage - 1) * itemsPerPage;
        return processedListings.slice(startIndex, startIndex + itemsPerPage);
    }, [processedListings, currentPage]);

    const totalPages = Math.ceil(processedListings.length / itemsPerPage);

    // Reset page when filters change
    useEffect(() => {
        setCurrentPage(1);
    }, [searchQuery, filters]);

    // Update URL when filters or search changes
    useEffect(() => {
        // Don't update URL until initial load is complete
        if (!initialLoadDone) return;

        const params = new URLSearchParams();

        if (searchQuery) params.set('search', searchQuery);

        // Use category key instead of ID in URL
        if (filters.category) {
            const selectedCategory = categories.find(cat => cat.id === filters.category);
            if (selectedCategory?.key) {
                params.set('category', selectedCategory.key);
            }
        }

        if (filters.condition) params.set('condition', filters.condition);
        if (filters.priceRange.min > 0) params.set('minPrice', filters.priceRange.min.toString());
        if (filters.priceRange.max < 100000) params.set('maxPrice', filters.priceRange.max.toString());
        if (filters.sortBy !== 'newest') params.set('sortBy', filters.sortBy);
        if (filters.productAge !== null) params.set('productAge', filters.productAge.toString());

        const queryString = params.toString();
        const newUrl = queryString ? `${pathname}?${queryString}` : pathname;

        // Only update if URL actually changed to avoid unnecessary history entries
        if (window.location.pathname + window.location.search !== newUrl) {
            router.push(newUrl, { scroll: false });
        }
    }, [searchQuery, filters, pathname, router, categories, initialLoadDone]);    // Clear all filters
    const clearFilters = () => {
        setFilters({
            category: null,
            condition: "",
            priceRange: { min: 0, max: 100000 },
            productAge: null,
            sortBy: "newest"
        });
        setSearchQuery("");
        router.push(pathname, { scroll: false });
    };

    // Active filters count
    const activeFiltersCount = [
        filters.category !== null,
        filters.condition,
        filters.productAge !== null,
        filters.priceRange.min > 0 || filters.priceRange.max < 100000,
        searchQuery
    ].filter(Boolean).length;

    return (
        <div className="min-h-screen bg-background">
            {/* Header */}
            <div className="bg-content1 border-b border-divider sticky top-0 z-40">
                <div className="max-w-7xl mx-auto px-4 py-4">
                    <div className="flex flex-col gap-4">
                        {/* Title and Stats */}
                        <div className="flex justify-between items-center">
                            <div>
                                <h1 className="text-2xl font-bold text-foreground">Browse Marketplace</h1>
                                <p className="text-foreground-500 text-sm mt-1">
                                    {processedListings.length} items available
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

                        {/* Search and Filter Bar */}
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

                            {/* Sort Dropdown - Desktop */}
                            <Select
                                placeholder="Sort by"
                                selectedKeys={[filters.sortBy]}
                                onSelectionChange={(keys) =>
                                    setFilters(prev => ({ ...prev, sortBy: Array.from(keys)[0] as string }))
                                }
                                className="hidden md:flex w-48"
                            >
                                {SORT_OPTIONS.map((option) => (
                                    <SelectItem key={option.key}>
                                        {option.label}
                                    </SelectItem>
                                ))}
                            </Select>

                            {/* Mobile Filter Button */}
                            <Button
                                color="primary"
                                variant="flat"
                                startContent={<Filter size={18} />}
                                onPress={onFilterOpen}
                                className="md:hidden"
                            >
                                Filters
                                {activeFiltersCount > 0 && (
                                    <Chip size="sm" color="danger" className="ml-1">
                                        {activeFiltersCount}
                                    </Chip>
                                )}
                            </Button>
                        </div>

                        {/* Active Filters - Mobile */}
                        {activeFiltersCount > 0 && (
                            <div className="flex flex-wrap gap-2 md:hidden">
                                {searchQuery && (
                                    <Chip
                                        onClose={() => setSearchQuery("")}
                                        variant="flat"
                                        color="primary"
                                    >
                                        Search: {searchQuery}
                                    </Chip>
                                )}
                                {filters.category && (
                                    <Chip
                                        onClose={() => setFilters(prev => ({ ...prev, category: null }))}
                                        variant="flat"
                                        color="primary"
                                    >
                                        {categories.find(cat => cat.id === filters.category)?.name || 'Category'}
                                    </Chip>
                                )}
                                {filters.condition && (
                                    <Chip
                                        onClose={() => setFilters(prev => ({ ...prev, condition: "" }))}
                                        variant="flat"
                                        color="primary"
                                    >
                                        {filters.condition}
                                    </Chip>
                                )}
                                <Button
                                    size="sm"
                                    variant="light"
                                    color="danger"
                                    onPress={clearFilters}
                                >
                                    Clear All
                                </Button>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 py-6">
                <div className="flex gap-6">
                    {/* Desktop Filters Sidebar */}
                    <aside className="hidden md:block w-72 flex-shrink-0">
                        <Card className="sticky top-24">
                            <CardHeader className="flex justify-between items-center">
                                <h2 className="text-lg font-semibold">Filters</h2>
                                {activeFiltersCount > 0 && (
                                    <Button size="sm" variant="light" color="danger" onPress={clearFilters}>
                                        Clear All
                                    </Button>
                                )}
                            </CardHeader>
                            <CardBody className="gap-6">
                                {/* Category Filter */}
                                <div>
                                    <Select
                                        label="Category"
                                        placeholder="All Categories"
                                        selectedKeys={filters.category ? [filters.category.toString()] : []}
                                        onSelectionChange={(keys) => {
                                            const value = Array.from(keys)[0] as string;
                                            setFilters(prev => ({ ...prev, category: value ? parseInt(value) : null }));
                                        }}
                                    >
                                        {categories.map((category) => (
                                            <SelectItem key={category.id.toString()}>
                                                {category.name}
                                            </SelectItem>
                                        ))}
                                    </Select>
                                </div>                                {/* Condition Filter */}
                                <div>
                                    <Select
                                        label="Condition"
                                        placeholder="All Conditions"
                                        selectedKeys={filters.condition ? [filters.condition] : []}
                                        onSelectionChange={(keys) =>
                                            setFilters(prev => ({ ...prev, condition: Array.from(keys)[0] as string || "" }))
                                        }
                                    >
                                        {CONDITIONS.map((condition) => (
                                            <SelectItem key={condition}>
                                                {condition}
                                            </SelectItem>
                                        ))}
                                    </Select>
                                </div>

                                {/* Price Range Filter */}
                                <div>
                                    <p className="text-sm font-medium mb-2">Price Range</p>
                                    <Slider
                                        label=" "
                                        step={100}
                                        minValue={0}
                                        maxValue={100000}
                                        value={[filters.priceRange.min, filters.priceRange.max]}
                                        onChange={(value) => {
                                            const range = Array.isArray(value) ? value : [value, value];
                                            setFilters(prev => ({
                                                ...prev,
                                                priceRange: { min: range[0], max: range[1] }
                                            }));
                                        }}
                                        formatOptions={{ style: "currency", currency: "INR" }}
                                        className="max-w-md"
                                    />
                                </div>

                                {/* Product Age Filter */}
                                <div>
                                    <Select
                                        label="Max Age (months)"
                                        placeholder="Any Age"
                                        selectedKeys={filters.productAge !== null ? [filters.productAge.toString()] : []}
                                        onSelectionChange={(keys) => {
                                            const value = Array.from(keys)[0] as string;
                                            setFilters(prev => ({
                                                ...prev,
                                                productAge: value ? parseInt(value) : null
                                            }));
                                        }}
                                    >
                                        <SelectItem key="3">3 months</SelectItem>
                                        <SelectItem key="6">6 months</SelectItem>
                                        <SelectItem key="12">1 year</SelectItem>
                                        <SelectItem key="24">2 years</SelectItem>
                                        <SelectItem key="36">3+ years</SelectItem>
                                    </Select>
                                </div>
                            </CardBody>
                        </Card>
                    </aside>

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
                                                <ProductCard
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

            {/* Mobile Filter Modal */}
            <Modal
                isOpen={isFilterOpen}
                onOpenChange={onFilterOpenChange}
                scrollBehavior="inside"
                size="4xl"
                className="md:hidden"
            >
                <ModalContent>
                    {(onClose) => (
                        <>
                            <ModalHeader className="flex justify-between items-center">
                                <h2 className="text-lg font-semibold">Filters</h2>
                                {activeFiltersCount > 0 && (
                                    <Button size="sm" variant="light" color="danger" onPress={clearFilters}>
                                        Clear All
                                    </Button>
                                )}
                            </ModalHeader>
                            <ModalBody className="pb-6">
                                <Accordion selectionMode="multiple" defaultExpandedKeys={["sort", "category"]}>
                                    <AccordionItem key="sort" title="Sort By">
                                        <Select
                                            placeholder="Select sorting"
                                            selectedKeys={[filters.sortBy]}
                                            onSelectionChange={(keys) =>
                                                setFilters(prev => ({ ...prev, sortBy: Array.from(keys)[0] as string }))
                                            }
                                        >
                                            {SORT_OPTIONS.map((option) => (
                                                <SelectItem key={option.key}>
                                                    {option.label}
                                                </SelectItem>
                                            ))}
                                        </Select>
                                    </AccordionItem>

                                    <AccordionItem key="category" title="Category">
                                        <Select
                                            placeholder="All Categories"
                                            selectedKeys={filters.category ? [filters.category.toString()] : []}
                                            onSelectionChange={(keys) => {
                                                const value = Array.from(keys)[0] as string;
                                                setFilters(prev => ({ ...prev, category: value ? parseInt(value) : null }));
                                            }}
                                        >
                                            {categories.map((category) => (
                                                <SelectItem key={category.id.toString()}>
                                                    {category.name}
                                                </SelectItem>
                                            ))}
                                        </Select>
                                    </AccordionItem>
                                    <AccordionItem key="condition" title="Condition">
                                        <Select
                                            placeholder="All Conditions"
                                            selectedKeys={filters.condition ? [filters.condition] : []}
                                            onSelectionChange={(keys) =>
                                                setFilters(prev => ({ ...prev, condition: Array.from(keys)[0] as string || "" }))
                                            }
                                        >
                                            {CONDITIONS.map((condition) => (
                                                <SelectItem key={condition}>
                                                    {condition}
                                                </SelectItem>
                                            ))}
                                        </Select>
                                    </AccordionItem>

                                    <AccordionItem key="price" title="Price Range">
                                        <div className="pb-4">
                                            <Slider
                                                label="Price"
                                                step={100}
                                                minValue={0}
                                                maxValue={100000}
                                                value={[filters.priceRange.min, filters.priceRange.max]}
                                                onChange={(value) => {
                                                    const range = Array.isArray(value) ? value : [value, value];
                                                    setFilters(prev => ({
                                                        ...prev,
                                                        priceRange: { min: range[0], max: range[1] }
                                                    }));
                                                }}
                                                formatOptions={{ style: "currency", currency: "INR" }}
                                            />
                                        </div>
                                    </AccordionItem>

                                    <AccordionItem key="age" title="Product Age">
                                        <Select
                                            placeholder="Any Age"
                                            selectedKeys={filters.productAge !== null ? [filters.productAge.toString()] : []}
                                            onSelectionChange={(keys) => {
                                                const value = Array.from(keys)[0] as string;
                                                setFilters(prev => ({
                                                    ...prev,
                                                    productAge: value ? parseInt(value) : null
                                                }));
                                            }}
                                        >
                                            <SelectItem key="3">3 months</SelectItem>
                                            <SelectItem key="6">6 months</SelectItem>
                                            <SelectItem key="12">1 year</SelectItem>
                                            <SelectItem key="24">2 years</SelectItem>
                                            <SelectItem key="36">3+ years</SelectItem>
                                        </Select>
                                    </AccordionItem>
                                </Accordion>

                                <div className="flex gap-3 pt-4">
                                    <Button
                                        color="primary"
                                        className="flex-1"
                                        onPress={onClose}
                                    >
                                        Apply Filters
                                    </Button>
                                    <Button
                                        variant="flat"
                                        onPress={() => {
                                            clearFilters();
                                            onClose();
                                        }}
                                    >
                                        Reset
                                    </Button>
                                </div>
                            </ModalBody>
                        </>
                    )}
                </ModalContent>
            </Modal>
        </div>
    );
}

export default function BrowsePage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen bg-background flex items-center justify-center">
                <Spinner size="lg" color="primary" />
            </div>
        }>
            <BrowseContent />
        </Suspense>
    );
}