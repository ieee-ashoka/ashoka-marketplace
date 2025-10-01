"use client";

import React, { useState } from "react";
import { Button, Input } from "@heroui/react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { isValidImage } from "@/utils/images/compression";
import { deleteImage } from "@/utils/images/storage";
import { createListing, uploadMultipleListingImages } from "./helpers";
import { createClient } from "@/utils/supabase/client";

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
  const [productDescription, setProductDescription] = useState("");
  const [productAge, setProductAge] = useState("");
  const [productCategory, setProductCategory] = useState("");
  const [productCondition, setProductCondition] = useState("");

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [uploadProgress, setUploadProgress] = useState(0);

  // Function to handle multiple file selection
  const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    setError("");
    const newImages: ImagePreview[] = [];

    // Check if adding these images would exceed the limit
    if (selectedImages.length + files.length > 5) {
      setError("Maximum 5 images allowed per listing");
      return;
    }

    Array.from(files).forEach((file) => {
      // Validate image using the utility function
      if (!isValidImage(file)) {
        setError(`Invalid file type: ${file.name}. Please upload valid image files (JPEG, PNG, WebP, etc.).`);
        return;
      }

      // Check file size (10MB limit - the helper will handle compression)
      if (file.size > 10 * 1024 * 1024) {
        setError(`File too large: ${file.name}. Maximum size is 10MB.`);
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
      if (!productPrice || Number(productPrice) <= 0) {
        throw new Error("Please enter a valid price");
      }
      if (!productCategory) {
        throw new Error("Please select a category");
      }
      if (!productCondition) {
        throw new Error("Please select a condition");
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
          maxSizeMB: 1,
          maxWidthOrHeight: 1200,
          quality: 0.85,
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
        price: Number(productPrice),
        category: productCategory,
        condition: productCondition,
        imageUrls: uploadResult.urls,
        productAge: productAge ? Number(productAge) : undefined,
      });

      setUploadProgress(100);

      if (!listingResult.success) {
        // If listing creation failed, try to clean up uploaded images
        console.log("Cleaning up uploaded images due to listing creation failure...");
        for (const url of uploadResult.urls) {
          try {
            await deleteImage(url, "listing_images");
          } catch (cleanupError) {
            console.error("Failed to cleanup image:", url, cleanupError);
          }
        }
        throw new Error(listingResult.message);
      }

      // Success! Redirect to the listing or profile page
      alert(listingResult.message);
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
    <div className="container mx-auto px-4 py-8 max-w-2xl">
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
        <div>
          <label htmlFor="productName" className="block text-sm font-medium mb-2">
            Product Name <span className="text-red-500">*</span>
          </label>
          <Input
            id="productName"
            type="text"
            placeholder="e.g., iPhone 13 Pro Max"
            value={productName}
            onChange={(e) => setProductName(e.target.value)}
            required
            disabled={isLoading}
            className="w-full"
          />
        </div>

        {/* Product Images */}
        <div>
          <label className="block text-sm font-medium mb-2">
            Product Images <span className="text-red-500">*</span>
            <span className="text-xs text-gray-500 dark:text-gray-400 ml-2">
              (Max 5 images, up to 10MB each)
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
        <div>
          <label htmlFor="productPrice" className="block text-sm font-medium mb-2">
            Price (₹) <span className="text-red-500">*</span>
          </label>
          <Input
            id="productPrice"
            type="number"
            placeholder="0.00"
            value={productPrice}
            onChange={(e) => setProductPrice(e.target.value)}
            required
            min="0"
            step="0.01"
            disabled={isLoading}
            className="w-full"
          />
        </div>

        {/* Product Description */}
        <div>
          <label htmlFor="productDescription" className="block text-sm font-medium mb-2">
            Description
          </label>
          <textarea
            id="productDescription"
            placeholder="Describe your product..."
            value={productDescription}
            onChange={(e) => setProductDescription(e.target.value)}
            disabled={isLoading}
            rows={4}
            className="w-full p-3 border border-gray-300 dark:border-gray-700 rounded-lg 
              bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white 
              focus:ring-2 focus:ring-indigo-500 focus:border-transparent
              disabled:opacity-50 disabled:cursor-not-allowed"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Product Category */}
          <div>
            <label htmlFor="productCategory" className="block text-sm font-medium mb-2">
              Category <span className="text-red-500">*</span>
            </label>
            <select
              id="productCategory"
              value={productCategory}
              onChange={(e) => setProductCategory(e.target.value)}
              required
              disabled={isLoading}
              className="block w-full p-3 border border-gray-300 dark:border-gray-700 rounded-lg 
                bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white 
                focus:ring-2 focus:ring-indigo-500 focus:border-transparent
                disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <option value="">Select a category</option>
              <option value="electronics">Electronics</option>
              <option value="fashion">Fashion</option>
              <option value="home">Home & Furniture</option>
              <option value="books">Books</option>
              <option value="sports">Sports & Outdoors</option>
              <option value="beauty">Beauty & Personal Care</option>
              <option value="other">Other</option>
            </select>
          </div>

          {/* Product Condition */}
          <div>
            <label htmlFor="productCondition" className="block text-sm font-medium mb-2">
              Condition <span className="text-red-500">*</span>
            </label>
            <select
              id="productCondition"
              value={productCondition}
              onChange={(e) => setProductCondition(e.target.value)}
              required
              disabled={isLoading}
              className="block w-full p-3 border border-gray-300 dark:border-gray-700 rounded-lg 
                bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white 
                focus:ring-2 focus:ring-indigo-500 focus:border-transparent
                disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <option value="">Select condition</option>
              <option value="new">New</option>
              <option value="like-new">Like New</option>
              <option value="good">Good</option>
              <option value="fair">Fair</option>
              <option value="poor">Poor</option>
            </select>
          </div>
        </div>

        {/* Product Age (Optional) */}
        <div>
          <label htmlFor="productAge" className="block text-sm font-medium mb-2">
            Product Age (months)
            <span className="text-xs text-gray-500 dark:text-gray-400 ml-2">
              (Optional)
            </span>
          </label>
          <Input
            id="productAge"
            type="number"
            placeholder="e.g., 6"
            value={productAge}
            onChange={(e) => setProductAge(e.target.value)}
            min="0"
            disabled={isLoading}
            className="w-full"
          />
        </div>

        {/* Upload Progress */}
        {isLoading && uploadProgress > 0 && (
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Uploading...</span>
              <span>{uploadProgress}%</span>
            </div>
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5">
              <div
                className="bg-indigo-600 h-2.5 rounded-full transition-all duration-300"
                style={{ width: `${uploadProgress}%` }}
              ></div>
            </div>
          </div>
        )}

        {/* Submit Button */}
        <div className="flex gap-4">
          <Button
            type="submit"
            disabled={isLoading}
            className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? "Creating Listing..." : "Create Listing"}
          </Button>
          <Button
            type="button"
            onClick={() => router.back()}
            disabled={isLoading}
            className="px-6 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-900 dark:text-white font-semibold py-3 rounded-lg disabled:opacity-50"
          >
            Cancel
          </Button>
        </div>
      </form>
    </div>
  );
}
