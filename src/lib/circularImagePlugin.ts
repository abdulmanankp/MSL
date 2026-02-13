import { image as defaultImage } from '@pdfme/schemas';
import type { Schema, Plugin } from '@pdfme/common';

/**
 * Custom circular image plugin for pdfme using Canvas clipping
 * Creates circular profile images with white border using canvas API
 * Integrates with existing pdfme Designer configuration
 */

interface CircularImageSchema extends Schema {
  type: 'image';
  borderWidth?: number;
  borderColor?: string;
}

/**
 * Helper function to render circular image with white border using canvas clipping
 * Maintains aspect ratio and center-crops the image to avoid compression
 * @param imageSource Image data URL or path
 * @param width Circle width
 * @param height Circle height
 * @param borderWidth White border width in pixels
 * @param borderColor Border color (hex code)
 * @returns Promise resolving to canvas data URL
 */
export const createCircularImageWithBorder = (
  imageSource: string,
  width: number,
  height: number,
  borderWidth: number = 10,
  borderColor: string = '#FFFFFF'
): Promise<string> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    
    img.onload = () => {
      try {
        // Use higher resolution for better quality (2x scale)
        const scale = 2;
        const highResWidth = width * scale;
        const highResHeight = height * scale;
        const highResBorderWidth = borderWidth * scale;
        
        const canvas = document.createElement('canvas');
        const radius = Math.min(highResWidth, highResHeight) / 2;
        
        canvas.width = highResWidth;
        canvas.height = highResHeight;
        
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Failed to get canvas context'));
          return;
        }

        // Enable image smoothing for better quality
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';

        // Clear canvas
        ctx.clearRect(0, 0, highResWidth, highResHeight);

        // Draw white border circle
        ctx.fillStyle = borderColor;
        ctx.beginPath();
        ctx.arc(radius, radius, radius, 0, Math.PI * 2);
        ctx.fill();

        // Create circular clipping path for image
        ctx.beginPath();
        ctx.arc(radius, radius, radius - highResBorderWidth, 0, Math.PI * 2);
        ctx.clip();

        // Calculate image dimensions maintaining aspect ratio and center-crop
        const imageRadius = radius - highResBorderWidth;
        const circleSize = imageRadius * 2;
        
        // Calculate scaling to fill circle without distortion
        const scale_x = circleSize / img.width;
        const scale_y = circleSize / img.height;
        const scale_max = Math.max(scale_x, scale_y);
        
        const scaledWidth = img.width * scale_max;
        const scaledHeight = img.height * scale_max;
        
        // Center the scaled image
        const offsetX = (circleSize - scaledWidth) / 2;
        const offsetY = (circleSize - scaledHeight) / 2;
        
        // Draw image centered in circle, maintaining aspect ratio
        ctx.drawImage(img, 
          highResBorderWidth + offsetX, 
          highResBorderWidth + offsetY, 
          scaledWidth, 
          scaledHeight
        );

        resolve(canvas.toDataURL('image/png'));
      } catch (error) {
        reject(error);
      }
    };

    img.onerror = () => {
      reject(new Error('Failed to load image'));
    };

    img.src = imageSource;
  });
};

/**
 * Custom image plugin extending pdfme's default image plugin
 * Adds borderWidth and borderColor properties for circular rendering
 */
export const circularImagePlugin: Plugin<CircularImageSchema> = {
  ...defaultImage,
  propPanel: {
    ...defaultImage.propPanel,
    defaultSchema: {
      ...(defaultImage.propPanel?.defaultSchema as Record<string, unknown>),
      // Circular profile photo with white border
      borderWidth: 10,
      borderColor: '#FFFFFF',
    } as unknown as CircularImageSchema,
  },
} as unknown as Plugin<CircularImageSchema>;

export default circularImagePlugin;


