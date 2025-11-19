// components/ProductCard.tsx
"use client";
import React from "react";
import { Button, Card, CardBody, CardFooter, Image, Chip } from "@heroui/react";
import Link from "next/link";
import { Tables } from "@/types/database.types";
import { formatDistanceToNow } from "date-fns";
import { createClient } from "@/utils/supabase/client";
import { Heart } from "lucide-react";

// Enhanced product type that can handle both old and new category formats
interface ProductWithCategory extends Tables<"listings"> {
  categories?: Tables<"categories"> | null;
}

type ProductCardProps = React.HTMLAttributes<HTMLDivElement> & {
  isActive?: boolean;
  showActive?: boolean;
  product: ProductWithCategory;
  actions?: React.ReactNode; // New prop for custom actions
  onWishlistChange?: () => void; // Callback when wishlist state changes
  isInWishlist?: boolean; // Whether the item is in the wishlist
};

export default function ProductCard({ isActive, showActive, product, className, actions, onWishlistChange, isInWishlist }: ProductCardProps) {
  const supabase = createClient();

  const [interestedCount, setInterestedCount] = React.useState<number>(0);

  const getInterestedCount = React.useCallback(async (listingId: string | number): Promise<number> => {
    const id = typeof listingId === "string" ? parseInt(listingId) : listingId;

    const { count, error } = await supabase
      .from("interested")
      .select("*", { count: "exact", head: true })
      .eq("listing_id", id);

    if (error) {
      console.error("Error fetching interested count:", error);
      return 0;
    }

    return count || 0;
  }, [supabase]);  // Format the price with proper currency symbol
  const formattedPrice = product.price
    ? `₹${product.price.toLocaleString("en-IN")}`
    : "Price on request";

  // Check if we're showing "Price on request"
  const isPriceOnRequest = !product.price;

  // Calculate time since posting
  const postedDate = product.created_at
    ? formatDistanceToNow(new Date(product.created_at), { addSuffix: true })
    : "";

  // Get the first image from the array or use fallback
  const imageUrl =
    product.image && product.image.length > 0
      ? product.image[0]
      : "/images/placeholder-image.png";

  React.useEffect(() => {
    async function fetchInterestedCount() {
      const count = await getInterestedCount(product.id);
      setInterestedCount(count);
    }

    fetchInterestedCount();
  }, [product.id, getInterestedCount]);

  return (
    <Card
      className={`shadow overflow-hidden hover:shadow-md transition-all duration-300 h-full ${className}`}
    >
      {/* Fixed height image container with strict aspect ratio */}
      <div className="relative w-full h-48 overflow-hidden">
        <Image
          isBlurred
          alt={product.name || "Product image"}
          className="z-0 object-cover w-full h-full"
          src={imageUrl}
          radius="none"
          removeWrapper
          loading="lazy"
        />
        {product.condition && (
          <Chip
            className="absolute top-2 left-2 text-xs sm:text-sm"
            color="primary"
            variant="shadow"
            size="md"
          >
            {product.condition}
          </Chip>
        )}
        {showActive && (
          <Chip
            className="absolute top-2 right-2 text-xs sm:text-sm"
            color={isActive ? "primary" : "danger"}
            variant="shadow"
            size="md"
          >
            {isActive ? "Active" : "Expired"}
          </Chip>
        )}
        {/* Wishlist button - only show if onWishlistChange is provided */}
        {onWishlistChange && (
          <Button
            isIconOnly
            color="danger"
            variant="flat"
            size="sm"
            className={`absolute ${showActive ? 'bottom-2' : 'top-2'} right-2 z-10 bg-white/90 dark:bg-black/90`}
            onPress={onWishlistChange}
            aria-label={isInWishlist ? "Remove from wishlist" : "Add to wishlist"}
          >
            <Heart size={18} fill={isInWishlist ? "currentColor" : "none"} />
          </Button>
        )}
      </div>

      <CardBody className="p-3 sm:p-4 flex-grow">
        {/* Product name and price layout - conditional based on price type */}
        {isPriceOnRequest ? (
          // For "Price on request", stack name and price vertically
          <div className="flex flex-col gap-1">
            <h3 className="text-base sm:text-lg font-medium text-foreground">
              {product.name || "Untitled Item"}
            </h3>
            <span className="font-bold text-indigo-600 dark:text-indigo-400 text-sm">
              {formattedPrice}
            </span>
          </div>
        ) : (
          // For regular prices, responsive layout (col on mobile, row on tablet+)
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-1 sm:gap-2">
            <h3 className="text-base sm:text-lg font-medium text-foreground line-clamp-1">
              {product.name || "Untitled Item"}
            </h3>
            <span className="font-bold text-indigo-600 dark:text-indigo-400 whitespace-nowrap">
              {formattedPrice}
            </span>
          </div>
        )}

        {product.description && (
          <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-2 line-clamp-2">
            {product.description}
          </p>
        )}

        <div className="mt-2 sm:mt-3 flex items-center text-xs sm:text-sm text-gray-500 dark:text-gray-400">
          <span>{postedDate || "Recently"}</span>
        </div>

        <div className="flex flex-row items-center justify-between mt-2">
          {(product.categories?.name || (typeof product.category === 'string' && product.category)) && (
            <div>
              <Chip
                className="text-xs dark:text-white"
                color="primary"
                variant="faded"
                size="md"
              >
                {product.categories?.name || product.category}
              </Chip>
            </div>
          )}

          <div>
            <Chip
              className="text-xs"
              color="secondary"
              variant="flat"
              size="md"
            >
              {interestedCount} interested
            </Chip>
          </div>
        </div>
      </CardBody>

      <CardFooter className="px-3 pb-3 pt-0 sm:px-4 sm:pb-4">
        {actions ? (
          actions
        ) : (
          <Button
            as={Link}
            href={`/listing/${product.id}`}
            className="w-full min-h-[36px] text-sm sm:text-base"
            color="primary"
            variant="flat"
          >
            View Details
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}
