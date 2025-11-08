"use client";

import { use, useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { Database } from "@/types/database.types";
import {
  Button,
  Card,
  CardBody,
  CardHeader,
  Chip,
  Image,
  Skeleton,
  Avatar,
  Divider,
  Tooltip,
  Modal,
  ModalHeader,
  ModalBody,
  ModalFooter,
  useDisclosure,
  ModalContent
} from "@heroui/react";
import {
  Heart,
  Share2,
  ChevronLeft,
  Calendar,
  Info,
  MapPin,
  Tag,
  Flag,
  ShoppingBag,
  Check,
  Eye
} from "lucide-react";
import { formatDistanceToNow, format, set } from "date-fns";
import Link from "next/link";
import ProductCard from "@/components/ProductCard";
import {
  getCurrentUser,
  getListingById,
  isListingInWishlist,
  getSellerProfile,
  getSimilarListings,
  addToWishlist,
  removeFromWishlist,
  isListingActive,
  ListingWithCategory,
  isInterested,
  getInterestedCount,
  addInterestedUser,
  removeInterestedUser
} from "./helpers";

// Use types from the database schema
type Profile = Database["public"]["Tables"]["profiles"]["Row"];

export default function ListingPage() {
  const router = useRouter();
  const params = useParams();
  const listingId = params.id as string;

  const [listing, setListing] = useState<ListingWithCategory | null>(null);
  const [seller, setSeller] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [isInWishlist, setIsInWishlist] = useState(false);
  const [isAddingToWishlist, setIsAddingToWishlist] = useState(false);
  const [similarListings, setSimilarListings] = useState<ListingWithCategory[]>([]);
  const [currentUser, setCurrentUser] = useState<{ id: string } | null>(null);
  const {isOpen, onOpen, onOpenChange} = useDisclosure();
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [interested, setInterested] = useState(false);
  const [interestedCount, setInterestedCount] = useState(0);

  useEffect(() => {
    async function fetchListingData() {
      try {
        if (!listingId) return;

        // Get current user for wishlist functions
        const user = await getCurrentUser();
        setCurrentUser(user);

        // Fetch listing details
        const listingData = await getListingById(listingId);

        if (!listingData) {
          router.push("/");
          return;
        }

        setListing(listingData);

        // Check if this item is in user's wishlist
        if (user) {
          const inWishlist = await isListingInWishlist(user.id, listingData.id);
          setIsInWishlist(inWishlist);
        }

        // Fetch seller profile
        if (listingData.user_id) {
          const sellerData = await getSellerProfile(listingData.user_id);
          setSeller(sellerData);
        }

        // Fetch similar listings (same category)
        if (listingData.category) {
          const similarItems = await getSimilarListings(listingData.category, listingData.id);
          setSimilarListings(similarItems);
        }
      } catch (error) {
        console.error("Error fetching listing:", error);
      } finally {
        setIsLoading(false);
      }
    }

    fetchListingData();
  }, [listingId, router]);

    useEffect(() => {
    if (!listing || !currentUser) {
      setInterested(false);
      return;
    }

    let cancelled = false;

    (async () => {
      try {
        const value = await isInterested(listing.id, currentUser.id);
        if (!cancelled) setInterested(!!value);
      } catch (err) {
        console.error("Error checking interest:", err);
        if (!cancelled) setInterested(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [listing?.id, currentUser?.id]);

  useEffect(() => {
    if (!listing) {
      setInterestedCount(0);
      return;
    }

    const fetchCount = async () => {
      const count = await getInterestedCount(listing.id);
      setInterestedCount(count);
    }

    fetchCount();
  }, [listing?.id]);

  // Toggle wishlist function
  async function toggleWishlist() {
    if (!currentUser || !listing) return;

    setIsAddingToWishlist(true);

    try {
      let success;

      if (isInWishlist) {
        // Remove from wishlist
        success = await removeFromWishlist(currentUser.id, listing.id);
      } else {
        // Add to wishlist
        success = await addToWishlist(currentUser.id, listing.id);
      }

      // Update state if operation was successful
      if (success) {
        setIsInWishlist(!isInWishlist);
      }
    } catch (error) {
      console.error("Error updating wishlist:", error);
    } finally {
      setIsAddingToWishlist(false);
    }
  }

  async function toggleInterested() {
    // Add interested flag on DB and increase count
    // Send email to seller @Akhilesh
    if (!currentUser || !listing) return;
    let success

    try {
      console.log(interested);
      if (!interested) {
        console.log("Adding interest");
        success = await addInterestedUser(listing.id, currentUser.id);
      } else {
        console.log("Removing interest");
        success = await removeInterestedUser(listing.id, currentUser.id);
      }
    } catch (error) {
      console.error("Error marking interest:", error);
    } finally {
      if (success) {
        onOpen();
        setInterested((prev) => !prev);
      } else {
        alert("Could not update your interest. Please try again.")
      };
    }
  }

  // Loading skeleton
  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="flex flex-col md:flex-row gap-8">
          <div className="w-full md:w-7/12">
            <Skeleton className="aspect-square w-full rounded-lg" />
            <div className="flex gap-2 mt-4">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="w-20 h-20 rounded-md" />
              ))}
            </div>
          </div>

          <div className="w-full md:w-5/12">
            <Skeleton className="h-10 w-3/4 rounded-lg mb-4" />
            <Skeleton className="h-8 w-1/3 rounded-lg mb-4" />
            <Skeleton className="h-6 w-full rounded-lg mb-4" />
            <Skeleton className="h-6 w-full rounded-lg mb-4" />
            <Skeleton className="h-6 w-3/4 rounded-lg mb-8" />

            <Skeleton className="h-12 rounded-lg mb-4" />

            <div className="mt-8">
              <Skeleton className="h-16 rounded-lg" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  // If listing doesn't exist
  if (!listing) {
    return (
      <div className="container mx-auto p-8 text-center">
        <h1 className="text-2xl font-bold mb-4">Listing Not Found</h1>
        <p className="mb-8 text-gray-600 dark:text-gray-400">
          The listing you&apos;re looking for doesn&apos;t exist or has been removed.
        </p>
        <Button as={Link} href="/browse" color="primary">
          Browse Other Items
        </Button>
      </div>
    );
  }

  const isActive = isListingActive(listing);
  const placeholderImage = "/images/placeholder-image.png";
  const listingImages = listing.image && listing.image.length > 0
    ? listing.image
    : [placeholderImage];

  return (
    <>
    <Modal isOpen={isOpen} onOpenChange={onOpenChange}>
      <ModalContent>
        {(onClose) => (
            <>
              <ModalHeader className="flex flex-col gap-1">Marked as Interested</ModalHeader>
              <ModalBody>
                <p>
                  Seller has been notified of your interest. They will reach out to you via GChat.
                </p>
                <p>
                  If the product has a price on request, it will be sent to you shortly.
                </p>
              </ModalBody>
              <ModalFooter>
                <Button color="danger" variant="light" onPress={onClose}>
                  Close
                </Button>
              </ModalFooter>
            </>
          )}
      </ModalContent>
    </Modal>
    <div className="container mx-auto px-4 py-6 max-w-6xl">
      {/* Rest of the component remains the same */}
      {/* Breadcrumb */}
      <div className="mb-4 flex items-center text-sm text-gray-500 dark:text-gray-400">
        <Link href="/browse" className="flex items-center hover:text-indigo-600 dark:hover:text-indigo-400">
          <ChevronLeft className="h-4 w-4 mr-1" />
          Back to browsing
        </Link>
        <span className="mx-2">•</span>
        {listing.categories && (
          <>
            <Link href={`/category/${listing.categories.key || listing.categories.name?.toLowerCase()}`} className="hover:text-indigo-600 dark:hover:text-indigo-400">
              {listing.categories.name}
            </Link>
            <span className="mx-2">•</span>
          </>
        )}
        <span className="truncate">{listing.name}</span>
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        {/* Image Gallery Section */}
        <div className="w-full lg:w-7/12">
          <div className="relative">
            {/* Main Image */}
            <div className="relative aspect-square overflow-hidden rounded-lg bg-gray-100 dark:bg-gray-800">
              <Image
                src={listingImages[selectedImageIndex]}
                alt={listing.name || "Product Image"}
                className="object-cover"
                radius="md"
              />

              {/* Status Badge */}
              {!isActive && (
                <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                  <Chip size="lg" color="danger" variant="shadow">
                    This listing has expired
                  </Chip>
                </div>
              )}

              {/* Condition badge */}
              {listing.condition && (
                <Chip
                  className="absolute top-3 left-3"
                  color="secondary"
                  variant="shadow"
                >
                  {listing.condition}
                </Chip>
              )}
            </div>

            {/* Thumbnail Gallery */}
            {listingImages.length > 1 && (
              <div className="mt-4 grid grid-cols-5 gap-2">
                {listingImages.map((img, index) => (
                  <button
                    key={index}
                    onClick={() => setSelectedImageIndex(index)}
                    className={`relative aspect-square overflow-hidden rounded-md hover:opacity-90 ${selectedImageIndex === index
                        ? "ring-2 ring-indigo-600 dark:ring-indigo-400"
                        : "opacity-70"
                      }`}
                  >
                    <Image
                      src={img}
                      alt={`Product image ${index + 1}`}
                      className="object-cover"
                      radius="sm"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Mobile: Action Buttons */}
          <div className="flex mt-4 gap-2 lg:hidden">
            <Button
              className="flex-1"
              color={interested ? 'success' : 'secondary'}
              variant="flat"
              isDisabled={!isActive}
              onPress={toggleInterested}
              startContent={interested ? <Check size={18} /> : <ShoppingBag size={18} />}
            >
              {interested ? "Interested" : "Mark as Interested"}
            </Button>
            <Button
              isIconOnly
              variant="flat"
              color={isInWishlist ? "danger" : "default"}
              onPress={toggleWishlist}
              isLoading={isAddingToWishlist}
            >
              <Heart fill={isInWishlist ? "currentColor" : "none"} />
            </Button>
            <Button
              isIconOnly
              variant="flat"
              onPress={() => {
                if (navigator.share) {
                  navigator.share({
                    title: listing.name || "Check out this listing",
                    text: listing.description || "Found this on Ashoka Marketplace",
                    url: window.location.href,
                  });
                } else {
                  navigator.clipboard.writeText(window.location.href);
                  // Would add toast notification here
                }
              }}
            >
              <Share2 />
            </Button>
          </div>

          {/* Description Section - Mobile only */}
          <div className="mt-6 lg:hidden">
            <h2 className="text-lg font-semibold mb-2">Description</h2>
            <p className="text-gray-700 dark:text-gray-300 whitespace-pre-line">
              {listing.description || "No description provided."}
            </p>
          </div>
        </div>

        {/* Rest of the component remains the same... */}
        {/* Listing Details Section */}
        <div className="w-full lg:w-5/12">
          {/* Product Title and Price */}
          <div className="mb-4">
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground">
              {listing.name || "Unnamed Item"}
            </h1>
            <div className="mt-3 flex items-center justify-between">
              <div className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">
                {listing.price ? `₹${listing.price.toLocaleString("en-IN")}` : "Price on request"}
              </div>
              <div className="text-sm text-gray-500 dark:text-gray-400">
                Listed {formatDistanceToNow(new Date(listing.created_at), { addSuffix: true })}
              </div>
            </div>
          </div>

          {/* Product Metadata */}
          <div className="grid grid-cols-2 gap-y-2 gap-x-4 text-sm mb-6">
            {listing.categories && (
              <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                <Tag size={16} />
                <span>Category: <span className="font-medium text-foreground">{listing.categories.name}</span></span>
              </div>
            )}
            {listing.condition && (
              <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                <Info size={16} />
                <span>Condition: <span className="font-medium text-foreground">{listing.condition}</span></span>
              </div>
            )}
            <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
              <Calendar size={16} />
              <span>Listed on: <span className="font-medium text-foreground">
                {format(new Date(listing.created_at), 'MMM d, yyyy')}
              </span></span>
            </div>
            <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
              <MapPin size={16} />
              <span>Location: <span className="font-medium text-foreground">Ashoka University</span></span>
            </div>
            <div className="flex items-center justify-center gap-2 text-black dark:text-white col-span-2 pt-6">
              <Eye size={18} />
              <span className="text-large">Interested: <span className="text-large font-medium text-foreground">{interestedCount}</span></span>
            </div>
          </div>

          {/* Desktop: Description Section */}
          <div className="hidden lg:block mb-6">
            <h2 className="text-lg font-semibold mb-2 text-foreground">Description</h2>
            <p className="text-gray-700 dark:text-gray-300 whitespace-pre-line">
              {listing.description || "No description provided."}
            </p>
          </div>

          {/* Desktop: Action Buttons */}
          <div className="hidden lg:flex gap-2 mb-6">
            <Button
              className="flex-1"
              color={interested ? 'success' : 'secondary'}
              size="lg"
              isDisabled={!isActive}
              onPress={toggleInterested}
              startContent={interested ? <Check size={18} /> : <ShoppingBag size={18} />}
            >
              {interested ? "Interested" : "Mark as Interested"}
            </Button>
            <Button
              variant="flat"
              color={isInWishlist ? "danger" : "default"}
              onPress={toggleWishlist}
              isLoading={isAddingToWishlist}
              startContent={<Heart fill={isInWishlist ? "currentColor" : "none"} />}
              size="lg"
            >
              {isInWishlist ? "Saved" : "Save"}
            </Button>
            <Tooltip content="Share listing">
              <Button
                isIconOnly
                variant="flat"
                size="lg"
                onClick={() => {
                  if (navigator.share) {
                    navigator.share({
                      title: listing.name || "Check out this listing",
                      text: listing.description || "Found this on Ashoka Marketplace",
                      url: window.location.href,
                    });
                  } else {
                    navigator.clipboard.writeText(window.location.href);
                    // Would add toast notification here
                  }
                }}
              >
                <Share2 size={20} />
              </Button>
            </Tooltip>
          </div>

          {/* Warning if expired */}
          {!isActive && (
            <div className="bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 p-4 rounded-lg mb-6">
              <p className="text-sm">
                This listing has expired and is no longer available for purchase.
              </p>
            </div>
          )}

          {/* Seller Info Card */}
          <Card className="mb-6">
            <CardHeader className="pb-0 pt-4">
              <h2 className="text-lg font-semibold">About the Seller</h2>
            </CardHeader>
            <CardBody>
              <div className="flex items-center">
                <Avatar
                  src={seller?.avatar || "https://i.pravatar.cc/300"}
                  name={seller?.name?.charAt(0).toUpperCase() || "U"}
                  size="md"
                  className="mr-4"
                />
                <div>
                  <h3 className="font-medium">
                    {seller?.name || "Ashoka User"}
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Member since {format(new Date(seller?.created_at || listing.created_at), 'MMM yyyy')}
                  </p>
                </div>
              </div>
              <div className="mt-4 flex justify-between text-sm">
                <Button
                  as={Link}
                  href={`/profile/${seller?.user_id}`}
                  variant="flat"
                  color="secondary"
                  className="w-full"
                >
                  View Profile
                </Button>
              </div>
            </CardBody>
          </Card>

          {/* Report Button */}
          <div className="text-center">
            <Button
              variant="light"
              color="danger"
              size="sm"
              as={Link}
              href={`/report?listing=${listing.id}`}
              startContent={<Flag size={16} />}
              className="text-xs"
            >
              Report this listing
            </Button>
          </div>
        </div>
      </div>

      {/* Similar Listings */}
      {similarListings.length > 0 && (
        <div className="mt-12">
          <Divider className="mb-6" />
          <h2 className="text-xl font-bold mb-6">Similar Items</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {similarListings.map((item) => (
              <ProductCard key={item.id} product={item} />
            ))}
          </div>
        </div>
      )}
    </div>
    </>
  );
}