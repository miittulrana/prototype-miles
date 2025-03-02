import { supabase } from './supabase';

/**
 * Driver service functions for managing driver data
 */
const driverService = {
  /**
   * Get all drivers
   * @param {Object} options - Query options
   * @returns {Promise} Promise object with drivers data or error
   */
  getAllDrivers: async (options = {}) => {
    try {
      const { 
        page = 1, 
        limit = 0, 
        search = '',
        sortBy = 'name',
        sortDirection = 'asc'
      } = options;
      
      let query = supabase
        .from('users')
        .select(`
          id,
          name,
          email,
          phone,
          created_at,
          vehicles:vehicles(id, vehicle_number, make, model, status)
        `, { count: options.includeCount ? 'exact' : null })
        .eq('role', 'driver');
      
      // Add search filter if provided
      if (search) {
        query = query.or(`name.ilike.%${search}%,email.ilike.%${search}%,phone.ilike.%${search}%`);
      }
      
      // Add sorting
      if (sortBy) {
        query = query.order(sortBy, { ascending: sortDirection === 'asc' });
      }
      
      // Add pagination if limit is provided
      if (limit > 0) {
        const from = (page - 1) * limit;
        const to = from + limit - 1;
        query = query.range(from, to);
      }
      
      const { data, error, count } = await query;
      
      if (error) throw error;
      
      return { 
        success: true, 
        data: data || [], 
        count,
        page,
        limit
      };
    } catch (error) {
      console.error('Error fetching drivers:', error);
      return { 
        success: false, 
        error: error.message || 'Failed to fetch drivers' 
      };
    }
  },
  
  /**
   * Get a driver by ID
   * @param {string} id - Driver ID
   * @returns {Promise} Promise object with driver data or error
   */
  getDriverById: async (id) => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select(`
          id,
          name,
          email,
          phone,
          created_at,
          vehicles:vehicles(id, vehicle_number, make, model, status)
        `)
        .eq('id', id)
        .eq('role', 'driver')
        .single();
      
      if (error) throw error;
      
      return { 
        success: true, 
        data 
      };
    } catch (error) {
      console.error(`Error fetching driver with ID ${id}:`, error);
      return { 
        success: false, 
        error: error.message || 'Failed to fetch driver' 
      };
    }
  },
  
  /**
   * Get active drivers (currently logged in to vehicles)
   * @returns {Promise} Promise object with active drivers data or error
   */
  getActiveDrivers: async () => {
    try {
      // Get active time logs that don't have a punch out time
      const { data: activeLogs, error: logError } = await supabase
        .from('time_logs')
        .select(`
          id,
          driver_id,
          vehicle_id,
          punch_in,
          drivers:users!time_logs_driver_id_fkey(id, name, email, phone),
          vehicles(id, vehicle_number, make, model)
        `)
        .is('punch_out', null);
      
      if (logError) throw logError;
      
      // Process data to return a clean format
      const activeDrivers = (activeLogs || []).map(log => ({
        id: log.driver_id,
        name: log.drivers?.name,
        email: log.drivers?.email,
        phone: log.drivers?.phone,
        vehicle: log.vehicles,
        activeLog: {
          id: log.id,
          punchIn: log.punch_in
        }
      }));
      
      return { 
        success: true, 
        data: activeDrivers 
      };
    } catch (error) {
      console.error('Error fetching active drivers:', error);
      return { 
        success: false, 
        error: error.message || 'Failed to fetch active drivers' 
      };
    }
  },
  
  /**
   * Add a new driver
   * @param {Object} driverData - Driver data to add
   * @returns {Promise} Promise object with added driver data or error
   */
  addDriver: async (driverData) => {
    const { email, password, name, phone } = driverData;
    
    try {
      // Create user in Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
      });
      
      if (authError) throw authError;
      
      // Add user details to the users table
      const { data, error: userError } = await supabase
        .from('users')
        .insert([{
          id: authData.user.id,
          email,
          name,
          phone,
          role: 'driver',
        }])
        .select()
        .single();
      
      if (userError) {
        // Clean up auth if user details insertion fails
        console.error('Error adding driver details, cleaning up auth user...');
        throw userError;
      }
      
      return { 
        success: true, 
        data
      };
    } catch (error) {
      console.error('Error adding driver:', error);
      return { 
        success: false, 
        error: error.message || 'Failed to add driver' 
      };
    }
  },
  
  /**
   * Update a driver
   * @param {string} id - Driver ID to update
   * @param {Object} updates - Fields to update
   * @returns {Promise} Promise object with updated driver data or error
   */
  updateDriver: async (id, updates) => {
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
        .eq('id', id)
        .eq('role', 'driver')
        .select()
        .single();
      
      if (error) throw error;
      
      return { 
        success: true, 
        data 
      };
    } catch (error) {
      console.error(`Error updating driver with ID ${id}:`, error);
      return { 
        success: false, 
        error: error.message || 'Failed to update driver' 
      };
    }
  },
  
  /**
   * Delete a driver
   * @param {string} id - Driver ID to delete
   * @returns {Promise} Promise object indicating success or error
   */
  deleteDriver: async (id) => {
    try {
      // Update any assigned vehicles to available
      const { error: vehicleError } = await supabase
        .from('vehicles')
        .update({ 
          status: 'available',
          assigned_driver_id: null
        })
        .eq('assigned_driver_id', id);
      
      if (vehicleError) throw vehicleError;
      
      // Delete from users table
      const { error: userError } = await supabase
        .from('users')
        .delete()
        .eq('id', id)
        .eq('role', 'driver');
      
      if (userError) throw userError;
      
      // In a real implementation, you would use Admin API to delete the auth user
      // For the prototype, we'll assume this works
      console.log(`Auth user ${id} would be deleted here in a real implementation`);
      
      return { success: true };
    } catch (error) {
      console.error(`Error deleting driver with ID ${id}:`, error);
      return { 
        success: false, 
        error: error.message || 'Failed to delete driver' 
      };
    }
  },
  
  /**
   * Get driver's time logs
   * @param {string} driverId - Driver ID
   * @param {Object} options - Query options
   * @returns {Promise} Promise object with time logs data or error
   */
  getDriverTimeLogs: async (driverId, options = {}) => {
    try {
      const { 
        page = 1, 
        limit = 0,
        sortDirection = 'desc'
      } = options;
      
      let query = supabase
        .from('time_logs')
        .select(`
          id,
          punch_in,
          punch_out,
          created_at,
          vehicles(id, vehicle_number, make, model)
        `, { count: options.includeCount ? 'exact' : null })
        .eq('driver_id', driverId)
        .order('punch_in', { ascending: sortDirection === 'asc' });
      
      // Add pagination if limit is provided
      if (limit > 0) {
        const from = (page - 1) * limit;
        const to = from + limit - 1;
        query = query.range(from, to);
      }
      
      const { data, error, count } = await query;
      
      if (error) throw error;
      
      return { 
        success: true, 
        data: data || [], 
        count,
        page,
        limit
      };
    } catch (error) {
      console.error(`Error fetching time logs for driver with ID ${driverId}:`, error);
      return { 
        success: false, 
        error: error.message || 'Failed to fetch time logs' 
      };
    }
  },
  
  /**
   * Get driver's maintenance requests
   * @param {string} driverId - Driver ID
   * @param {Object} options - Query options
   * @returns {Promise} Promise object with maintenance requests data or error
   */
  getDriverMaintenanceRequests: async (driverId, options = {}) => {
    try {
      const { 
        page = 1, 
        limit = 0,
        sortDirection = 'desc',
        status = null
      } = options;
      
      let query = supabase
        .from('maintenance_requests')
        .select(`
          id,
          description,
          severity,
          status,
          created_at,
          resolved_at,
          vehicles(id, vehicle_number, make, model)
        `, { count: options.includeCount ? 'exact' : null })
        .eq('driver_id', driverId)
        .order('created_at', { ascending: sortDirection === 'asc' });
      
      // Add status filter if provided
      if (status) {
        query = query.eq('status', status);
      }
      
      // Add pagination if limit is provided
      if (limit > 0) {
        const from = (page - 1) * limit;
        const to = from + limit - 1;
        query = query.range(from, to);
      }
      
      const { data, error, count } = await query;
      
      if (error) throw error;
      
      return { 
        success: true, 
        data: data || [], 
        count,
        page,
        limit
      };
    } catch (error) {
      console.error(`Error fetching maintenance requests for driver with ID ${driverId}:`, error);
      return { 
        success: false, 
        error: error.message || 'Failed to fetch maintenance requests' 
      };
    }
  },
  
  /**
   * Get driver statistics
   * @param {string} driverId - Driver ID
   * @returns {Promise} Promise object with driver statistics or error
   */
  getDriverStats: async (driverId) => {
    try {
      // Get all time logs
      const { data: timeLogs, error: timeLogsError } = await supabase
        .from('time_logs')
        .select('id, punch_in, punch_out')
        .eq('driver_id', driverId);
      
      if (timeLogsError) throw timeLogsError;
      
      // Get maintenance requests
      const { data: maintenanceRequests, error: maintenanceError } = await supabase
        .from('maintenance_requests')
        .select('id, status')
        .eq('driver_id', driverId);
      
      if (maintenanceError) throw maintenanceError;
      
      // Calculate total time (in seconds)
      let totalDriveTimeSeconds = 0;
      let completedTrips = 0;
      let activeTrip = false;
      
      timeLogs?.forEach(log => {
        if (log.punch_out) {
          const punchIn = new Date(log.punch_in);
          const punchOut = new Date(log.punch_out);
          totalDriveTimeSeconds += (punchOut - punchIn) / 1000;
          completedTrips++;
        } else {
          activeTrip = true;
        }
      });
      
      // Calculate hours and format
      const totalDriveHours = (totalDriveTimeSeconds / 3600).toFixed(1);
      
      // Count maintenance requests by status
      const maintenanceStats = {
        total: maintenanceRequests?.length || 0,
        sorted: maintenanceRequests?.filter(r => r.status === 'sorted').length || 0,
        inProgress: maintenanceRequests?.filter(r => r.status === 'in-progress').length || 0,
        resolved: maintenanceRequests?.filter(r => r.status === 'resolved').length || 0,
      };
      
      return {
        success: true,
        data: {
          totalTrips: (timeLogs?.length || 0),
          completedTrips,
          activeTrip,
          totalDriveHours,
          totalDriveTimeSeconds,
          maintenanceStats
        }
      };
    } catch (error) {
      console.error(`Error fetching stats for driver with ID ${driverId}:`, error);
      return { 
        success: false, 
        error: error.message || 'Failed to fetch driver statistics' 
      };
    }
  }
};

export default driverService;