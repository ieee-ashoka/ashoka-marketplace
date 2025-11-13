"use client";
import React, { useState, useEffect } from "react";
import { Button, Input, Textarea, Select, SelectItem, Progress, Switch, Alert, SharedSelection } from "@heroui/react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { isValidImage } from "@/utils/images/compression";
import { deleteImage } from "@/utils/images/storage";
import { createListing, uploadMultipleListingImages } from "./helpers";
import { createClient } from "@/utils/supabase/client";
import { Tables } from "@/types/database.types";

interface ImagePreview {
  file: File;
  preview: string;
  uploaded?: boolean;
  url?: string;
}

export default function SellPage() {
  const router = useRouter();
  const [productName, setProductName] = useState("");
  const [selectedImages, setSelectedImages] = useState<ImagePreview[]>([]);
  const [productPrice, setProductPrice] = useState("");
  const [priceOnRequest, setPriceOnRequest] = useState(false);
  const [productDescription, setProductDescription] = useState("");
  const [productAge, setProductAge] = useState("");
  const [productCategory, setProductCategory] = useState<number | null>(null);
  const [productCondition, setProductCondition] = useState("");
  const [categories, setCategories] = useState<Tables<"categories">[]>([]);
  const [success, setSuccess] = useState(false);

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [uploadProgress, setUploadProgress] = useState(0);

  const maxUploadSize = 7 // In Mb

  // Fetch categories on component mount
  useEffect(() => {
    async function fetchCategories() {
      try {
        const supabase = createClient();
        const { data, error } = await supabase
          .from("categories")
          .select("*")
          .order("name");

        if (error) throw error;
        setCategories(data || []);
      } catch (error) {
        console.error("Error fetching categories:", error);
      }
    }

    fetchCategories();
  }, []);

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

      // Create preview URL - validation will be done during upload
      const imageUrl = URL.createObjectURL(file);

      newImages.push({
        file,
        preview: imageUrl,
        uploaded: false,
      });
    });

    setSelectedImages((prev) => [...prev, ...newImages]);

    // Reset the input so the same file can be selected again if removed
    event.target.value = "";
  };  // Function to remove an image
  const removeImage = (index: number) => {
    setSelectedImages((prev) => {
      const updated = [...prev];
      const removed = updated[index];

      // Revoke the object URL to free memory
      URL.revokeObjectURL(removed.preview);

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

      // Get current user
      const supabase = createClient();
      const {
        data,
      } = await supabase.auth.getClaims();

      if (!data?.claims) {
        throw new Error("You must be logged in to create a listing");
      }

      // Upload images using the comprehensive helper function
      const imageFiles = selectedImages.map(img => img.file);
      const uploadResult = await uploadMultipleListingImages(
        imageFiles,
        data.claims.sub,
        {
          maxSizeMB: 3,
          maxWidthOrHeight: 1200,
          quality: 0.75,
        },
        (progress) => {
          // Update progress (50% of total progress for uploads)
          setUploadProgress(Math.round(progress * 0.5));
        }
      );

      if (!uploadResult.success || uploadResult.urls.length === 0) {
        const errorMessage = uploadResult.errors.length > 0
          ? uploadResult.errors.join('; ')
          : 'Failed to upload images';
        throw new Error(errorMessage);
      }

      // Log compression info for debugging
      console.log('Image compression results:', uploadResult.compressionInfo);

      setUploadProgress(60);

      // Create the listing
      const listingResult = await createListing({
        name: productName.trim(),
        description: productDescription.trim(),
        price: priceOnRequest ? null : Number(productPrice),
        category: productCategory,
        condition: productCondition,
        imageUrls: uploadResult.urls,
        productAge: Number(productAge),
      });

      setUploadProgress(100);

      if (!listingResult.success) {
        // If listing creation failed, try to clean up uploaded images
        console.log("Cleaning up uploaded images due to listing creation failure...");
        for (const url of uploadResult.urls) {
          try {
            await deleteImage(url, "ashoka-marketplace");
          } catch (cleanupError) {
            console.error("Failed to cleanup image:", url, cleanupError);
          }
        }
        throw new Error(listingResult.message);
      }

      // Success! Redirect to the listing or profile page
      setSuccess(true);
      router.push("/"); // or `/listing/${listingResult.listingId}`
    } catch (err) {
      console.error("Error creating listing:", err);
      setError(err instanceof Error ? err.message : "An error occurred");
      setUploadProgress(0);
    } finally {
      setIsLoading(false);
    }
  };

  // Cleanup object URLs on unmount
  React.useEffect(() => {
    return () => {
      selectedImages.forEach((img) => URL.revokeObjectURL(img.preview));
    };
  }, [selectedImages]);

  return (
    <div className="container mx-auto px-4 py-8 mb-10 max-w-2xl">
      <h1 className="text-3xl font-extrabold tracking-wide mb-8">
        Create New Listing
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
              disabled={isLoading || selectedImages.length >= 5}
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
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setProductPrice(e.target.value)}
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
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setProductDescription(e.target.value)}
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
              <SelectItem key={category.id.toString()}>
                {category.name}
              </SelectItem>
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
            label="Uploading..."
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
            className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold "
          >
            {isLoading ? "Creating Listing..." : "Create Listing"}
          </Button>
          <Button
            type="button"
            onPress={() => router.back()}
            isDisabled={isLoading}
            variant="light"
            color="danger"
          >
            Cancel
          </Button>
        </div>
        {success && (
          <Alert
            title="Success"
            description="Listing created successfully!"
            color="success"
            className="mt-4"
          />
        )}
      </form>
    </div>
  );
}
