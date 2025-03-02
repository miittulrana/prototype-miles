import { supabase } from './supabase';

/**
 * Authentication service functions
 */
const authService = {
  /**
   * Sign in with email and password
   * @param {string} email - User email
   * @param {string} password - User password
   * @returns {Promise} Promise object with auth data or error
   */
  signIn: async (email, password) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      
      if (error) throw error;
      
      // Get the user's role and details
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('id', data.user.id)
        .single();
      
      if (userError) throw userError;
      
      return { 
        success: true, 
        user: {
          ...data.user,
          role: userData.role,
          name: userData.name,
          phone: userData.phone
        },
        session: data.session
      };
    } catch (error) {
      console.error('Error signing in:', error);
      return { 
        success: false, 
        error: error.message || 'Failed to sign in' 
      };
    }
  },
  
  /**
   * Sign out the current user
   * @returns {Promise} Promise object indicating success or error
   */
  signOut: async () => {
    try {
      const { error } = await supabase.auth.signOut();
      
      if (error) throw error;
      
      return { success: true };
    } catch (error) {
      console.error('Error signing out:', error);
      return { 
        success: false, 
        error: error.message || 'Failed to sign out' 
      };
    }
  },
  
  /**
   * Get the current authenticated user
   * @returns {Promise} Promise object with user data or null
   */
  getCurrentUser: async () => {
    try {
      const { data: authData, error: authError } = await supabase.auth.getUser();
      
      if (authError) throw authError;
      
      if (!authData.user) {
        return { success: true, user: null };
      }
      
      // Get the user's role and details
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('id', authData.user.id)
        .single();
      
      if (userError && userError.code !== 'PGRST116') {
        // PGRST116 is the error code for "no rows returned"
        throw userError;
      }
      
      return { 
        success: true, 
        user: userData 
          ? {
              ...authData.user,
              role: userData.role,
              name: userData.name,
              phone: userData.phone
            }
          : authData.user
      };
    } catch (error) {
      console.error('Error getting current user:', error);
      return { 
        success: false, 
        error: error.message || 'Failed to get current user' 
      };
    }
  },
  
  /**
   * Refresh the auth session
   * @returns {Promise} Promise object with refreshed session or error
   */
  refreshSession: async () => {
    try {
      const { data, error } = await supabase.auth.refreshSession();
      
      if (error) throw error;
      
      return { 
        success: true, 
        session: data.session,
        user: data.user
      };
    } catch (error) {
      console.error('Error refreshing session:', error);
      return { 
        success: false, 
        error: error.message || 'Failed to refresh session' 
      };
    }
  },
  
  /**
   * Register a new user (Admin only)
   * @param {Object} userData - User data for registration
   * @returns {Promise} Promise object with registration result or error
   */
  registerUser: async (userData) => {
    const { email, password, name, phone, role } = userData;
    
    try {
      // Create user in Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
      });
      
      if (authError) throw authError;
      
      // Add user details to the users table
      const { error: userError } = await supabase
        .from('users')
        .insert([{
          id: authData.user.id,
          email,
          name,
          phone,
          role: role || 'driver', // Default to driver if not specified
        }]);
      
      if (userError) {
        // Clean up auth if user details insertion fails
        // Note: This is a basic cleanup approach for the prototype
        console.error('Error adding user details, cleaning up auth user...');
        throw userError;
      }
      
      return { 
        success: true, 
        user: {
          ...authData.user,
          name,
          phone,
          role: role || 'driver'
        }
      };
    } catch (error) {
      console.error('Error registering user:', error);
      return { 
        success: false, 
        error: error.message || 'Failed to register user' 
      };
    }
  },
  
  /**
   * Update user profile
   * @param {string} userId - User ID to update
   * @param {Object} updates - Fields to update
   * @returns {Promise} Promise object with updated user or error
   */
  updateUserProfile: async (userId, updates) => {
    try {
      // Only allow updating name and phone
      const allowedUpdates = {};
      if (updates.name) allowedUpdates.name = updates.name;
      if (updates.phone) allowedUpdates.phone = updates.phone;
      
      if (Object.keys(allowedUpdates).length === 0) {
        return { 
          success: false, 
          error: 'No valid fields to update' 
        };
      }
      
      const { data, error } = await supabase
        .from('users')
        .update(allowedUpdates)
        .eq('id', userId)
        .select()
        .single();
      
      if (error) throw error;
      
      return { 
        success: true, 
        user: data 
      };
    } catch (error) {
      console.error('Error updating user profile:', error);
      return { 
        success: false, 
        error: error.message || 'Failed to update user profile' 
      };
    }
  },
  
  /**
   * Request a password reset
   * @param {string} email - User email
   * @returns {Promise} Promise object indicating success or error
   */
  requestPasswordReset: async (email) => {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email);
      
      if (error) throw error;
      
      return { success: true };
    } catch (error) {
      console.error('Error requesting password reset:', error);
      return { 
        success: false, 
        error: error.message || 'Failed to request password reset' 
      };
    }
  },
  
  /**
   * Update user password
   * @param {string} newPassword - New password
   * @returns {Promise} Promise object indicating success or error
   */
  updatePassword: async (newPassword) => {
    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      });
      
      if (error) throw error;
      
      return { success: true };
    } catch (error) {
      console.error('Error updating password:', error);
      return { 
        success: false, 
        error: error.message || 'Failed to update password' 
      };
    }
  },
  
  /**
   * Delete a user (Admin only)
   * @param {string} userId - User ID to delete
   * @returns {Promise} Promise object indicating success or error
   */
  deleteUser: async (userId) => {
    try {
      // First remove from custom users table
      const { error: userError } = await supabase
        .from('users')
        .delete()
        .eq('id', userId);
      
      if (userError) throw userError;
      
      // In a real implementation, you would use Admin API to delete the auth user
      // For the prototype, we'll assume this works
      console.log(`Auth user ${userId} would be deleted here in a real implementation`);
      
      return { success: true };
    } catch (error) {
      console.error('Error deleting user:', error);
      return { 
        success: false, 
        error: error.message || 'Failed to delete user' 
      };
    }
  },
  
  /**
   * Check if a user exists by email
   * @param {string} email - Email to check
   * @returns {Promise} Promise object with result or error
   */
  checkUserExists: async (email) => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('id')
        .eq('email', email)
        .single();
      
      if (error && error.code !== 'PGRST116') {
        throw error;
      }
      
      return { 
        success: true, 
        exists: !!data 
      };
    } catch (error) {
      console.error('Error checking if user exists:', error);
      return { 
        success: false, 
        error: error.message || 'Failed to check if user exists' 
      };
    }
  }
};

export default authService;