"use client";

import React, { useEffect, useState, Key } from "react";
import { createClient } from "@/utils/supabase/client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Button,
  Chip,
  Tab,
  Tabs,
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  useDisclosure,
} from "@heroui/react";
import {
  Heart,
  Package,
  ShoppingBag,
  Trash2,
} from "lucide-react";
import { Database } from "@/types/database.types";
import { deleteListing } from "./helpers";
import ProductCard from "@/components/ProductCard";
import ProfileSkeleton from "@/components/loading/profile";
import ProfileCard from "@/components/ProfileCard";

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
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [listingToDelete, setListingToDelete] = useState<Listing | null>(null);
  const { isOpen, onOpen, onClose } = useDisclosure();

  useEffect(() => {
    // Fetch user profile, listings and wishlist data
    async function fetchProfileData() {
      try {
        const {
          data,
        } = await supabase.auth.getClaims();

        if (!data?.claims) {
          // Redirect to login if not authenticated
          router.push("/login");
          return;
        }

        const userId = data.claims.sub;

        // Fetch all data concurrently using Promise.all for better performance
        const [profileResult, listingsResult, wishlistEntriesResult] = await Promise.all([
          // Fetch profile data
          supabase
            .from("profiles")
            .select("*")
            .eq("user_id", userId)
            .single(),
          // Fetch user's listings
          supabase
            .from("listings")
            .select("*")
            .eq("user_id", userId)
            .order("created_at", { ascending: false }),
          // Fetch wishlist entries to get listing_ids
          supabase
            .from("wishlist")
            .select("listing_id")
            .eq("user_id", userId),
        ]);

        // Handle errors from any of the queries
        if (profileResult.error) throw profileResult.error;
        if (listingsResult.error) throw listingsResult.error;
        if (wishlistEntriesResult.error) throw wishlistEntriesResult.error;

        // Set profile and listings data
        setProfile(profileResult.data);
        setMyListings(listingsResult.data || []);

        // Handle wishlist - fetch actual listing data if there are wishlist entries
        if (!wishlistEntriesResult.data || wishlistEntriesResult.data.length === 0) {
          setWishlist([]);
        } else {
          // Extract listing_ids from wishlist entries
          const listingIds = wishlistEntriesResult.data
            .map(item => item.listing_id)
            .filter((id): id is number => id !== null);

          if (listingIds.length === 0) {
            setWishlist([]);
          } else {
            // Fetch the actual listing data for items in wishlist
            const { data: wishlistListings, error: wishlistListingsError } = await supabase
              .from("listings")
              .select("*")
              .in("id", listingIds);

            if (wishlistListingsError) throw wishlistListingsError;

            setWishlist(wishlistListings || []);
          }
        }
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

  // Open delete confirmation modal
  const openDeleteModal = (listing: Listing) => {
    setListingToDelete(listing);
    onOpen();
  };

  // Handle delete listing
  const handleDeleteListing = async () => {
    if (!listingToDelete) return;

    setDeletingId(listingToDelete.id);
    onClose();

    try {
      const result = await deleteListing(listingToDelete.id);

      if (result.success) {
        // Remove from local state
        setMyListings(myListings.filter(listing => listing.id !== listingToDelete.id));
      }
    } catch (error) {
      console.error("Error deleting listing:", error);
    } finally {
      setDeletingId(null);
      setListingToDelete(null);
    }
  };

  if (isLoading) {
    return (
      <ProfileSkeleton />
    );
  }

  if (!profile) {
    return (
      <div className="container mx-auto px-2 sm:px-4 py-8 sm:py-16 text-center">
        <h2 className="text-xl sm:text-2xl font-bold mb-3 sm:mb-4">Profile Not Found</h2>
        <p className="text-gray-600 dark:text-gray-400 mb-6 sm:mb-8">
          We couldn&apos;t find your profile information. Please try again or
          contact support.
        </p>
        <Button as={Link} href="/" color="primary" size="sm" className="sm:text-base">
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
    <div className="container bg-background mx-auto px-6 sm:px-4 py-6 sm:py-8 max-w-6xl">
      {/* Profile Header Card */}
      <ProfileCard
        profile={profile}
        viewOnly={false}
        listingsCount={myListings.length}
        transactionsCount={transactionsCompleted}
        wishlistCount={wishlist.length}
        reputationScore={reputationScore}
      />

      {/* Tabs for Listings and Wishlist */}
      <div className="mb-4 sm:mb-6">
        <Tabs
          selectedKey={activeTab}
          onSelectionChange={(key: Key) => setActiveTab(key.toString())}
          variant="underlined"
          size="md"
          className="w-full"
        >
          <Tab
            key="listings"
            title={
              <div className="flex items-center gap-1 sm:gap-2 text-xs sm:text-base">
                <Package size={16} className="hidden sm:block" />
                <span>My Listings</span>
                <Chip size="sm" variant="flat" className="text-xs">
                  {myListings.length}
                </Chip>
              </div>
            }
          />
          <Tab
            key="wishlist"
            title={
              <div className="flex items-center gap-1 sm:gap-2 text-xs sm:text-base">
                <Heart size={16} className="hidden sm:block" />
                <span>Wishlist</span>
                <Chip size="sm" variant="flat" className="text-xs">
                  {wishlist.length}
                </Chip>
              </div>
            }
          />
          <Tab
            key="transactions"
            title={
              <div className="flex items-center gap-1 sm:gap-2 text-xs sm:text-base">
                <ShoppingBag size={16} className="hidden sm:block" />
                <span>Purchases</span>
              </div>
            }
          />
        </Tabs>
      </div>

      {/* Tab Content */}
      <div className="mb-6 sm:mb-10">
        {activeTab === "listings" && (
          <>
            <div className="flex flex-col sm:flex-row justify-between items-center mb-4 sm:mb-6 gap-2 sm:gap-0">
              <h2 className="text-lg sm:text-xl font-bold text-foreground">My Listings</h2>
              <Button as={Link} href="/sell" color="primary" size="md" className="w-full sm:w-auto">
                Create New Listing
              </Button>
            </div>

            {myListings.length === 0 ? (
              <div className="text-center py-8 sm:py-16 bg-default-50 rounded-xl px-3 sm:px-6">
                <div className="mb-3 sm:mb-4">
                  <Package size={36} className="mx-auto text-gray-400 sm:hidden" />
                  <Package size={48} className="mx-auto text-gray-400 hidden sm:block" />
                </div>
                <h3 className="text-lg sm:text-xl font-semibold mb-2 text-foreground">No Listings Yet</h3>
                <p className="text-sm sm:text-base text-gray-500 dark:text-gray-400 mb-4 sm:mb-6 max-w-md mx-auto">
                  You haven&apos;t created any listings yet. Start selling your
                  unused items to Ashoka students today!
                </p>
                <Button as={Link} href="/sell" color="primary" size="sm" className="sm:text-base">
                  Create Your First Listing
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4">
                {myListings.map((listing) => {
                  const status = getListingStatus(listing);
                  const isActive = status === "active";

                  return (
                    <ProductCard
                      key={listing.id}
                      product={listing}
                      showActive={true}
                      isActive={isActive}
                      actions={
                        <div className="flex gap-1 sm:gap-2 justify-end w-full">
                          <Button
                            size="sm"
                            variant="light"
                            as={Link}
                            href={`/listing/${listing.id}/edit`}
                            className="min-w-0 w-full px-2 sm:px-3"
                          >
                            Edit
                          </Button>
                          <Button
                            size="sm"
                            color="primary"
                            variant="flat"
                            as={Link}
                            href={`/listing/${listing.id}`}
                            className="min-w-0 w-full px-2 sm:px-3"
                          >
                            View
                          </Button>
                          <Button
                            size="sm"
                            color="danger"
                            variant="light"
                            isIconOnly
                            isLoading={deletingId === listing.id}
                            isDisabled={deletingId !== null}
                            onPress={() => openDeleteModal(listing)}
                            className="min-w-0"
                            aria-label="Delete listing"
                          >
                            <Trash2 size={16} />
                          </Button>
                        </div>
                      }
                    />
                  );
                })}
              </div>
            )}
          </>
        )}

        {activeTab === "wishlist" && (
          <>
            <div className="flex flex-col sm:flex-row justify-between items-center mb-4 sm:mb-6 gap-2 sm:gap-0">
              <h2 className="text-lg sm:text-xl font-bold text-foreground">My Wishlist</h2>
              <Button as={Link} href="/browse" color="primary" variant="flat" size="sm" className="w-full sm:w-auto">
                Browse More Items
              </Button>
            </div>

            {wishlist.length === 0 ? (
              <div className="text-center py-8 sm:py-16 bg-default-50 rounded-xl px-3 sm:px-6">
                <div className="mb-3 sm:mb-4">
                  <Heart size={36} className="mx-auto text-gray-400 sm:hidden" />
                  <Heart size={48} className="mx-auto text-gray-400 hidden sm:block" />
                </div>
                <h3 className="text-lg sm:text-xl font-semibold mb-2 text-foreground">
                  Your Wishlist is Empty
                </h3>
                <p className="text-sm sm:text-base text-gray-500 dark:text-gray-400 mb-4 sm:mb-6 max-w-md mx-auto">
                  Add items to your wishlist to save them for later and get
                  notified about price changes.
                </p>
                <Button as={Link} href="/browse" color="primary" size="sm" className="sm:text-base">
                  Browse Items
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
                {wishlist.map((listing) => (
                  <ProductCard
                    key={listing.id}
                    product={listing}
                    actions={
                      <div className="flex gap-1 sm:gap-2 justify-end w-full">
                        <Button
                          size="sm"
                          color="danger"
                          variant="flat"
                          className="min-w-0 px-2 sm:px-3"
                          onPress={async () => {
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
                          className="min-w-0 px-2 sm:px-3"
                        >
                          View
                        </Button>
                      </div>
                    }
                  />
                ))}
              </div>
            )}
          </>
        )}

        {activeTab === "transactions" && (
          <div className="text-center py-8 sm:py-16 bg-default-50 rounded-xl px-3 sm:px-6">
            <div className="mb-3 sm:mb-4">
              <ShoppingBag size={36} className="mx-auto text-gray-400 sm:hidden" />
              <ShoppingBag size={48} className="mx-auto text-gray-400 hidden sm:block" />
            </div>
            <h3 className="text-lg sm:text-xl font-semibold mb-2 text-foreground">Purchase History</h3>
            <p className="text-sm sm:text-base text-gray-500 dark:text-gray-400 mb-4 sm:mb-6 max-w-md mx-auto">
              Track all your purchases and completed transactions in one place.
            </p>
            <Button as={Link} href="/browse" color="primary" size="sm" className="sm:text-base">
              Browse Items
            </Button>
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      <Modal isOpen={isOpen} onClose={onClose} placement="center">
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader className="flex flex-col gap-1">
                Delete Listing
              </ModalHeader>
              <ModalBody>
                <p className="text-foreground">
                  Are you sure you want to delete{" "}
                  <span className="font-semibold">{listingToDelete?.name}</span>?
                </p>
                <p className="text-sm text-danger">
                  This action cannot be undone. All images associated with this listing will also be deleted.
                </p>
              </ModalBody>
              <ModalFooter>
                <Button
                  variant="light"
                  onPress={onClose}
                  isDisabled={deletingId !== null}
                >
                  Cancel
                </Button>
                <Button
                  color="danger"
                  onPress={handleDeleteListing}
                  isLoading={deletingId === listingToDelete?.id}
                  isDisabled={deletingId !== null && deletingId !== listingToDelete?.id}
                >
                  Delete
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>
    </div>
  );
}