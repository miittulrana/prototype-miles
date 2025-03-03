// src/utils/createBuckets.js
import { supabase } from '../services/supabase';

/**
 * Ensures that required storage buckets exist
 * @returns {Promise} Promise that resolves when buckets are created
 */
export const ensureStorageBuckets = async () => {
  try {
    // First check if videos bucket exists
    const { data: buckets, error: listError } = await supabase
      .storage
      .listBuckets();
    
    if (listError) {
      console.error('Error listing buckets:', listError);
      throw listError;
    }
    
    // Check if videos bucket exists
    const videosExists = buckets.some(bucket => bucket.name === 'videos');
    const vehicleImagesExists = buckets.some(bucket => bucket.name === 'vehicle_images');
    
    // Create videos bucket if it doesn't exist
    if (!videosExists) {
      console.log('Creating videos bucket...');
      const { error: createError } = await supabase
        .storage
        .createBucket('videos', {
          public: true, // Make it publicly accessible
          fileSizeLimit: 50000000 // 50MB limit
        });
      
      if (createError) {
        console.error('Error creating videos bucket:', createError);
        throw createError;
      }
      console.log('Videos bucket created successfully');
    }
    
    // Create vehicle_images bucket if it doesn't exist
    if (!vehicleImagesExists) {
      console.log('Creating vehicle_images bucket...');
      const { error: createError } = await supabase
        .storage
        .createBucket('vehicle_images', {
          public: true, // Make it publicly accessible
          fileSizeLimit: 10000000 // 10MB limit
        });
      
      if (createError) {
        console.error('Error creating vehicle_images bucket:', createError);
        throw createError;
      }
      console.log('Vehicle_images bucket created successfully');
    }
    
    return { success: true };
  } catch (err) {
    console.error('Failed to ensure storage buckets exist:', err);
    return { success: false, error: err };
  }
};

export default ensureStorageBuckets;