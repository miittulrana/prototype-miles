// src/utils/storageAccess.js
import { supabase } from '../services/supabase';

/**
 * Check storage access and permissions
 * This should be called on app initialization
 */
export const configureStorageAccess = async () => {
  try {
    // Just check if buckets exist, don't try to create them
    const { data: buckets, error } = await supabase.storage.listBuckets();
    
    if (error) {
      console.error('Error listing buckets:', error);
      return { success: false, error };
    }
    
    console.log('Available buckets:', buckets.map(b => b.name));
    
    return { success: true, buckets };
  } catch (err) {
    console.error('Error configuring storage access:', err);
    return { success: false, error: err };
  }
};

/**
 * Helper function to upload a file to a bucket with proper error handling
 */
export const uploadFileToBucket = async (bucketName, filePath, fileBlob, options = {}) => {
  try {
    // Attempt to upload with retries
    let retries = 3;
    let uploadError = null;
    
    while (retries > 0) {
      const { data, error } = await supabase.storage
        .from(bucketName)
        .upload(filePath, fileBlob, {
          upsert: true, // Overwrites if file exists
          contentType: options.contentType || 'application/octet-stream',
          ...options
        });
      
      if (!error) {
        return { success: true, data };
      }
      
      uploadError = error;
      console.warn(`Upload attempt failed (${retries} retries left):`, error);
      retries--;
      
      // Wait before retrying
      if (retries > 0) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
    
    throw uploadError;
  } catch (err) {
    console.error(`Error uploading file to ${bucketName}:`, err);
    return { success: false, error: err };
  }
};

/**
 * Get public URL for a file
 */
export const getPublicUrl = (bucketName, filePath) => {
  const { data } = supabase.storage.from(bucketName).getPublicUrl(filePath);
  return data.publicUrl;
};

export default { configureStorageAccess, uploadFileToBucket, getPublicUrl };