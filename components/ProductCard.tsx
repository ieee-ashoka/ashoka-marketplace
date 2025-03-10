// components/ProductCard.tsx
"use client";
import React from "react";
import { Button, Card, CardBody, CardFooter, Image, Chip } from "@heroui/react";
import Link from "next/link";
import { Tables } from "@/types/database.types";
import { formatDistanceToNow } from "date-fns";

type ProductCardProps = React.HTMLAttributes<HTMLDivElement> & {
  product: Tables<"products">;
};

export default function ProductCard({ product, className }: ProductCardProps) {
  // Format the price with proper currency symbol
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

  return (
    <Card
      className={`shadow overflow-hidden hover:shadow-md transition-all duration-300 h-full ${className}`}
      isPressable
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
            color="secondary"
            variant="shadow"
            size="md"
          >
            {product.condition}
          </Chip>
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
          <span className="truncate max-w-[120px]">
            {product.username || "Anonymous"}
          </span>
          <span className="mx-1">•</span>
          <span>{postedDate || "Recently"}</span>
        </div>

        {product.category && (
          <div className="mt-2">
            <Chip
              className="text-xs dark:text-white"
              color="secondary"
              variant="faded"
              size="md"
            >
              {product.category}
            </Chip>
          </div>
        )}
      </CardBody>

      <CardFooter className="px-3 pb-3 pt-0 sm:px-4 sm:pb-4">
        <Button
          as={Link}
          href={`/item/${product.id}`}
          className="w-full min-h-[36px] text-sm sm:text-base"
          color="secondary"
          variant="flat"
        >
          View Details
        </Button>
      </CardFooter>
    </Card>
  );
}
