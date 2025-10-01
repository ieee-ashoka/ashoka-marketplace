import { createClient } from "@/utils/supabase/client";

export interface UploadResult {
  success: boolean;
  url?: string;
  error?: string;
}

// Helper to extract file path from Supabase storage URL
function extractFilePathFromUrl(url: string): string | null {
  try {
    // Supabase storage URLs typically look like:
    // https://[project].supabase.co/storage/v1/object/public/profile_images/filename.webp
    const urlParts = url.split("/");
    const publicIndex = urlParts.indexOf("public");

    if (publicIndex !== -1 && publicIndex < urlParts.length - 2) {
      // Extract the path after 'public/bucket_name/'
      const pathParts = urlParts.slice(publicIndex + 2);
      return pathParts.join("/");
    }

    return null;
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
  const supabase = createClient();

  try {
    // Generate unique filename
    const fileExt = file.name.split(".").pop();
    const timestamp = Date.now();
    const randomStr = Math.random().toString(36).substring(7);

    const folderPath = folder ? `${folder}/` : "";
    const fileName = `${folderPath}${userId}/${timestamp}-${randomStr}.${fileExt}`;

    // Upload to storage
    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(fileName, file, {
        cacheControl: "3600",
        upsert: false,
      });

    if (error) {
      console.error("Error uploading image:", error);
      return {
        success: false,
        error: error.message,
      };
    }

    // Get public URL
    const {
      data: { publicUrl },
    } = supabase.storage.from(bucket).getPublicUrl(data.path);

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
  const supabase = createClient();

  try {
    const filePath = extractFilePathFromUrl(imageUrl);

    if (!filePath) {
      console.warn("Could not extract file path from URL:", imageUrl);
      return false;
    }

    const { error } = await supabase.storage.from(bucket).remove([filePath]);

    if (error) {
      console.error("Error deleting image:", error);
      return false;
    }

    console.log("Successfully deleted image:", filePath);
    return true;
  } catch (error) {
    console.error("Error in deleteImage:", error);
    return false;
  }
}
