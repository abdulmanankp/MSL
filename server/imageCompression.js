import sharp from 'sharp';
import { logError, logInfo, logWarn } from './logger.js';

/**
 * Compress image file buffer
 * @param {Buffer} imageBuffer - Image file buffer
 * @param {Object} options - Compression options
 * @returns {Promise<Buffer>} - Compressed image buffer
 */
export async function compressImage(imageBuffer, options = {}) {
  try {
    const {
      maxWidth = 1024,
      maxHeight = 1024,
      quality = 80,
      maxSizeBytes = 250 * 1024 // 250KB default
    } = options;

    let pipeline = sharp(imageBuffer);
    
    // Get metadata to check dimensions
    const metadata = await pipeline.metadata();
    
    // Resize if necessary
    if (metadata.width > maxWidth || metadata.height > maxHeight) {
      pipeline = pipeline.resize(maxWidth, maxHeight, {
        fit: 'inside',
        withoutEnlargement: true
      });
    }

    // Compress based on format
    let compressed;
    if (metadata.format === 'png') {
      compressed = await pipeline
        .png({ quality, compressionLevel: 9 })
        .toBuffer();
    } else if (metadata.format === 'webp') {
      compressed = await pipeline
        .webp({ quality })
        .toBuffer();
    } else {
      // Default to JPEG for others
      compressed = await pipeline
        .jpeg({ quality, progressive: true })
        .toBuffer();
    }

    // Check if still over size limit
    if (compressed.length > maxSizeBytes) {
      logWarn(`Compressed image still over size limit (${compressed.length} bytes), further reducing quality`);
      
      // Use lossy compression with reduced quality
      pipeline = sharp(imageBuffer);
      if (metadata.width > maxWidth || metadata.height > maxHeight) {
        pipeline = pipeline.resize(maxWidth, maxHeight, {
          fit: 'inside',
          withoutEnlargement: true
        });
      }
      
      if (metadata.format === 'png') {
        compressed = await pipeline
          .png({ quality: 60, compressionLevel: 9 })
          .toBuffer();
      } else {
        compressed = await pipeline
          .jpeg({ quality: 60, progressive: true })
          .toBuffer();
      }
    }

    logInfo(`Image compressed: ${imageBuffer.length} → ${compressed.length} bytes`);
    return compressed;
  } catch (error) {
    logError('Image compression failed:', error);
    throw new Error(`Image compression failed: ${error.message}`);
  }
}

/**
 * Convert image to JPEG format
 * @param {Buffer} imageBuffer - Image file buffer
 * @param {number} quality - JPEG quality (1-100)
 * @returns {Promise<Buffer>} - JPEG image buffer
 */
export async function convertToJpeg(imageBuffer, quality = 80) {
  try {
    const jpeg = await sharp(imageBuffer)
      .jpeg({ quality, progressive: true })
      .toBuffer();
    
    logInfo(`Image converted to JPEG: ${imageBuffer.length} → ${jpeg.length} bytes`);
    return jpeg;
  } catch (error) {
    logError('JPEG conversion failed:', error);
    throw new Error(`JPEG conversion failed: ${error.message}`);
  }
}

/**
 * Get image dimensions
 * @param {Buffer} imageBuffer - Image file buffer
 * @returns {Promise<Object>} - Image metadata
 */
export async function getImageMetadata(imageBuffer) {
  try {
    const metadata = await sharp(imageBuffer).metadata();
    return {
      width: metadata.width,
      height: metadata.height,
      format: metadata.format,
      size: imageBuffer.length,
      hasAlpha: metadata.hasAlpha
    };
  } catch (error) {
    logError('Failed to get image metadata:', error);
    throw new Error(`Failed to get image metadata: ${error.message}`);
  }
}
