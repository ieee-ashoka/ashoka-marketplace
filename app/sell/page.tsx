"use client";

import React, { useState } from "react";
import { Button, Input } from "@heroui/react";

export default function ThemedInputPage() {
  const [inputValue, setInputValue] = useState("");
  const [selectedImage, setSelectedImage] = useState(null);

  return (
    <div className="container mx-auto px-4 py-8 max-w-lg">
      <h2 className="text-2xl font-bold mb-4">Product Details</h2>
      <form className="space-y-4">
        <Input
          type="text"
          placeholder="Name of the Product"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          required
        />
        <Button color="primary">Submit</Button>
      </form>
    </div>
  );
}