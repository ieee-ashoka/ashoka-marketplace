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
import { subDays } from "date-fns";
import { Tables } from "@/types/database.types";
import { Button } from "@heroui/react";
import { createClient } from "@/utils/supabase/client";

// import Image from "next/image";

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

export default function Home() {
  const [categories, setCategories] = useState<Tables<"categories">[]>([]);
  // const [isLoading, setIsLoading] = useState(true);

  // Fetch categories from database
  useEffect(() => {
    async function fetchCategories() {
      try {
        const supabase = createClient();
        const { data, error } = await supabase
          .from("categories")
          .select("*")
          .order("name")
          .limit(6); // Show top 6 categories on homepage

        if (error) throw error;
        setCategories(data || []);
      } catch (error) {
        console.error("Error fetching categories:", error);
        // Fallback to empty array
        setCategories([]);
      } finally {
        // setIsLoading(false);
      }
    }

    fetchCategories();
  }, []);


  // Transform the featuredListings data to match the product schema
  const featuredListings: Tables<"listings">[] = [
    {
      id: 1,
      name: "Economics Textbook",
      price: null,
      image: ["/images/placeholder-books.jpg"],
      created_at: subDays(new Date(), 2).toISOString(),
      category: 1, // Using ID instead of string
      condition: "Like New",
      description: null,
      expired_at: null,
      user_id: null,
      productAge: null
    },
    {
      id: 2,
      name: "Desk Lamp",
      price: 600,
      image: null,
      created_at: subDays(new Date(), 5).toISOString(),
      category: 2, // Using ID instead of string
      condition: "Good",
      description: null,
      expired_at: null,
      user_id: null,
      productAge: null
    },
    {
      id: 3,
      name: "Portable Speaker",
      price: 1200,
      image: ["/placeholder-speaker.jpg"],
      created_at: subDays(new Date(), 1).toISOString(),
      category: 3, // Using ID instead of string
      condition: "Excellent",
      description: "High quality portable speaker with great bass response",
      expired_at: null,
      user_id: null,
      productAge: null
    },
    {
      id: 4,
      name: "Room Bookshelf",
      price: 1500,
      image: ["/placeholder-shelf.jpg"],
      created_at: subDays(new Date(), 3).toISOString(),
      category: 4, // Using ID instead of string
      condition: null,
      description:
        "Sturdy wooden bookshelf, perfect for dorm rooms. Holds up to 50 books.",
      expired_at: null,
      user_id: null,
      productAge: null
    },
  ];

  return (
    <main className="min-h-screen bg-background">

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
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
            {categories.map((category) => {
              // Get icon from iconMap or use default
              const IconComponent = iconMap[category.key?.toLowerCase() || category.name?.toLowerCase() || 'default'] || iconMap.default;
              return (
                <Link
                  key={category.id}
                  href={`/category/${category.key || category.name?.toLowerCase() || ''}`}
                  className={`${category.color} rounded-xl p-6 flex flex-col items-center justify-center transition-transform hover:scale-105`}
                >
                  <div className={`text-4xl mb-2 ${category.iconColor}`}>
                    <IconComponent />
                  </div>
                  <span className="font-medium text-foreground">
                    {category.name}
                  </span>
                </Link>
              );
            })}
          </div>
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
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {featuredListings.map((item) => (
              <ProductCard key={item.id} product={item} />
            ))}
          </div>
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
          <div className="mt-12 text-center">
            <Link
              href="/how-it-works"
              className="text-indigo-600 dark:text-indigo-400 font-medium hover:text-indigo-500 dark:hover:text-indigo-300"
            >
              Learn more about how our marketplace works →
            </Link>
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
