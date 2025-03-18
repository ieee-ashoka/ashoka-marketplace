"use client";

import React, { useState } from "react";
import { Button, Input } from "@heroui/react";

export default function ThemedInputPage() {
  const [ProductName, setProductName] = useState("");
  const [SelectedImage, setSelectedImage] = useState(null);
  const [ProductPrice, setProductPrice] = useState("");
  const [ProductDescription, setProductDescription] = useState("");
  const [ProductAge, setProductAge] = useState("");
  const [ProductCategory, setProductCategory] = useState("");
  const [ProductCondition, setProductCondition] = useState("");

  // Function to handle file selection
  const handleImageChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      const imageUrl = URL.createObjectURL(file);
      setSelectedImage(imageUrl);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white">
  <h1 className="text-3xl font-extrabold underline tracking-wide mb-4">
    Product Details
  </h1>

  {/* Product Name */}
  <div>
    <h2 className="text-2xl mb-4">Product Name</h2>
    <form className="space-y-4">
      <Input
        type="text"
        placeholder="Name of the Product"
        value={ProductName}
        onChange={(e) => setProductName(e.target.value)}
        required
        className="bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white border border-gray-300 dark:border-gray-700"
      />
    </form>
  </div>

  {/* Product Image */}
  <div>
    <h2 className="text-2xl mb-4">Product Image</h2>
    <input type="file" accept="image/*" onChange={handleImageChange} className="block" />
    {SelectedImage && (
      <div className="mt-4">
        <p className="text-gray-600 dark:text-gray-300">Selected Image Preview:</p>
        <img
          src={SelectedImage}
          alt="Selected"
          className="mt-2 rounded-lg w-full max-h-64 object-cover"
        />
      </div>
    )}
  </div>

  {/* Product Price */}
  <div>
    <h2 className="text-2xl mb-4">Product Price</h2>
    <form className="space-y-4">
      <Input
        type="number"
        placeholder="Price of the Product"
        value={ProductPrice}
        onChange={(e) => setProductPrice(Number(e.target.value) || "")}
        required
        className="bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white border border-gray-300 dark:border-gray-700"
      />
    </form>
  </div>

  {/* Product Description */}
  <div>
    <h2 className="text-2xl mb-4">Product Description</h2>
    <form className="space-y-4">
      <Input
        type="text"
        placeholder="Product Description"
        value={ProductDescription}
        onChange={(e) => setProductDescription(e.target.value)}
        required
        className="bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white border border-gray-300 dark:border-gray-700"
      />
    </form>
  </div>

  {/* Product Age */}
  <div>
    <h2 className="text-2xl mb-4">Product Age</h2>
    <form className="space-y-4">
      <Input
        type="number"
        placeholder="Age of Product"
        value={ProductAge}
        onChange={(e) => setProductAge(Number(e.target.value) || "")}
        required
        className="bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white border border-gray-300 dark:border-gray-700"
      />
    </form>
  </div>

  {/* Product Category */}
  <div>
    <h2 className="text-2xl mb-4">Product Category</h2>
    <div className="relative">
      <select
        value={ProductCategory}
        onChange={(e) => setProductCategory(e.target.value)}
        className="block w-full p-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
      >
        <option value="" disabled>Select a category</option>
        <option value="electronics">Electronics</option>
        <option value="fashion">Fashion</option>
        <option value="home">Home & Furniture</option>
        <option value="books">Books</option>
        <option value="beauty">Beauty & Personal Care</option>
      </select>
    </div>
    {ProductCategory && (
      <p className="mt-2 text-gray-600 dark:text-gray-300">Selected Category: {ProductCategory}</p>
    )}
  </div>

  {/* Product Condition */}
  <div>
    <h2 className="text-2xl mb-4">Product Condition</h2>
    <form className="space-y-4">
      <Input
        type="text"
        placeholder="Condition of the Product"
        value={ProductCondition}
        onChange={(e) => setProductCondition(e.target.value)}
        required
        className="bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white border border-gray-300 dark:border-gray-700"
      />
    </form>
  </div>

  {/* Submit Button */}
  <Button color="primary" className="mt-4 bg-indigo-600 dark:bg-indigo-400 text-white dark:text-gray-900">
    Submit
  </Button>
 </div>

  );
}
