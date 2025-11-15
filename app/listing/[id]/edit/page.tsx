"use client";
import React, { useState, useEffect } from "react";
import { Button, Input, Textarea, Select, SelectItem, Progress, Switch, Alert, SharedSelection } from "@heroui/react";
import Image from "next/image";
import { useRouter, useParams } from "next/navigation";
import { isValidImage } from "@/utils/images/compression";
import { deleteImage } from "@/utils/images/storage";
import {
    getListingForEdit,
    getCategories,
    updateListing,
    uploadMultipleListingImages,
    ListingWithCategory
} from "./helpers";
import { Tables } from "@/types/database.types";

interface ImagePreview {
    file?: File;
    preview: string;
    uploaded: boolean;
    url: string;
}

export default function EditListingPage() {
    const router = useRouter();
    const params = useParams();
    const listingId = params.id as string;

    const [listing, setListing] = useState<ListingWithCategory | null>(null);
    const [isOwner, setIsOwner] = useState(false);
    const [isLoadingData, setIsLoadingData] = useState(true);

    const [productName, setProductName] = useState("");
    const [selectedImages, setSelectedImages] = useState<ImagePreview[]>([]);
    const [productPrice, setProductPrice] = useState("");
    const [priceOnRequest, setPriceOnRequest] = useState(false);
    const [productDescription, setProductDescription] = useState("");
    const [productAge, setProductAge] = useState("");
    const [productCategory, setProductCategory] = useState<number | null>(null);
    const [productCondition, setProductCondition] = useState("");
    const [categories, setCategories] = useState<Tables<"categories">[]>([]);

    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState("");
    const [uploadProgress, setUploadProgress] = useState(0);
    const [success, setSuccess] = useState(false);

    const maxUploadSize = 7; // In MB

    // Load listing data and categories
    useEffect(() => {
        async function loadData() {
            try {
                setIsLoadingData(true);

                // Fetch listing
                const { listing: listingData, isOwner: ownerStatus } = await getListingForEdit(listingId);

                if (!listingData || !ownerStatus) {
                    setError("Listing not found or you don't have permission to edit it.");
                    setTimeout(() => router.push("/"), 2000);
                    return;
                }

                setListing(listingData);
                setIsOwner(ownerStatus);

                // Pre-fill form
                setProductName(listingData.name || "");
                setProductDescription(listingData.description || "");
                setProductPrice(listingData.price ? listingData.price.toString() : "");
                setPriceOnRequest(listingData.price === null);
                setProductAge(listingData.productAge ? listingData.productAge.toString() : "");
                setProductCategory(listingData.category);
                setProductCondition(listingData.condition || "");

                // Convert existing images to ImagePreview format
                if (listingData.image && Array.isArray(listingData.image)) {
                    const existingImages: ImagePreview[] = listingData.image.map((url) => ({
                        preview: url,
                        uploaded: true,
                        url: url,
                    }));
                    setSelectedImages(existingImages);
                }

                // Fetch categories
                const categoriesData = await getCategories();
                setCategories(categoriesData);
            } catch (err) {
                console.error("Error loading data:", err);
                setError("Failed to load listing data.");
            } finally {
                setIsLoadingData(false);
            }
        }

        if (listingId) {
            loadData();
        }
    }, [listingId, router]);

    // Function to handle multiple file selection
    const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const files = event.target.files;
        if (!files || files.length === 0) return;

        setError("");
        const newImages: ImagePreview[] = [];

        // Check if adding these images would exceed the limit
        if (selectedImages.length + files.length > 3) {
            setError("Maximum 3 images allowed per listing");
            return;
        }

        Array.from(files).forEach((file) => {
            // Validate image using the utility function
            if (!isValidImage(file)) {
                setError(`Invalid file type: ${file.name}. Please upload valid image files (JPEG, PNG, WebP, etc.).`);
                return;
            }

            // Check file size using the maxUploadSize constant
            if (file.size > maxUploadSize * 1024 * 1024) {
                setError(`File too large: ${file.name}. Maximum size is ${maxUploadSize}MB.`);
                return;
            }

            // Create preview URL
            const imageUrl = URL.createObjectURL(file);

            newImages.push({
                file,
                preview: imageUrl,
                uploaded: false,
                url: imageUrl,
            });
        });

        setSelectedImages((prev) => [...prev, ...newImages]);

        // Reset the input so the same file can be selected again if removed
        event.target.value = "";
    };

    // Function to remove an image
    const removeImage = async (index: number) => {
        setSelectedImages((prev) => {
            const updated = [...prev];
            const removed = updated[index];

            // Revoke the object URL to free memory if it's a local file
            if (!removed.uploaded) {
                URL.revokeObjectURL(removed.preview);
            }

            updated.splice(index, 1);
            return updated;
        });
    };

    // Handle form submission
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        setIsLoading(true);
        setUploadProgress(0);

        try {
            // Validate form
            if (!productName.trim()) {
                throw new Error("Product name is required");
            }
            if (!priceOnRequest && (!productPrice || Number(productPrice) <= 0)) {
                throw new Error("Please enter a valid price or enable 'Price on Request'");
            }
            if (!productCategory) {
                throw new Error("Please select a category");
            }
            if (!productCondition) {
                throw new Error("Please select a condition");
            }
            if (!productAge || Number(productAge) < 0) {
                throw new Error("Please enter a valid product age");
            }
            if (selectedImages.length === 0) {
                throw new Error("Please upload at least one image");
            }

            // Separate new images from existing ones
            const newImages = selectedImages.filter((img) => !img.uploaded && img.file);
            const existingImageUrls = selectedImages
                .filter((img) => img.uploaded)
                .map((img) => img.url);

            let allImageUrls = [...existingImageUrls];

            // Upload new images if any
            if (newImages.length > 0) {
                if (!listing?.user_id) {
                    throw new Error("User information not found");
                }

                const imageFiles = newImages.map((img) => img.file!);
                const uploadResult = await uploadMultipleListingImages(
                    imageFiles,
                    listing.user_id,
                    {
                        maxSizeMB: 3,
                        maxWidthOrHeight: 1200,
                        quality: 0.75,
                    },
                    (progress) => {
                        setUploadProgress(Math.round(progress * 0.5));
                    }
                );

                if (!uploadResult.success || uploadResult.urls.length === 0) {
                    const errorMessage =
                        uploadResult.errors.length > 0
                            ? uploadResult.errors.join("; ")
                            : "Failed to upload images";
                    throw new Error(errorMessage);
                }

                console.log("Image compression results:", uploadResult.compressionInfo);
                allImageUrls = [...allImageUrls, ...uploadResult.urls];
            }

            setUploadProgress(60);

            // Update the listing
            const updateResult = await updateListing(parseInt(listingId), {
                name: productName.trim(),
                description: productDescription.trim(),
                price: priceOnRequest ? null : Number(productPrice),
                category: productCategory,
                condition: productCondition,
                imageUrls: allImageUrls,
                productAge: Number(productAge),
            });

            setUploadProgress(100);

            if (!updateResult.success) {
                // If listing update failed, clean up newly uploaded images
                if (newImages.length > 0) {
                    console.log("Cleaning up uploaded images due to listing update failure...");
                    const newlyUploadedUrls = allImageUrls.filter(
                        (url) => !existingImageUrls.includes(url)
                    );
                    for (const url of newlyUploadedUrls) {
                        try {
                            await deleteImage(url, "ashoka-marketplace");
                        } catch (cleanupError) {
                            console.error("Failed to cleanup image:", url, cleanupError);
                        }
                    }
                }
                throw new Error(updateResult.message);
            }

            // Success! Redirect to the listing page
            setSuccess(true);
            setTimeout(() => {
                router.push(`/listing/${listingId}`);
            }, 1500);
        } catch (err) {
            console.error("Error updating listing:", err);
            setError(err instanceof Error ? err.message : "An error occurred");
            setUploadProgress(0);
        } finally {
            setIsLoading(false);
        }
    };

    // Cleanup object URLs on unmount
    React.useEffect(() => {
        return () => {
            selectedImages.forEach((img) => {
                if (!img.uploaded) {
                    URL.revokeObjectURL(img.preview);
                }
            });
        };
    }, [selectedImages]);

    // Loading state
    if (isLoadingData) {
        return (
            <div className="container mx-auto px-4 py-8 max-w-2xl">
                <h1 className="text-3xl font-extrabold tracking-wide mb-8">Loading...</h1>
            </div>
        );
    }

    // Not authorized
    if (!isOwner || !listing) {
        return (
            <div className="container mx-auto px-4 py-8 max-w-2xl">
                <div className="bg-red-100 dark:bg-red-900/30 border border-red-400 dark:border-red-700 text-red-700 dark:text-red-400 rounded-lg p-4">
                    {error || "You don't have permission to edit this listing."}
                </div>
            </div>
        );
    }

    return (
        <div className="container mx-auto px-4 py-8 max-w-2xl">
            <h1 className="text-3xl font-extrabold tracking-wide mb-8">
                Edit Listing
            </h1>

            {error && (
                <div className="mb-4 p-4 bg-red-100 dark:bg-red-900/30 border border-red-400 dark:border-red-700 text-red-700 dark:text-red-400 rounded-lg">
                    {error}
                </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
                {/* Product Name */}
                <Input
                    id="productName"
                    type="text"
                    label="Product Name"
                    labelPlacement="outside"
                    placeholder="e.g., iPhone 13 Pro Max"
                    value={productName}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setProductName(e.target.value)}
                    isRequired
                    isDisabled={isLoading}
                    className="w-full"
                />

                {/* Product Images */}
                <div>
                    <label className="block text-sm font-medium mb-2">
                        Product Images <span className="text-red-500">*</span>
                        <span className="text-xs text-gray-500 dark:text-gray-400 ml-2">
                            (Max 3 images, up to {maxUploadSize}MB each)
                        </span>
                    </label>

                    <div className="space-y-4">
                        <input
                            type="file"
                            accept="image/*"
                            multiple
                            onChange={handleImageChange}
                            disabled={isLoading || selectedImages.length >= 3}
                            className="block w-full text-sm text-gray-900 dark:text-gray-100 
                file:mr-4 file:py-2 file:px-4
                file:rounded-lg file:border-0
                file:text-sm file:font-semibold
                file:bg-indigo-50 file:text-indigo-700
                hover:file:bg-indigo-100
                dark:file:bg-indigo-900 dark:file:text-indigo-300
                dark:hover:file:bg-indigo-800
                disabled:opacity-50 disabled:cursor-not-allowed"
                        />

                        {selectedImages.length > 0 && (
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                {selectedImages.map((img, index) => (
                                    <div key={index} className="relative group">
                                        <Image
                                            src={img.preview}
                                            alt={`Preview ${index + 1}`}
                                            width={200}
                                            height={200}
                                            className="rounded-lg w-full h-40 object-cover border-2 border-gray-200 dark:border-gray-700"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => removeImage(index)}
                                            disabled={isLoading}
                                            className="absolute top-2 right-2 bg-red-500 hover:bg-red-600 text-white rounded-full p-1.5 opacity-0 group-hover:opacity-100 transition-opacity disabled:opacity-50"
                                            aria-label="Remove image"
                                        >
                                            <svg
                                                className="w-4 h-4"
                                                fill="none"
                                                stroke="currentColor"
                                                viewBox="0 0 24 24"
                                            >
                                                <path
                                                    strokeLinecap="round"
                                                    strokeLinejoin="round"
                                                    strokeWidth={2}
                                                    d="M6 18L18 6M6 6l12 12"
                                                />
                                            </svg>
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* Product Price */}
                <div className="space-y-3">
                    <div className="flex items-center justify-between mb-10">
                        <Switch
                            isSelected={priceOnRequest}
                            onValueChange={(value: boolean) => {
                                setPriceOnRequest(value);
                                if (value) {
                                    setProductPrice("");
                                }
                            }}
                            isDisabled={isLoading}
                        >
                            <span className="text-sm">Price on Request</span>
                        </Switch>
                    </div>
                    {!priceOnRequest && (
                        <Input
                            id="productPrice"
                            type="number"
                            label="Price (₹)"
                            labelPlacement="outside"
                            placeholder="0.00"
                            value={productPrice}
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                                setProductPrice(e.target.value)
                            }
                            isRequired
                            min="0"
                            step="1"
                            isDisabled={isLoading}
                            className="w-full"
                        />
                    )}
                </div>

                {/* Product Description */}
                <Textarea
                    id="productDescription"
                    label="Description"
                    labelPlacement="outside"
                    placeholder="Describe your product..."
                    value={productDescription}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                        setProductDescription(e.target.value)
                    }
                    isDisabled={isLoading}
                    minRows={4}
                    isRequired
                    className="w-full"
                />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
                    {/* Product Category */}
                    <Select
                        id="productCategory"
                        label="Category"
                        labelPlacement="outside"
                        placeholder="Select a category"
                        selectedKeys={productCategory ? [productCategory.toString()] : []}
                        onSelectionChange={(keys: SharedSelection) => {
                            const selectedValue = Array.from(keys)[0] as string;
                            setProductCategory(selectedValue ? parseInt(selectedValue) : null);
                        }}
                        isRequired
                        isDisabled={isLoading}
                        className="w-full"
                    >
                        {categories.map((category) => (
                            <SelectItem key={category.id.toString()}>{category.name}</SelectItem>
                        ))}
                    </Select>

                    {/* Product Condition */}
                    <Select
                        id="productCondition"
                        label="Condition"
                        labelPlacement="outside"
                        placeholder="Select condition"
                        selectedKeys={productCondition ? [productCondition] : []}
                        onSelectionChange={(keys: SharedSelection) => {
                            const selectedValue = Array.from(keys)[0] as string;
                            setProductCondition(selectedValue || "");
                        }}
                        isRequired
                        isDisabled={isLoading}
                        className="w-full"
                    >
                        <SelectItem key="New">New</SelectItem>
                        <SelectItem key="Like New">Like New</SelectItem>
                        <SelectItem key="Good">Good</SelectItem>
                        <SelectItem key="Fair">Fair</SelectItem>
                        <SelectItem key="Poor">Poor</SelectItem>
                    </Select>
                </div>

                {/* Product Age */}
                <Input
                    id="productAge"
                    type="number"
                    label="Product Age (months)"
                    labelPlacement="outside"
                    placeholder="e.g., 6"
                    value={productAge}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setProductAge(e.target.value)}
                    min="0"
                    isDisabled={isLoading}
                    isRequired
                    className="w-full"
                />

                {/* Upload Progress */}
                {isLoading && uploadProgress > 0 && (
                    <Progress
                        label="Updating..."
                        value={uploadProgress}
                        color="primary"
                        showValueLabel={true}
                        className="w-full"
                    />
                )}

                {/* Submit Button */}
                <div className="flex gap-4">
                    <Button
                        type="submit"
                        isDisabled={isLoading}
                        color="primary"
                        className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold"
                    >
                        {isLoading ? "Updating Listing..." : "Update Listing"}
                    </Button>
                    <Button
                        type="button"
                        onPress={() => router.push(`/listing/${listingId}`)}
                        isDisabled={isLoading}
                        className="px-6 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-900 dark:text-white font-semibold py-3 rounded-lg disabled:opacity-50"
                    >
                        Cancel
                    </Button>
                </div>

                {success && (
                    <Alert
                        title="Success"
                        description="Listing updated successfully! Redirecting..."
                        color="success"
                        className="mt-4"
                    />
                )}
            </form>
        </div>
    );
}
