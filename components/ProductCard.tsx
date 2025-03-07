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

  // Calculate time since posting
  const postedDate = product.created_at
    ? formatDistanceToNow(new Date(product.created_at), { addSuffix: true })
    : "";

  return (
    <Card
      className={`bg-background border border-gray-200 dark:border-gray-800 rounded-lg shadow overflow-hidden hover:shadow-md transition-shadow ${className}`}
    >
      <div className="h-48 w-full relative">
        <Image
          isBlurred
          alt={product.name || "Product image"}
          className="z-0 h-full w-full object-cover"
          src={product.image || "/placeholder-image.jpg"}
          fallbackSrc="/placeholder-image.jpg"
        />
        {product.condition && (
          <Chip
            className="absolute top-2 left-2"
            color="secondary"
            variant="shadow"
          >
            {product.condition}
          </Chip>
        )}
      </div>
      <CardBody className="p-4">
        <div className="flex justify-between items-start">
          <h3 className="text-lg font-medium text-foreground line-clamp-1">
            {product.name || "Untitled Item"}
          </h3>
          <span className="font-bold text-indigo-600 dark:text-indigo-400 whitespace-nowrap">
            {formattedPrice}
          </span>
        </div>
        {product.description && (
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 line-clamp-2">
            {product.description}
          </p>
        )}
        <div className="mt-3 flex items-center text-sm text-gray-500 dark:text-gray-400">
          <span>{product.username || "Anonymous"}</span>
          <span className="mx-1">•</span>
          <span>{postedDate || "Recently"}</span>
        </div>
        {product.category && (
          <div className="mt-2">
            <Chip className="text-xs" color="secondary" variant="faded">
              {product.category}
            </Chip>
          </div>
        )}
      </CardBody>
      <CardFooter className="px-4 pb-4 pt-0">
        <Button
          as={Link}
          href={`/item/${product.id}`}
          className="w-full py-2 border border-indigo-600 dark:border-indigo-500 rounded text-indigo-600 dark:text-indigo-400 hover:bg-indigo-600 hover:text-white dark:hover:bg-indigo-700"
          variant="flat"
        >
          View Details
        </Button>
      </CardFooter>
    </Card>
  );
}
