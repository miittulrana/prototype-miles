import { createClient } from '@supabase/supabase-js';

// Replace with your Supabase URL and anon key
const supabaseUrl = 'https://xanlzovkqqlibjuuztig.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inhhbmx6b3ZrcXFsaWJqdXV6dGlnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDA5MjExODQsImV4cCI6MjA1NjQ5NzE4NH0.tDhFQqB8Ai-VAB7Hs-utNsU-fNkTkTESlOrN521S4PM';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

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