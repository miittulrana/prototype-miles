import { supabase } from './supabase';

/**
 * API Key service functions for managing API keys
 */
const apiKeyService = {
  /**
   * Generate a new API key
   * @param {string} userId - User ID
   * @param {string} description - Key description
   * @returns {Promise} Promise object with API key or error
   */
  generateApiKey: async (userId, description) => {
    try {
      // Validate inputs
      if (!userId) {
        return { 
          success: false, 
          error: 'User ID is required' 
        };
      }
      
      if (!description) {
        return { 
          success: false, 
          error: 'API key description is required' 
        };
      }
      
      // Generate a random API key
      // In a real app, use a more secure method
      const apiKey = crypto.randomUUID().replace(/-/g, '');
      
      // Insert API key into database
      const { data, error } = await supabase
        .from('api_keys')
        .insert([{
          user_id: userId,
          api_key: apiKey,
          description,
          created_at: new Date().toISOString(),
        }])
        .select()
        .single();
      
      if (error) throw error;
      
      return { 
        success: true, 
        apiKey,
        data
      };
    } catch (error) {
      console.error('Error generating API key:', error);
      return { 
        success: false, 
        error: error.message || 'Failed to generate API key' 
      };
    }
  },
  
  /**
   * Get all API keys for a user
   * @param {string} userId - User ID
   * @returns {Promise} Promise object with API keys or error
   */
  getApiKeysForUser: async (userId) => {
    try {
      const { data, error } = await supabase
        .from('api_keys')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      
      return { 
        success: true, 
        data: data || [] 
      };
    } catch (error) {
      console.error('Error fetching API keys:', error);
      return { 
        success: false, 
        error: error.message || 'Failed to fetch API keys' 
      };
    }
  },
  
  /**
   * Get API key details
   * @param {string} keyId - API key ID
   * @returns {Promise} Promise object with API key details or error
   */
  getApiKeyDetails: async (keyId) => {
    try {
      const { data, error } = await supabase
        .from('api_keys')
        .select('*')
        .eq('id', keyId)
        .single();
      
      if (error) throw error;
      
      return { 
        success: true, 
        data 
      };
    } catch (error) {
      console.error(`Error fetching API key with ID ${keyId}:`, error);
      return { 
        success: false, 
        error: error.message || 'Failed to fetch API key details' 
      };
    }
  },
  
  /**
   * Delete an API key
   * @param {string} keyId - API key ID
   * @returns {Promise} Promise object indicating success or error
   */
  deleteApiKey: async (keyId) => {
    try {
      const { error } = await supabase
        .from('api_keys')
        .delete()
        .eq('id', keyId);
      
      if (error) throw error;
      
      return { success: true };
    } catch (error) {
      console.error(`Error deleting API key with ID ${keyId}:`, error);
      return { 
        success: false, 
        error: error.message || 'Failed to delete API key' 
      };
    }
  },
  
  /**
   * Validate an API key
   * @param {string} apiKey - API key to validate
   * @returns {Promise} Promise object with validation result
   */
  validateApiKey: async (apiKey) => {
    try {
      // Check if API key exists
      const { data, error } = await supabase
        .from('api_keys')
        .select('id, user_id, description, created_at')
        .eq('api_key', apiKey)
        .single();
      
      if (error) {
        if (error.code === 'PGRST116') {
          // No results found - invalid API key
          return { 
            success: false, 
            valid: false,
            error: 'Invalid API key' 
          };
        }
        throw error;
      }
      
      // Update last used timestamp
      await supabase
        .from('api_keys')
        .update({ last_used_at: new Date().toISOString() })
        .eq('id', data.id);
      
      return { 
        success: true, 
        valid: true,
        data
      };
    } catch (error) {
      console.error('Error validating API key:', error);
      return { 
        success: false, 
        valid: false,
        error: error.message || 'Failed to validate API key' 
      };
    }
  },
  
  /**
   * Get API key usage for a user
   * @param {string} userId - User ID
   * @returns {Promise} Promise object with API key usage data
   */
  getApiKeyUsage: async (userId) => {
    try {
      // Get all API keys for user
      const { data: keys, error } = await supabase
        .from('api_keys')
        .select('id, api_key, description, created_at, last_used_at')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      
      // In a real app, you would fetch actual usage metrics from a dedicated table
      // For the prototype, we'll return simulated usage data
      const keysWithUsage = keys?.map(key => ({
        ...key,
        usageStats: {
          totalCalls: Math.floor(Math.random() * 1000),
          lastMonth: Math.floor(Math.random() * 300),
          lastWeek: Math.floor(Math.random() * 100),
          lastDayCalls: Math.floor(Math.random() * 50),
          averageResponseTime: Math.floor(Math.random() * 200 + 100),
        }
      })) || [];
      
      return { 
        success: true, 
        data: keysWithUsage
      };
    } catch (error) {
      console.error('Error fetching API key usage:', error);
      return { 
        success: false, 
        error: error.message || 'Failed to fetch API key usage' 
      };
    }
  },
  
  /**
   * Get available API endpoints for documentation
   * @returns {Object} API endpoint documentation
   */
  getApiEndpoints: () => {
    // This would typically come from a database or config file
    // For the prototype, we'll return a static list
    const endpoints = [
      {
        path: '/api/vehicles',
        methods: ['GET', 'POST'],
        description: 'Get all vehicles or create a new vehicle',
        authentication: 'Required',
        parameters: [
          { name: 'status', type: 'string', description: 'Filter by status (available, in-use, maintenance)' },
          { name: 'search', type: 'string', description: 'Search by vehicle number, make, or model' }
        ],
        responses: {
          '200': { description: 'Success' },
          '401': { description: 'Unauthorized - Invalid API key' },
          '500': { description: 'Server error' }
        }
      },
      {
        path: '/api/vehicles/:id',
        methods: ['GET', 'PUT', 'DELETE'],
        description: 'Get, update, or delete a specific vehicle',
        authentication: 'Required',
        parameters: [
          { name: 'id', type: 'string', description: 'Vehicle ID', required: true }
        ],
        responses: {
          '200': { description: 'Success' },
          '404': { description: 'Vehicle not found' },
          '401': { description: 'Unauthorized - Invalid API key' },
          '500': { description: 'Server error' }
        }
      },
      {
        path: '/api/drivers',
        methods: ['GET'],
        description: 'Get all drivers',
        authentication: 'Required',
        parameters: [
          { name: 'search', type: 'string', description: 'Search by name, email, or phone' }
        ],
        responses: {
          '200': { description: 'Success' },
          '401': { description: 'Unauthorized - Invalid API key' },
          '500': { description: 'Server error' }
        }
      },
      {
        path: '/api/logs',
        methods: ['GET'],
        description: 'Get time logs',
        authentication: 'Required',
        parameters: [
          { name: 'driver_id', type: 'string', description: 'Filter by driver ID' },
          { name: 'vehicle_id', type: 'string', description: 'Filter by vehicle ID' },
          { name: 'start_date', type: 'string', description: 'Filter by start date (ISO format)' },
          { name: 'end_date', type: 'string', description: 'Filter by end date (ISO format)' }
        ],
        responses: {
          '200': { description: 'Success' },
          '401': { description: 'Unauthorized - Invalid API key' },
          '500': { description: 'Server error' }
        }
      },
      {
        path: '/api/maintenance',
        methods: ['GET'],
        description: 'Get maintenance requests',
        authentication: 'Required',
        parameters: [
          { name: 'status', type: 'string', description: 'Filter by status (sorted, in-progress, resolved)' },
          { name: 'vehicle_id', type: 'string', description: 'Filter by vehicle ID' },
          { name: 'driver_id', type: 'string', description: 'Filter by driver ID' }
        ],
        responses: {
          '200': { description: 'Success' },
          '401': { description: 'Unauthorized - Invalid API key' },
          '500': { description: 'Server error' }
        }
      }
    ];
    
    return {
      success: true,
      data: endpoints
    };
  }
};

export default apiKeyService;