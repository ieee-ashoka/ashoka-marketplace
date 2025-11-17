"use client";
import Link from "next/link";
import { useState, useEffect } from "react";
import {
  ChevronRight,
  Tag,
  Clock,
  Truck,
  BookCopy,
  Cable,
  Lamp,
  Shirt,
  Tags,
  House,
} from "lucide-react";
import ProductCard from "../components/ProductCard";
import { Tables } from "@/types/database.types";
import { Button } from "@heroui/react";
import { createClient } from "@/utils/supabase/client";
import CategoriesSkeleton from "../components/loading/categories";
import { useRouter } from 'next/navigation'

interface IconProps {
  size?: number | string;
  color?: string;
  strokeWidth?: number | string;
  className?: string;
}

// Default icon mapping for categories
const iconMap: Record<string, React.ComponentType<IconProps>> = {
  "textbooks": BookCopy,
  "electronics": Cable,
  "furniture": Lamp,
  "clothing": Shirt,
  "accessories": Tags,
  "decor": House,
  "books": BookCopy,
  "home": House,
  "sports": Truck,
  "vehicles": Truck,
  "default": Tag
};

// Color mapping to ensure Tailwind includes these classes
const colorClassMap: Record<string, { bg: string; text: string }> = {
  "blue": {
    bg: "bg-blue-100 dark:bg-blue-900",
    text: "text-blue-600 dark:text-blue-400"
  },
  "purple": {
    bg: "bg-purple-100 dark:bg-purple-900",
    text: "text-purple-600 dark:text-purple-400"
  },
  "yellow": {
    bg: "bg-yellow-100 dark:bg-yellow-900",
    text: "text-yellow-600 dark:text-yellow-400"
  },
  "green": {
    bg: "bg-green-100 dark:bg-green-900",
    text: "text-green-600 dark:text-green-400"
  },
  "red": {
    bg: "bg-red-100 dark:bg-red-900",
    text: "text-red-600 dark:text-red-400"
  },
  "orange": {
    bg: "bg-orange-100 dark:bg-orange-900",
    text: "text-orange-600 dark:text-orange-400"
  },
  "gray": {
    bg: "bg-gray-100 dark:bg-gray-900",
    text: "text-gray-600 dark:text-gray-400"
  }
};

export default function Home() {
  const router = useRouter()
  const [categories, setCategories] = useState<Tables<"categories">[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [featuredListings, setFeaturedListings] = useState<(Tables<"listings"> & { categories: Tables<"categories"> | null })[]>([]);
  const [listingsLoading, setListingsLoading] = useState(true);

  // Fetch categories and featured listings concurrently
  useEffect(() => {
    async function fetchData() {
      try {
        const supabase = createClient();

        const [categoriesResult, listingsResult] = await Promise.all([
          supabase
            .from("categories")
            .select("*")
            .order("name")
            .limit(6), // Show top 6 categories on homepage

          supabase
            .from("listings")
            .select(`
              *,
              categories (
                *
              )
            `)
            .order("created_at", { ascending: false })
            .limit(4)
        ]);

        if (categoriesResult.error) {
          console.error("Error fetching categories:", categoriesResult.error);
          setCategories([]);
        } else {
          setCategories(categoriesResult.data || []);
        }

        if (listingsResult.error) {
          console.error("Error fetching featured listings:", listingsResult.error);
          setFeaturedListings([]);
        } else {
          setFeaturedListings(listingsResult.data || []);
        }
      } catch (error) {
        console.error("Error fetching data:", error);
        setCategories([]);
        setFeaturedListings([]);
      } finally {
        setIsLoading(false);
        setListingsLoading(false);
      }
    }

    fetchData();
    router.refresh();
  }, []);

  return (
    <main className="min-h-screen bg-background" onLoad={() => { router.refresh(); }}>

      {/* Hero Section */}
      <div className="relative  bg-gradient-to-r from-indigo-900 to-indigo-800 dark:from-indigo-950 dark:to-indigo-900 overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="relative z-10 py-16 md:py-24 lg:py-32">
            <div className="max-w-2xl">
              <h1 className="text-4xl font-bold tracking-tight text-white sm:text-5xl lg:text-6xl">
                Buy & Sell{" "}
                <span className="text-indigo-300 dark:text-indigo-200">
                  Second-hand
                </span>{" "}
                Items on Campus
              </h1>
              <p className="mt-6 text-xl text-indigo-100">
                The easiest way for Ashoka students to find great deals and give
                their unused items a new home.
              </p>
              <div className="mt-10 flex flex-col sm:flex-row gap-4">
                <Button
                  as={Link}
                  href="/browse"
                  size="lg"
                  color="primary"
                  className="dark:text-white"
                  variant="faded"
                >
                  Browse Items
                </Button>
                <Button
                  as={Link}
                  href="/sell"
                  color="primary"
                  size="lg"
                  variant="shadow"
                >
                  Sell Something
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Categories Section */}
      <section className="py-12 bg-background border-b border-gray-200 dark:border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-foreground mb-8 text-center">
            Browse Categories
          </h2>
          {isLoading ? (
            <CategoriesSkeleton />
          ) : (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
              {categories.map((category) => {
                // Get icon from iconMap or use default
                const IconComponent = iconMap[category.key?.toLowerCase() || category.name?.toLowerCase() || 'default'] || iconMap.default;

                // Extract color name from database color string (e.g., "bg-blue-100" -> "blue")
                const colorMatch = category.color?.match(/bg-(\w+)-/);
                const colorName = colorMatch ? colorMatch[1] : 'gray';

                // Get the mapped classes or fallback to database values
                const bgClasses = colorClassMap[colorName]?.bg || category.color || 'bg-gray-100 dark:bg-gray-900';
                const textClasses = colorClassMap[colorName]?.text || category.iconColor || 'text-gray-600 dark:text-gray-400';

                return (
                  <Link
                    key={category.id}
                    href={`/browse?category=${category.key}`}
                    className={`${bgClasses} rounded-xl p-6 flex flex-col items-center justify-center transition-transform hover:scale-105`}
                  >
                    <div className={`text-4xl mb-2 ${textClasses}`}>
                      <IconComponent />
                    </div>
                    <span className="font-medium text-foreground">
                      {category.name}
                    </span>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </section>

      {/* Featured Listings */}
      <section className="py-12 bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-3xl font-bold text-foreground">
              Featured Listings
            </h2>
            <Link
              href="/browse"
              className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-500 dark:hover:text-indigo-300 flex items-center"
            >
              View all <ChevronRight className="h-5 w-5 ml-1" />
            </Link>
          </div>
          {listingsLoading ? (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {[...Array(4)].map((_, index) => (
                <div key={index} className="bg-default-100 rounded-lg p-4 animate-pulse">
                  <div className="h-48 bg-default-200 rounded-lg mb-4"></div>
                  <div className="h-4 bg-default-200 rounded w-3/4 mb-2"></div>
                  <div className="h-4 bg-default-200 rounded w-1/2"></div>
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {featuredListings.length > 0 ? (
                featuredListings.map((item) => (
                  <ProductCard key={item.id} product={item} />
                ))
              ) : (
                <div className="col-span-full text-center py-12">
                  <p className="text-gray-500 dark:text-gray-400">No listings available yet. Be the first to list an item!</p>
                </div>
              )}
            </div>
          )}
        </div>
      </section>

      {/* How It Works */}
      <section className="py-12 bg-background border-t border-b border-gray-200 dark:border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-foreground mb-12 text-center">
            How It Works
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="mx-auto bg-indigo-100 dark:bg-indigo-900 rounded-full p-4 w-16 h-16 flex items-center justify-center">
                <Tag className="h-8 w-8 text-indigo-600 dark:text-indigo-400" />
              </div>
              <h3 className="mt-4 text-xl font-medium text-foreground">
                List Your Item
              </h3>
              <p className="mt-2 text-gray-600 dark:text-gray-400">
                Take a few photos, set a price, and write a description for your
                item.
              </p>
            </div>
            <div className="text-center">
              <div className="mx-auto bg-indigo-100 dark:bg-indigo-900 rounded-full p-4 w-16 h-16 flex items-center justify-center">
                <Clock className="h-8 w-8 text-indigo-600 dark:text-indigo-400" />
              </div>
              <h3 className="mt-4 text-xl font-medium text-foreground">
                Connect with Buyers
              </h3>
              <p className="mt-2 text-gray-600 dark:text-gray-400">
                Receive messages from interested students and arrange a meetup
                on campus.
              </p>
            </div>
            <div className="text-center">
              <div className="mx-auto bg-indigo-100 dark:bg-indigo-900 rounded-full p-4 w-16 h-16 flex items-center justify-center">
                <Truck className="h-8 w-8 text-indigo-600 dark:text-indigo-400" />
              </div>
              <h3 className="mt-4 text-xl font-medium text-foreground">
                Complete the Sale
              </h3>
              <p className="mt-2 text-gray-600 dark:text-gray-400">
                Meet safely on campus, exchange the item, and get paid directly.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-12 bg-indigo-700 dark:bg-indigo-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-white mb-6">
            Ready to sell your unused items?
          </h2>
          <p className="text-xl text-indigo-100 mb-8 max-w-3xl mx-auto">
            Join hundreds of Ashoka students who are decluttering their space
            and making extra cash.
          </p>
          <Button
            as={Link}
            href="/browse"
            className="bg-background px-8 py-3 text-base font-medium text-indigo-700 dark:text-indigo-400 shadow-sm hover:bg-gray-50 dark:hover:bg-gray-900"
            size="lg"
          // startContent={
          //   <Image src="/images/google.png" alt="Google logo" width="20" height="20" />
          // }
          >
            Browse New Items
          </Button>
        </div>
      </section>
    </main>
  );
}
