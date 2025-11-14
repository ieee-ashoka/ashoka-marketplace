"use server"

import { R2 } from "@/utils/r2/client";
import { PutObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";


export interface UploadResult {
  success: boolean;
  url?: string;
  error?: string;
}

// Helper to extract file path from R2 storage URL CDN
function extractFilePathFromUrl(url: string): string | null {
  try {
    // Example CDN URL:
    // https://cdn.ieee-ashoka.in/folder/image.ext

    const parsedUrl = new URL(url);
    // Remove the leading slash
    const path = parsedUrl.pathname.startsWith("/")
      ? parsedUrl.pathname.slice(1)
      : parsedUrl.pathname;

    return path || null; // e.g. "uploads/avatar.webp"
  } catch (error) {
    console.error("Error extracting file path from URL:", error);
    return null;
  }
}

/**
 * Uploads an image to Supabase storage
 * @param file - The file to upload
 * @param bucket - The storage bucket name
 * @param userId - The user ID for organizing files
 * @param folder - Optional folder within the user's directory
 * @returns Promise<UploadResult>
 */
export async function uploadImage(
  file: File,
  bucket: string,
  userId: string,
  folder?: string
): Promise<UploadResult> {
  try {
    // Generate unique filename
    const fileExt = file.name.split(".").pop();
    const timestamp = Date.now();
    const randomStr = Math.random().toString(36).substring(7);

    const folderPath = folder ? `${folder}/${userId}/` : "";
    const fileName = `${timestamp}-${randomStr}.${fileExt}`;

    const arrayBuffer = await file.arrayBuffer(); // convert File → ArrayBuffer
    const body = Buffer.from(arrayBuffer); // convert ArrayBuffer → Buffer

    const cmd = new PutObjectCommand({
      Bucket: bucket,
      Key: folderPath + fileName,
      Body: body,
      ContentType: file.type,
    });

    await R2.send(cmd);

    const publicUrl = `${process.env.STATIC_URL}/${folderPath}${fileName}`;

    return {
      success: true,
      url: publicUrl,
    };
  } catch (error) {
    console.error("Unexpected error uploading image:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Uploads multiple images to Supabase storage
 * @param files - Array of files to upload
 * @param bucket - The storage bucket name
 * @param userId - The user ID for organizing files
 * @param folder - Optional folder within the user's directory
 * @returns Promise<UploadResult[]> - Array of upload results
 */
export async function uploadMultipleImages(
  files: File[],
  bucket: string,
  userId: string,
  folder?: string
): Promise<UploadResult[]> {
  try {
    const uploadPromises = files.map((file) =>
      uploadImage(file, bucket, userId, folder)
    );
    return await Promise.all(uploadPromises);
  } catch (error) {
    console.error("Error uploading multiple images:", error);
    throw new Error(
      `Bulk image upload failed: ${
        error instanceof Error ? error.message : "Unknown error"
      }`
    );
  }
}

// Helper to delete image from storage
export async function deleteImage(
  imageUrl: string,
  bucket: string
): Promise<boolean> {
  try {
    const filePath = extractFilePathFromUrl(imageUrl);

    if (!filePath) {
      console.warn("Could not extract file path from URL:", imageUrl);
      return false;
    }

    const cmd = new DeleteObjectCommand({
      Bucket: bucket,
      Key: filePath,
    });

    R2.send(cmd);

    console.log("Successfully deleted image:", filePath);
    return true;
  } catch (error) {
    console.error("Error in deleteImage:", error);
    return false;
  }
}
