// Image compression utility to reduce file size before storing in localStorage

interface CompressionOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number; // 0.1 to 1.0
  maxSizeKB?: number; // Maximum file size in KB
}

/**
 * Compresses an image file using canvas API
 * Returns compressed image as data URL
 */
export const compressImage = (
  file: File,
  options: CompressionOptions = {}
): Promise<string> => {
  return new Promise((resolve, reject) => {
    const {
      maxWidth = 1920,
      maxHeight = 1080,
      quality = 0.8,
      maxSizeKB = 500, // Default 500KB max
    } = options;

    const reader = new FileReader();

    reader.onload = (e) => {
      const img = new Image();
      
      img.onload = () => {
        // Calculate new dimensions while maintaining aspect ratio
        let width = img.width;
        let height = img.height;

        if (width > maxWidth || height > maxHeight) {
          const aspectRatio = width / height;
          if (width > height) {
            width = Math.min(width, maxWidth);
            height = width / aspectRatio;
          } else {
            height = Math.min(height, maxHeight);
            width = height * aspectRatio;
          }
        }

        // Create canvas and draw resized image
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');

        if (!ctx) {
          reject(new Error('Failed to get canvas context'));
          return;
        }

        // Use high-quality rendering
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(img, 0, 0, width, height);

        // Convert to blob with quality compression
        let currentQuality = quality;
        let compressedDataUrl = '';

        const compress = () => {
          canvas.toBlob(
            (blob) => {
              if (!blob) {
                reject(new Error('Failed to compress image'));
                return;
              }

              const sizeInKB = blob.size / 1024;
              compressedDataUrl = canvas.toDataURL('image/jpeg', currentQuality);

              // If still too large and quality can be reduced, try again
              if (sizeInKB > maxSizeKB && currentQuality > 0.1) {
                currentQuality = Math.max(0.1, currentQuality - 0.1);
                compress();
              } else {
                resolve(compressedDataUrl);
              }
            },
            'image/jpeg',
            currentQuality
          );
        };

        compress();
      };

      img.onerror = () => {
        reject(new Error('Failed to load image'));
      };

      img.src = e.target?.result as string;
    };

    reader.onerror = () => {
      reject(new Error('Failed to read file'));
    };

    reader.readAsDataURL(file);
  });
};

/**
 * Get image file size in KB
 */
export const getImageSize = (dataUrl: string): number => {
  // Approximate size calculation for base64 data URL
  const base64Data = dataUrl.split(',')[1];
  if (!base64Data) return 0;
  const sizeInBytes = (base64Data.length * 3) / 4;
  return sizeInBytes / 1024; // Convert to KB
};

