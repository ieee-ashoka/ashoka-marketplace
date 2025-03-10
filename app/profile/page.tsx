"use client";

import React, { useEffect, useState } from "react";
import { createClient } from "@/utils/supabase/client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Avatar,
  Button,
  Card,
  CardBody,
  CardFooter,
  CardHeader,
  Chip,
  Image,
  Skeleton,
  Tab,
  Tabs,
  Tooltip,
} from "@heroui/react";
import {
  Edit,
  Heart,
  Package,
  Settings,
  Share2,
  ShoppingBag,
} from "lucide-react";
import { Database } from "@/types/database.types";

// Use types from the database schema
type Profile = Database["public"]["Tables"]["profiles"]["Row"];
type Listing = Database["public"]["Tables"]["listings"]["Row"];
// type Wishlist = Database["public"]["Tables"]["wishlist"]["Row"];

// Initialize Supabase client
const supabase = createClient();

export default function ProfilePage() {
  const router = useRouter();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [myListings, setMyListings] = useState<Listing[]>([]);
  const [wishlist, setWishlist] = useState<Listing[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("listings");

  useEffect(() => {
    // Fetch user profile, listings and wishlist data
    async function fetchProfileData() {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
          // Redirect to login if not authenticated
          router.push("/login");
          return;
        }

        // Fetch profile data
        const { data: profileData, error: profileError } = await supabase
          .from("profiles")
          .select("*")
          .eq("user_id", user.id)
          .single();

        if (profileError) throw profileError;

        // Fetch user's listings
        const { data: listingsData, error: listingsError } = await supabase
          .from("listings")
          .select("*")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false });

        if (listingsError) throw listingsError;

        // Fetch user's wishlist with joined listing data
        const { data: wishlistData, error: wishlistError } = await supabase
          .from("wishlist")
          .select(
            `
            id, 
            created_at,
            listing_id,
            listings(*)
          `
          )
          .eq("user_id", user.id);

        if (wishlistError) throw wishlistError;

        // Extract actual listing data from wishlist join
        const wishlistItems = wishlistData
          .map((item: { listings: Listing }) => item.listings)
          .filter(Boolean); // Filter out any null items

        setProfile(profileData);
        setMyListings(listingsData || []);
        setWishlist(wishlistItems || []);
      } catch (error) {
        console.error("Error fetching profile data:", error);
      } finally {
        setIsLoading(false);
      }
    }

    fetchProfileData();
  }, [router]);

  // Function to determine listing status based on expired_at field
  const getListingStatus = (listing: Listing) => {
    if (!listing.expired_at) return "active";

    const now = new Date();
    const expiredAt = new Date(listing.expired_at);

    return now > expiredAt ? "expired" : "active";
  };

  // Function to format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="flex flex-col gap-6">
          <Card className="w-full">
            <CardBody className="flex flex-col sm:flex-row gap-6 p-6">
              <Skeleton className="rounded-full w-24 h-24 sm:w-32 sm:h-32" />
              <div className="flex flex-col flex-grow gap-4">
                <Skeleton className="h-8 w-48 rounded-lg" />
                <Skeleton className="h-4 w-full rounded-lg" />
                <div className="flex gap-4">
                  <Skeleton className="h-8 w-20 rounded-lg" />
                  <Skeleton className="h-8 w-20 rounded-lg" />
                </div>
              </div>
            </CardBody>
          </Card>

          <Skeleton className="h-12 w-full rounded-lg" />

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-64 rounded-xl" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <h2 className="text-2xl font-bold mb-4">Profile Not Found</h2>
        <p className="text-gray-600 dark:text-gray-400 mb-8">
          We couldn&apos;t find your profile information. Please try again or
          contact support.
        </p>
        <Button as={Link} href="/" color="primary">
          Return to Home
        </Button>
      </div>
    );
  }

  // Estimate reputation score and completed transactions for display
  // In a real app, these would come from the database
  const transactionsCompleted = 0; // You would calculate this from sales data
  const reputationScore = 4.8; // You would calculate this from reviews

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      {/* Profile Header Card */}
      <Card className="mb-8">
        <CardHeader className="flex flex-col sm:flex-row gap-6 p-6">
          <Avatar
            src={profile.avatar || "https://i.pravatar.cc/300"}
            name={profile.name || "User"}
            className="w-24 h-24 sm:w-32 sm:h-32 text-large"
            size="lg"
            color="primary"
            isBordered
            showFallback
          />

          <div className="flex flex-col flex-grow">
            <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:justify-between mb-2">
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold">
                  {profile.name || "Ashoka User"}
                </h1>
                <p className="text-gray-500 dark:text-gray-400">
                  {profile.email}
                </p>
              </div>

              <div className="flex gap-2 mt-2 sm:mt-0">
                <Tooltip content="Edit Profile">
                  <Button
                    isIconOnly
                    as={Link}
                    href="/profile/edit"
                    variant="flat"
                    className="text-default-500"
                    size="sm"
                  >
                    <Edit size={18} />
                  </Button>
                </Tooltip>

                <Tooltip content="Settings">
                  <Button
                    isIconOnly
                    as={Link}
                    href="/profile/settings"
                    variant="flat"
                    className="text-default-500"
                    size="sm"
                  >
                    <Settings size={18} />
                  </Button>
                </Tooltip>

                <Tooltip content="Share Profile">
                  <Button
                    isIconOnly
                    variant="flat"
                    className="text-default-500"
                    size="sm"
                  >
                    <Share2 size={18} />
                  </Button>
                </Tooltip>
              </div>
            </div>

            {profile.phn_no && (
              <p className="text-gray-700 dark:text-gray-300 mb-4">
                Contact: {profile.phn_no}
              </p>
            )}

            <div className="flex flex-wrap gap-6 mt-2">
              <div className="flex flex-col items-center sm:items-start">
                <span className="text-lg font-semibold">
                  {myListings.length}
                </span>
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  Listings
                </span>
              </div>

              <div className="flex flex-col items-center sm:items-start">
                <span className="text-lg font-semibold">
                  {transactionsCompleted}
                </span>
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  Sold
                </span>
              </div>

              <div className="flex flex-col items-center sm:items-start">
                <span className="text-lg font-semibold">{wishlist.length}</span>
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  Wishlist
                </span>
              </div>

              <div className="flex flex-col items-center sm:items-start">
                <div className="flex items-center">
                  <span className="text-lg font-semibold">
                    {reputationScore}
                  </span>
                  <span className="text-yellow-500 ml-1">★</span>
                </div>
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  Rating
                </span>
              </div>
            </div>
          </div>
        </CardHeader>

        <CardFooter className="py-3 px-6 text-sm text-gray-500 dark:text-gray-400 border-t border-default-200">
          <p>Member since {formatDate(profile.created_at)}</p>
        </CardFooter>
      </Card>

      {/* Tabs for Listings and Wishlist */}
      <div className="mb-6">
        <Tabs
          selectedKey={activeTab}
          onSelectionChange={(key: string) => setActiveTab(key)}
          variant="underlined"
          size="lg"
          className="w-full"
        >
          <Tab
            key="listings"
            title={
              <div className="flex items-center gap-2">
                <Package size={18} />
                <span>My Listings</span>
                <Chip size="sm" variant="flat">
                  {myListings.length}
                </Chip>
              </div>
            }
          />
          <Tab
            key="wishlist"
            title={
              <div className="flex items-center gap-2">
                <Heart size={18} />
                <span>Wishlist</span>
                <Chip size="sm" variant="flat">
                  {wishlist.length}
                </Chip>
              </div>
            }
          />
          <Tab
            key="transactions"
            title={
              <div className="flex items-center gap-2">
                <ShoppingBag size={18} />
                <span>Purchase History</span>
              </div>
            }
          />
        </Tabs>
      </div>

      {/* Tab Content */}
      <div className="mb-10">
        {activeTab === "listings" && (
          <>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold">My Listings</h2>
              <Button as={Link} href="/sell" color="primary" variant="flat">
                Create New Listing
              </Button>
            </div>

            {myListings.length === 0 ? (
              <div className="text-center py-16 bg-default-50 rounded-xl">
                <div className="mb-4">
                  <Package size={48} className="mx-auto text-gray-400" />
                </div>
                <h3 className="text-xl font-semibold mb-2">No Listings Yet</h3>
                <p className="text-gray-500 dark:text-gray-400 mb-6 max-w-md mx-auto">
                  You haven&apos;t created any listings yet. Start selling your
                  unused items to Ashoka students today!
                </p>
                <Button as={Link} href="/sell" color="primary">
                  Create Your First Listing
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {myListings.map((listing) => {
                  const status = getListingStatus(listing);

                  return (
                    <Card
                      key={listing.id}
                      className="hover:shadow-md transition-shadow"
                    >
                      <CardBody className="p-0">
                        <div className="relative">
                          <Image
                            src={
                              listing.image?.[0] || "/placeholder-product.jpg"
                            }
                            alt={listing.name || "Product"}
                            className="w-full aspect-square object-cover"
                          />
                          <Chip
                            size="sm"
                            color={status === "expired" ? "danger" : "primary"}
                            className="absolute top-2 right-2"
                          >
                            {status === "expired" ? "Expired" : "Active"}
                          </Chip>
                        </div>
                        <div className="p-3">
                          <h3 className="font-medium text-lg truncate">
                            {listing.name || "Unnamed Item"}
                          </h3>
                          <div className="flex justify-between items-center mt-1">
                            <span className="text-lg font-bold">
                              {listing.price ? `₹${listing.price}` : "Free"}
                            </span>
                            <span className="text-xs text-gray-500 dark:text-gray-400">
                              {formatDate(listing.created_at)}
                            </span>
                          </div>
                          {listing.category && (
                            <Chip size="sm" variant="flat" className="mt-2">
                              {listing.category}
                            </Chip>
                          )}
                        </div>
                      </CardBody>
                      <CardFooter className="flex gap-2 justify-end border-t border-default-100">
                        <Button
                          size="sm"
                          variant="light"
                          as={Link}
                          href={`/listings/${listing.id}/edit`}
                        >
                          Edit
                        </Button>
                        <Button
                          size="sm"
                          color="primary"
                          variant="flat"
                          as={Link}
                          href={`/listings/${listing.id}`}
                        >
                          View
                        </Button>
                      </CardFooter>
                    </Card>
                  );
                })}
              </div>
            )}
          </>
        )}

        {activeTab === "wishlist" && (
          <>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold">My Wishlist</h2>
              <Button as={Link} href="/browse" color="primary" variant="flat">
                Browse More Items
              </Button>
            </div>

            {wishlist.length === 0 ? (
              <div className="text-center py-16 bg-default-50 rounded-xl">
                <div className="mb-4">
                  <Heart size={48} className="mx-auto text-gray-400" />
                </div>
                <h3 className="text-xl font-semibold mb-2">
                  Your Wishlist is Empty
                </h3>
                <p className="text-gray-500 dark:text-gray-400 mb-6 max-w-md mx-auto">
                  Add items to your wishlist to save them for later and get
                  notified about price changes.
                </p>
                <Button as={Link} href="/browse" color="primary">
                  Browse Items
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {wishlist.map((listing) => (
                  <Card
                    key={listing.id}
                    className="hover:shadow-md transition-shadow"
                  >
                    <CardBody className="p-0">
                      <Image
                        src={listing.image?.[0] || "/placeholder-product.jpg"}
                        alt={listing.name || "Product"}
                        className="w-full aspect-square object-cover"
                      />
                      <div className="p-3">
                        <h3 className="font-medium text-lg truncate">
                          {listing.name || "Unnamed Item"}
                        </h3>
                        <div className="flex justify-between items-center mt-1">
                          <span className="text-lg font-bold">
                            {listing.price ? `₹${listing.price}` : "Free"}
                          </span>
                        </div>
                        {listing.category && (
                          <Chip size="sm" variant="flat" className="mt-2">
                            {listing.category}
                          </Chip>
                        )}
                      </div>
                    </CardBody>
                    <CardFooter className="flex gap-2 justify-end border-t border-default-100">
                      <Button
                        size="sm"
                        color="danger"
                        variant="flat"
                        onClick={async () => {
                          // Remove from wishlist functionality
                          try {
                            const {
                              data: { user },
                            } = await supabase.auth.getUser();
                            if (!user) return;

                            await supabase
                              .from("wishlist")
                              .delete()
                              .eq("user_id", user.id)
                              .eq("listing_id", listing.id);

                            // Update wishlist state
                            setWishlist(
                              wishlist.filter((item) => item.id !== listing.id)
                            );
                          } catch (error) {
                            console.error(
                              "Error removing from wishlist:",
                              error
                            );
                          }
                        }}
                      >
                        Remove
                      </Button>
                      <Button
                        size="sm"
                        color="primary"
                        variant="flat"
                        as={Link}
                        href={`/listings/${listing.id}`}
                      >
                        View
                      </Button>
                    </CardFooter>
                  </Card>
                ))}
              </div>
            )}
          </>
        )}

        {activeTab === "transactions" && (
          <div className="text-center py-16 bg-default-50 rounded-xl">
            <div className="mb-4">
              <ShoppingBag size={48} className="mx-auto text-gray-400" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Purchase History</h3>
            <p className="text-gray-500 dark:text-gray-400 mb-6 max-w-md mx-auto">
              Track all your purchases and completed transactions in one place.
            </p>
            <Button as={Link} href="/browse" color="primary">
              Browse Items
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
