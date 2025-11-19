import { createClient } from '@supabase/supabase-js';
import imageCompression from 'browser-image-compression';

// Environment variables
const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
const supabaseKey = process.env.REACT_APP_SUPABASE_KEY;

// Create Supabase client for image operations
const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
});

// Configuration
const IMAGE_CONFIG = {
  maxSizeMB: 2,
  maxWidthOrHeight: 1920,
  quality: 0.8,
  allowedTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
  maxRetries: 3,
  retryDelay: 1000,
};

/**
 * Unified Image Service for handling both products and posts
 */
class ImageService {
  constructor() {
    this.bucket = 'post-images';
    this.cache = new Map();
  }

  /**
   * Compress and optimize an image file
   */
  async compressImage(file, options = {}) {
    try {
      const compressionOptions = {
        ...IMAGE_CONFIG,
        ...options,
      };

      if (file.size <= compressionOptions.maxSizeMB * 1024 * 1024) {
        return file; // No compression needed if under size limit
      }

      console.log('Compressing image:', file.name);
      const compressedFile = await imageCompression(file, compressionOptions);
      console.log('Compression complete:', {
        originalSize: file.size,
        compressedSize: compressedFile.size,
        compressionRatio: ((file.size - compressedFile.size) / file.size * 100).toFixed(2) + '%'
      });

      return compressedFile;
    } catch (error) {
      console.error('Image compression failed:', error);
      // Return original file if compression fails
      return file;
    }
  }

  /**
   * Generate unique filename
   */
  generateFilename(originalName, entityId) {
    const timestamp = Date.now();
    const randomId = Math.random().toString(36).substring(2, 8);
    const extension = originalName.split('.').pop();
    return `${entityId}/${timestamp}-${randomId}.${extension}`;
  }

  /**
   * Upload image to Supabase Storage with retry logic
   */
  async uploadImage(file, entityId, options = {}) {
    const maxRetries = options.maxRetries || IMAGE_CONFIG.maxRetries;
    const retryDelay = options.retryDelay || IMAGE_CONFIG.retryDelay;

    let lastError = null;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        console.log(`Upload attempt ${attempt}/${maxRetries} for:`, file.name);

        // Compress image if needed
        const compressedFile = await this.compressImage(file, options);

        // Generate filename
        const storagePath = this.generateFilename(file.name, entityId);

        // Debug logging
        console.log('Upload debug info:', {
          bucket: this.bucket,
          storagePath,
          fileName: compressedFile.name,
          fileType: compressedFile.type,
          fileSize: compressedFile.size
        });

        // Upload to Supabase Storage
        const { data, error } = await supabase.storage
          .from(this.bucket)
          .upload(storagePath, compressedFile, {
            contentType: compressedFile.type,
            upsert: false,
          });

        // Debug logging for upload result
        console.log('Upload result:', { data, error });

        if (error) {
          throw error;
        }

        // Generate public URL
        const publicUrl = this.getPublicUrl(storagePath);

        // Store metadata in database
        const metadata = {
          storage_path: storagePath,
          filename: storagePath.split('/').pop(),
          original_filename: file.name,
          file_size: compressedFile.size,
          mime_type: compressedFile.type,
          image_url: publicUrl,
        };

        // Cache the URL
        this.cache.set(storagePath, publicUrl);

        return {
          success: true,
          data: {
            ...metadata,
            publicUrl,
            storagePath,
          },
          attempt,
        };

      } catch (error) {
        lastError = error;
        console.error(`Upload attempt ${attempt} failed:`, error);

        if (attempt < maxRetries) {
          console.log(`Retrying in ${retryDelay}ms...`);
          await this.delay(retryDelay);
        }
      }
    }

    return {
      success: false,
      error: lastError || 'Upload failed after multiple attempts',
      attempts: maxRetries,
    };
  }

  /**
   * Upload multiple images with progress tracking
   */
  async uploadMultipleImages(files, entityId, options = {}) {
    const results = [];
    const successfulUploads = [];
    const failedUploads = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const result = await this.uploadImage(file, entityId, options);
      
      results.push(result);

      if (result.success) {
        successfulUploads.push(result.data);
      } else {
        failedUploads.push({
          file: file.name,
          error: result.error,
          attempt: result.attempts,
        });
      }
    }

    return {
      success: failedUploads.length === 0,
      results,
      successfulUploads,
      failedUploads,
      summary: {
        total: files.length,
        successful: successfulUploads.length,
        failed: failedUploads.length,
      },
    };
  }

  /**
   * Get public URL for an image
   */
  getPublicUrl(storagePath) {
    const cachedUrl = this.cache.get(storagePath);
    if (cachedUrl) {
      console.log('Using cached URL for:', storagePath, cachedUrl);
      return cachedUrl;
    }

    console.log('Generating public URL for:', storagePath, 'bucket:', this.bucket);
    
    try {
      // First try using Supabase's getPublicUrl method
      const { data } = supabase.storage
        .from(this.bucket)
        .getPublicUrl(storagePath);

      if (data && data.publicUrl) {
        console.log('Generated public URL via Supabase:', data.publicUrl);
        this.cache.set(storagePath, data.publicUrl);
        return data.publicUrl;
      }
    } catch (error) {
      console.error('Error generating URL via Supabase:', error);
    }
    
    // Fallback: Construct CDN URL manually
    const fallbackUrl = this.constructCdnUrl(storagePath);
    console.log('Generated fallback CDN URL:', fallbackUrl);
    
    this.cache.set(storagePath, fallbackUrl);
    return fallbackUrl;
  }

  /**
   * Construct CDN URL manually as fallback
   */
  constructCdnUrl(storagePath) {
    // Extract the project reference from the Supabase URL
    const projectRef = supabaseUrl.split('//')[1].split('.')[0];
    const cdnUrl = `https://${projectRef}.supabase.co/storage/v1/object/public/${this.bucket}/${storagePath}`;
    return cdnUrl;
  }

  /**
   * Get image URLs for multiple storage paths
   */
  getPublicUrls(storagePaths) {
    return storagePaths.map(path => {
      try {
        const publicUrl = this.getPublicUrl(path);
        return {
          storage_path: path,
          publicUrl,
          success: true,
          error: null
        };
      } catch (error) {
        console.error('Error generating URL for path:', path, error);
        return {
          storage_path: path,
          publicUrl: null,
          success: false,
          error: error.message
        };
      }
    });
  }

  /**
   * Delete image from Supabase Storage
   */
  async deleteImage(storagePath) {
    try {
      const { error } = await supabase.storage
        .from(this.bucket)
        .remove([storagePath]);

      if (error) {
        throw error;
      }

      // Remove from cache
      this.cache.delete(storagePath);

      return {
        success: true,
        message: 'Image deleted successfully',
      };
    } catch (error) {
      console.error('Error deleting image:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Convert file to base64
   */
  fileToBase64(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result);
      reader.onerror = (error) => reject(error);
    });
  }
  
  /**
   * Validate file before upload
   */
  validateFile(file, options = {}) {
    const config = {
      maxSize: IMAGE_CONFIG.maxSizeMB * 1024 * 1024,
      allowedTypes: IMAGE_CONFIG.allowedTypes,
      ...options,
    };

    const errors = [];
    
    // Check file size
    if (file.size > config.maxSize) {
      errors.push(`File size exceeds ${config.maxSize / (1024 * 1024)}MB limit`);
    }

    // Check file type
    if (!config.allowedTypes.includes(file.type)) {
      errors.push(`File type ${file.type} is not allowed`);
    }

    return {
      valid: errors.length === 0,
      errors,
      file,
    };
  }

  /**
   * Clear cache
   */
  clearCache() {
    this.cache.clear();
  }

  /**
   * Utility function to delay execution
   */
  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Get image dimensions
   */
  getImageDimensions(file) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve({ width: img.width, height: img.height });
      img.onerror = reject;
      img.src = URL.createObjectURL(file);
    });
  }

  /**
   * Create image preview
   */
  createImagePreview(file, maxWidth = 200, maxHeight = 200) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');

        // Calculate dimensions
        let { width, height } = img;
        if (width > maxWidth) {
          height = (height * maxWidth) / width;
          width = maxWidth;
        }
        if (height > maxHeight) {
          width = (width * maxHeight) / height;
          height = maxHeight;
        }

        canvas.width = width;
        canvas.height = height;

        // Draw image
        ctx.drawImage(img, 0, 0, width, height);

        // Convert to blob
        canvas.toBlob((blob) => {
          resolve({
            preview: URL.createObjectURL(blob),
            dimensions: { width, height },
          });
        }, 'image/jpeg', 0.8);
      };
      img.onerror = reject;
      img.src = URL.createObjectURL(file);
    });
  }
}

// Export singleton instance
export const imageService = new ImageService();