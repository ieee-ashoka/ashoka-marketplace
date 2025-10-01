import imageCompression from "browser-image-compression";

export interface CompressionOptions {
  maxSizeMB?: number;
  maxWidthOrHeight?: number;
  useWebWorker?: boolean;
  quality?: number;
  initialQuality?: number;
  fileType?: string;
}

export interface CompressionResult {
  file: File;
  compressionInfo: {
    originalSize: string;
    compressedSize: string;
    compressionRatio: string;
    originalFormat: string;
    finalFormat: string;
  };
}

/**
 * Compresses an image file and converts it to WebP format
 * @param file - The image file to compress
 * @param options - Compression options
 * @returns Promise<CompressionResult> - The compressed WebP file with compression info
 */
export async function compressImage(
  file: File,
  options: CompressionOptions = {}
): Promise<CompressionResult> {
  try {
    // Validate input file
    if (!file || !file.type.startsWith("image/")) {
      throw new Error("Invalid file: Please provide a valid image file");
    }

    // Default compression options optimized for profile images
    const defaultOptions: CompressionOptions = {
      maxSizeMB: 0.5, // Maximum file size in MB
      maxWidthOrHeight: 800, // Maximum width or height in pixels
      useWebWorker: true, // Use web worker for better performance
      quality: 0.8, // Quality between 0 and 1
      initialQuality: 0.8, // Initial quality for the compression
      fileType: "image/webp", // Convert to WebP format
    };

    // Merge user options with defaults
    const compressionOptions = { ...defaultOptions, ...options };

    // Compress the image
    const compressedFile = await imageCompression(file, compressionOptions);

    // Create a new File object with WebP extension if the original wasn't WebP
    const fileName = file.name.replace(/\.[^/.]+$/, ".webp");
    const webpFile = new File([compressedFile], fileName, {
      type: "image/webp",
      lastModified: Date.now(),
    });

    const compressionInfo = {
      originalSize: `${(file.size / 1024 / 1024).toFixed(2)} MB`,
      compressedSize: `${(webpFile.size / 1024 / 1024).toFixed(2)} MB`,
      compressionRatio: `${((1 - webpFile.size / file.size) * 100).toFixed(
        1
      )}%`,
      originalFormat: file.type,
      finalFormat: webpFile.type,
    };

    console.log("Image compression completed:", compressionInfo);

    return {
      file: webpFile,
      compressionInfo,
    };
  } catch (error) {
    console.error("Error compressing image:", error);
    throw new Error(
      `Image compression failed: ${
        error instanceof Error ? error.message : "Unknown error"
      }`
    );
  }
}

/**
 * Validates if a file is a valid image
 * @param file - The file to validate
 * @returns boolean - True if valid image, false otherwise
 */
export function isValidImage(file: File): boolean {
  const validTypes = [
    "image/jpeg",
    "image/jpg",
    "image/png",
    "image/gif",
    "image/webp",
    "image/bmp",
    "image/svg+xml",
  ];

  return validTypes.includes(file.type);
}

/**
 * Gets image dimensions without loading the full image
 * @param file - The image file
 * @returns Promise<{width: number, height: number}> - Image dimensions
 */
export function getImageDimensions(
  file: File
): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve({ width: img.width, height: img.height });
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Failed to load image"));
    };

    img.src = url;
  });
}

/**
 * Converts a file to base64 string
 * @param file - The file to convert
 * @returns Promise<string> - Base64 string
 */
export function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = (error) => reject(error);
  });
}

/**
 * Compresses multiple images in parallel for better performance
 * @param files - Array of files to compress
 * @param options - Compression options
 * @returns Promise<CompressionResult[]> - Array of compression results
 */
export async function compressMultipleImages(
  files: File[],
  options: CompressionOptions = {}
): Promise<CompressionResult[]> {
  try {
    const compressionPromises = files.map((file) =>
      compressImage(file, options)
    );
    return await Promise.all(compressionPromises);
  } catch (error) {
    console.error("Error compressing multiple images:", error);
    throw new Error(
      `Bulk image compression failed: ${
        error instanceof Error ? error.message : "Unknown error"
      }`
    );
  }
}
