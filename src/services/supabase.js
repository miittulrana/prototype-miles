import { createClient } from '@supabase/supabase-js';

// Replace with your Supabase URL and anon key
const supabaseUrl = 'https://xanlzovkqqlibjuuztig.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inhhbmx6b3ZrcXFsaWJqdXV6dGlnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDA5MjExODQsImV4cCI6MjA1NjQ5NzE4NH0.tDhFQqB8Ai-VAB7Hs-utNsU-fNkTkTESlOrN521S4PM';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Check if the bucket exists, and create it if it doesn't
export const ensureBucketExists = async (bucketName) => {
  try {
    // Check if bucket exists
    const { data: buckets } = await supabase.storage.listBuckets();
    const bucketExists = buckets.some(bucket => bucket.name === bucketName);
    
    if (!bucketExists) {
      // Create bucket if it doesn't exist
      const { error } = await supabase.storage.createBucket(bucketName, {
        public: true, // Make the bucket public
      });
      
      if (error) {
        console.error('Error creating bucket:', error);
        return false;
      }
      console.log(`Bucket ${bucketName} created successfully.`);
    }
    
    return true;
  } catch (error) {
    console.error('Error checking/creating bucket:', error);
    return false;
  }
};

// Authentication services
export const auth = {
  // Sign in with email and password
  signIn: async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    return { data, error };
  },

  // Sign out
  signOut: async () => {
    const { error } = await supabase.auth.signOut();
    return { error };
  },

  // Get current user
  getCurrentUser: async () => {
    const { data } = await supabase.auth.getUser();
    return data.user;
  },

  // Check user role (admin or driver)
  getUserRole: async (userId) => {
    const { data, error } = await supabase
      .from('users')
      .select('role')
      .eq('id', userId)
      .single();
    
    if (error) return { role: null, error };
    return { role: data?.role, error: null };
  }
};

// Database services for vehicles
export const vehicles = {
  // Get all vehicles
  getAll: async () => {
    const { data, error } = await supabase
      .from('vehicles')
      .select('*');
    return { data, error };
  },

  // Get available vehicles
  getAvailable: async () => {
    const { data, error } = await supabase
      .from('vehicles')
      .select('*')
      .eq('status', 'available');
    return { data, error };
  },

  // Get vehicle by ID
  getById: async (id) => {
    const { data, error } = await supabase
      .from('vehicles')
      .select('*')
      .eq('id', id)
      .single();
    return { data, error };
  },

  // Update vehicle status
  updateStatus: async (id, status, driverId = null) => {
    const { data, error } = await supabase
      .from('vehicles')
      .update({ 
        status: status,
        assigned_driver_id: driverId 
      })
      .eq('id', id);
    return { data, error };
  },

  // Create a new vehicle
  create: async (vehicleData) => {
    const { data, error } = await supabase
      .from('vehicles')
      .insert([vehicleData]);
    return { data, error };
  }
};

// Database services for time logs
export const timeLogs = {
  // Create a punch in record
  punchIn: async (driverId, vehicleId) => {
    const { data, error } = await supabase
      .from('time_logs')
      .insert([{
        driver_id: driverId,
        vehicle_id: vehicleId,
        punch_in: new Date().toISOString(),
      }]);
    return { data, error };
  },

  // Update with punch out time
  punchOut: async (timeLogId) => {
    const { data, error } = await supabase
      .from('time_logs')
      .update({ punch_out: new Date().toISOString() })
      .eq('id', timeLogId);
    return { data, error };
  },

  // Get active time log for a driver
  getActiveForDriver: async (driverId) => {
    const { data, error } = await supabase
      .from('time_logs')
      .select('*')
      .eq('driver_id', driverId)
      .is('punch_out', null)
      .single();
    return { data, error };
  }
};

// Storage services for images
export const storage = {
  // Upload an image to storage
  uploadImage: async (bucketName, filePath, file) => {
    // Ensure bucket exists first
    await ensureBucketExists(bucketName);
    
    const { data, error } = await supabase.storage
      .from(bucketName)
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false,
        contentType: 'image/jpeg'
      });
    
    if (error) {
      console.error('Error uploading image to storage:', error);
    }
    
    return { data, error };
  },
  
  // Get a public URL for an image
  getPublicUrl: (bucketName, filePath) => {
    const { data } = supabase.storage
      .from(bucketName)
      .getPublicUrl(filePath);
    
    return data.publicUrl;
  },
  
  // List all files in a folder
  listFiles: async (bucketName, folderPath) => {
    const { data, error } = await supabase.storage
      .from(bucketName)
      .list(folderPath);
    
    return { data, error };
  },
  
  // Delete a file
  deleteFile: async (bucketName, filePath) => {
    const { data, error } = await supabase.storage
      .from(bucketName)
      .remove([filePath]);
    
    return { data, error };
  }
};

// API key management
export const apiKeys = {
  // Generate a new API key
  generate: async (userId, description) => {
    // Generate a random API key
    const apiKey = crypto.randomUUID().replace(/-/g, '');
    
    const { data, error } = await supabase
      .from('api_keys')
      .insert([{
        user_id: userId,
        api_key: apiKey,
        description: description,
        created_at: new Date().toISOString(),
      }]);
    
    if (error) return { apiKey: null, error };
    return { apiKey, error: null };
  },

  // Get all API keys for a user
  getAllForUser: async (userId) => {
    const { data, error } = await supabase
      .from('api_keys')
      .select('*')
      .eq('user_id', userId);
    
    return { data, error };
  },

  // Delete an API key
  delete: async (keyId) => {
    const { error } = await supabase
      .from('api_keys')
      .delete()
      .eq('id', keyId);
    
    return { error };
  }
};

// PDF generation service
export const pdfService = {
  // Convert images to PDF for vehicle inspection
  generateInspectionPdf: async (logId, vehicleId, images, timestamp) => {
    try {
      // First, get information about the vehicle and driver
      const { data: vehicleData, error: vehicleError } = await supabase
        .from('vehicles')
        .select('vehicle_number, make, model')
        .eq('id', vehicleId)
        .single();
      
      if (vehicleError) throw vehicleError;
      
      const { data: logData, error: logError } = await supabase
        .from('time_logs')
        .select('driver_id, punch_in, punch_out, drivers:users!time_logs_driver_id_fkey(name, email)')
        .eq('id', logId)
        .single();
      
      if (logError) throw logError;
      
      // Create a record in the inspection_pdfs table
      const inspectionRecord = {
        time_log_id: logId,
        vehicle_id: vehicleId,
        driver_id: logData.driver_id,
        image_count: images.length,
        created_at: timestamp || new Date().toISOString(),
        pdf_status: 'processing'
      };
      
      const { data: pdfRecord, error: pdfError } = await supabase
        .from('inspection_pdfs')
        .insert([inspectionRecord])
        .select()
        .single();
      
      if (pdfError) throw pdfError;
      
      // Process images to be stored as references
      const imageReferences = [];
      
      for (let i = 0; i < images.length; i++) {
        // Each image is already a data URL from the ImageCapture component
        // Store the image reference in a separate table or array field
        const imageRef = {
          inspection_pdf_id: pdfRecord.id,
          image_index: i,
          image_url: images[i],  // This could be a storage URL or data URL
          label: i === 0 ? 'Front' : 
                 i === 1 ? 'Driver Side' :
                 i === 2 ? 'Rear' :
                 i === 3 ? 'Passenger Side' :
                 i === 4 ? 'Interior' : 'Other'
        };
        
        const { data, error } = await supabase
          .from('inspection_images')
          .insert([imageRef]);
          
        if (error) throw error;
        
        imageReferences.push(imageRef);
      }
      
      // In a real implementation, you would use a PDF library
      // Here we'll simulate successful PDF generation
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Update the PDF record to mark as complete
      const { error: updateError } = await supabase
        .from('inspection_pdfs')
        .update({
          pdf_status: 'completed',
          pdf_url: `/api/pdf/${pdfRecord.id}`,
          vehicle_info: `${vehicleData.vehicle_number} - ${vehicleData.make} ${vehicleData.model}`,
          driver_info: logData.drivers.name,
          inspection_type: logData.punch_out ? 'post' : 'pre',
          inspection_time: timestamp || new Date().toISOString()
        })
        .eq('id', pdfRecord.id);
      
      if (updateError) throw updateError;
      
      return { 
        success: true, 
        pdfUrl: `/api/pdf/${pdfRecord.id}`, 
        data: {
          id: pdfRecord.id,
          vehicle: vehicleData,
          driver: logData.drivers,
          timestamp: timestamp || new Date().toISOString(),
          imageCount: images.length
        }
      };
    } catch (err) {
      console.error('Error generating inspection PDF:', err);
      return { 
        success: false, 
        error: err.message 
      };
    }
  },

  // Get PDF by ID
  getPdfById: async (pdfId) => {
    try {
      // Get the PDF record
      const { data: pdfRecord, error: pdfError } = await supabase
        .from('inspection_pdfs')
        .select(`
          id,
          time_log_id,
          vehicle_id,
          driver_id,
          image_count,
          created_at,
          pdf_status,
          pdf_url,
          vehicle_info,
          driver_info,
          inspection_type,
          inspection_time,
          vehicles(vehicle_number, make, model),
          time_logs(punch_in, punch_out),
          users(name, email)
        `)
        .eq('id', pdfId)
        .single();
      
      if (pdfError) throw pdfError;
      
      if (!pdfRecord) {
        throw new Error('PDF record not found');
      }
      
      // Get the associated images
      const { data: images, error: imagesError } = await supabase
        .from('inspection_images')
        .select('*')
        .eq('inspection_pdf_id', pdfId)
        .order('image_index', { ascending: true });
      
      if (imagesError) throw imagesError;
      
      // In a real implementation, you'd generate and stream a PDF file
      // For the prototype, we'll return the data needed to display a PDF-like view
      return {
        success: true,
        data: {
          ...pdfRecord,
          images: images || []
        }
      };
    } catch (err) {
      console.error('Error getting PDF:', err);
      return {
        success: false,
        error: err.message
      };
    }
  },

  // View PDF (for frontend display)
  viewPdf: async (pdfUrl) => {
    try {
      // Extract PDF ID from URL
      const pdfId = pdfUrl.split('/').pop();
      return await pdfService.getPdfById(pdfId);
    } catch (err) {
      console.error('Error viewing PDF:', err);
      return {
        success: false,
        error: err.message
      };
    }
  }
};