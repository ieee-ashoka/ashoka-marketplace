"use client";
import Link from "next/link";
import { ChevronRight, Tag, Clock, Truck } from "lucide-react";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import ProductCard from "../components/ProductCard";
import { subDays } from "date-fns";
import { Tables } from "@/types/database.types";

export default function Home() {
  const categories = [
    { name: "Textbooks", icon: "📚", color: "bg-blue-100 dark:bg-blue-900" },
    {
      name: "Electronics",
      icon: "💻",
      color: "bg-purple-100 dark:bg-purple-900",
    },
    {
      name: "Furniture",
      icon: "🪑",
      color: "bg-yellow-100 dark:bg-yellow-900",
    },
    { name: "Clothing", icon: "👕", color: "bg-green-100 dark:bg-green-900" },
    { name: "Accessories", icon: "🎒", color: "bg-red-100 dark:bg-red-900" },
    { name: "Decor", icon: "🏠", color: "bg-orange-100 dark:bg-orange-900" },
  ];

  // Transform the featuredListings data to match the product schema
  const featuredListings: Tables<"products">[] = [
    {
      id: 1,
      name: "Economics Textbook",
      price: 800,
      image: "/placeholder-book.jpg",
      username: "Priya M.",
      created_at: subDays(new Date(), 2).toISOString(),
      category: "Textbooks",
      condition: "Like New",
      description: null,
      email: null,
      expired_at: null,
      phn_no: null,
      user_id: null
    },
    {
      id: 2,
      name: "Desk Lamp",
      price: 600,
      image: null,
      username: null,
      created_at: subDays(new Date(), 5).toISOString(),
      category: "Decor",
      condition: "Good",
      description: null,
      email: null,
      expired_at: null,
      phn_no: null,
      user_id: null

    },
    {
      id: 3,
      name: "Portable Speaker",
      price: 1200,
      image: "/placeholder-speaker.jpg",
      username: "Zara T.",
      created_at: subDays(new Date(), 1).toISOString(),
      category: "Electronics",
      condition: "Excellent",
      description: "High quality portable speaker with great bass response",
      email: null,
      expired_at: null,
      phn_no: null,
      user_id: null
    },
    {
      id: 4,
      name: "Room Bookshelf",
      price: 1500,
      image: "/placeholder-shelf.jpg",
      username: "Rohan D.",
      created_at: subDays(new Date(), 3).toISOString(),
      category: "Furniture",
      condition: null,
      description: "Sturdy wooden bookshelf, perfect for dorm rooms. Holds up to 50 books.",
      email: null,
      expired_at: null,
      phn_no: null,
      user_id: null
    }
  ];

  return (
    <main className="min-h-screen bg-background">
      <Navbar />

      {/* Hero Section */}
      <div className="relative bg-indigo-800 dark:bg-indigo-900 overflow-hidden">
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
                <Link
                  href="/browse"
                  className="rounded-md bg-background px-6 py-3 text-base font-medium text-indigo-700 dark:text-indigo-300 shadow-sm hover:bg-indigo-50 dark:hover:bg-indigo-950"
                >
                  Browse Items
                </Link>
                <Link
                  href="/sell"
                  className="rounded-md bg-indigo-600 px-6 py-3 text-base font-medium text-white shadow-sm hover:bg-indigo-500 dark:hover:bg-indigo-700"
                >
                  Sell Something
                </Link>
              </div>
            </div>
          </div>
        </div>
        <div className="absolute inset-y-0 right-0 w-1/2 bg-gradient-to-l from-indigo-900 to-indigo-800 dark:from-indigo-950 dark:to-indigo-900 hidden lg:block" />
      </div>

      {/* Categories Section */}
      <section className="py-12 bg-background border-b border-gray-200 dark:border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-foreground mb-8 text-center">
            Browse Categories
          </h2>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
            {categories.map((category) => (
              <Link
                key={category.name}
                href={`/category/${category.name.toLowerCase()}`}
                className={`${category.color} rounded-xl p-6 flex flex-col items-center justify-center transition-transform hover:scale-105`}
              >
                <span className="text-4xl mb-2">{category.icon}</span>
                <span className="font-medium text-foreground">
                  {category.name}
                </span>
              </Link>
            ))}
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
          <Link
            href="/signup"
            className="inline-block rounded-md bg-background px-8 py-3 text-base font-medium text-indigo-700 dark:text-indigo-400 shadow-sm hover:bg-gray-50 dark:hover:bg-gray-900"
          >
            Get Started Today
          </Link>
        </div>
      </section>

      <Footer />
    </main>
  );
}
