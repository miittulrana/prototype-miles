import { supabase } from './supabase';

/**
 * Vehicle service functions for managing vehicle data
 */
const vehicleService = {
  /**
   * Get all vehicles
   * @param {Object} options - Query options
   * @returns {Promise} Promise object with vehicles data or error
   */
  getAllVehicles: async (options = {}) => {
    try {
      const { 
        page = 1, 
        limit = 0, 
        search = '',
        status = null,
        sortBy = 'vehicle_number',
        sortDirection = 'asc'
      } = options;
      
      let query = supabase
        .from('vehicles')
        .select(`
          id,
          vehicle_number,
          make,
          model,
          status,
          assigned_driver_id,
          created_at,
          drivers:users(id, name, email, phone)
        `, { count: options.includeCount ? 'exact' : null });
      
      // Add search filter if provided
      if (search) {
        query = query.or(`vehicle_number.ilike.%${search}%,make.ilike.%${search}%,model.ilike.%${search}%`);
      }
      
      // Add status filter if provided
      if (status) {
        query = query.eq('status', status);
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
      console.error('Error fetching vehicles:', error);
      return { 
        success: false, 
        error: error.message || 'Failed to fetch vehicles' 
      };
    }
  },
  
  /**
   * Get available vehicles
   * @param {Object} options - Query options
   * @returns {Promise} Promise object with available vehicles data or error
   */
  getAvailableVehicles: async (options = {}) => {
    try {
      const { 
        page = 1, 
        limit = 0, 
        search = '',
        sortBy = 'vehicle_number',
        sortDirection = 'asc'
      } = options;
      
      let query = supabase
        .from('vehicles')
        .select(`
          id,
          vehicle_number,
          make,
          model,
          status,
          created_at
        `, { count: options.includeCount ? 'exact' : null })
        .eq('status', 'available');
      
      // Add search filter if provided
      if (search) {
        query = query.or(`vehicle_number.ilike.%${search}%,make.ilike.%${search}%,model.ilike.%${search}%`);
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
      console.error('Error fetching available vehicles:', error);
      return { 
        success: false, 
        error: error.message || 'Failed to fetch available vehicles' 
      };
    }
  },
  
  /**
   * Get a vehicle by ID
   * @param {string} id - Vehicle ID
   * @returns {Promise} Promise object with vehicle data or error
   */
  getVehicleById: async (id) => {
    try {
      const { data, error } = await supabase
        .from('vehicles')
        .select(`
          id,
          vehicle_number,
          make,
          model,
          status,
          assigned_driver_id,
          created_at,
          drivers:users(id, name, email, phone)
        `)
        .eq('id', id)
        .single();
      
      if (error) throw error;
      
      return { 
        success: true, 
        data 
      };
    } catch (error) {
      console.error(`Error fetching vehicle with ID ${id}:`, error);
      return { 
        success: false, 
        error: error.message || 'Failed to fetch vehicle' 
      };
    }
  },
  
  /**
   * Add a new vehicle
   * @param {Object} vehicleData - Vehicle data to add
   * @returns {Promise} Promise object with added vehicle data or error
   */
  addVehicle: async (vehicleData) => {
    try {
      const { data, error } = await supabase
        .from('vehicles')
        .insert([vehicleData])
        .select()
        .single();
      
      if (error) throw error;
      
      return { 
        success: true, 
        data 
      };
    } catch (error) {
      console.error('Error adding vehicle:', error);
      return { 
        success: false, 
        error: error.message || 'Failed to add vehicle' 
      };
    }
  },
  
  /**
   * Update a vehicle
   * @param {string} id - Vehicle ID to update
   * @param {Object} updates - Fields to update
   * @returns {Promise} Promise object with updated vehicle data or error
   */
  updateVehicle: async (id, updates) => {
    try {
      const { data, error } = await supabase
        .from('vehicles')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      
      return { 
        success: true, 
        data 
      };
    } catch (error) {
      console.error(`Error updating vehicle with ID ${id}:`, error);
      return { 
        success: false, 
        error: error.message || 'Failed to update vehicle' 
      };
    }
  },
  
  /**
   * Delete a vehicle
   * @param {string} id - Vehicle ID to delete
   * @returns {Promise} Promise object indicating success or error
   */
  deleteVehicle: async (id) => {
    try {
      // Check if vehicle has any active time logs
      const { data: activeLogs, error: logsError } = await supabase
        .from('time_logs')
        .select('id')
        .eq('vehicle_id', id)
        .is('punch_out', null)
        .limit(1);
      
      if (logsError) throw logsError;
      
      if (activeLogs && activeLogs.length > 0) {
        return { 
          success: false, 
          error: 'Cannot delete a vehicle that is currently in use' 
        };
      }
      
      // Delete the vehicle
      const { error } = await supabase
        .from('vehicles')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      
      return { success: true };
    } catch (error) {
      console.error(`Error deleting vehicle with ID ${id}:`, error);
      return { 
        success: false, 
        error: error.message || 'Failed to delete vehicle' 
      };
    }
  },
  
  /**
   * Update vehicle status
   * @param {string} id - Vehicle ID to update
   * @param {string} status - New status ('available', 'in-use', 'maintenance')
   * @param {string} driverId - Driver ID (required for 'in-use' status)
   * @returns {Promise} Promise object with updated vehicle data or error
   */
  updateVehicleStatus: async (id, status, driverId = null) => {
    try {
      // Validate status
      if (!['available', 'in-use', 'maintenance'].includes(status)) {
        return { 
          success: false, 
          error: 'Invalid status. Must be "available", "in-use", or "maintenance".' 
        };
      }
      
      // Validate driver ID for 'in-use' status
      if (status === 'in-use' && !driverId) {
        return { 
          success: false, 
          error: 'Driver ID is required when setting status to "in-use"' 
        };
      }
      
      // Prepare update data
      const updates = {
        status,
        assigned_driver_id: status === 'in-use' ? driverId : null
      };
      
      // Update vehicle
      const { data, error } = await supabase
        .from('vehicles')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      
      return { 
        success: true, 
        data 
      };
    } catch (error) {
      console.error(`Error updating status for vehicle with ID ${id}:`, error);
      return { 
        success: false, 
        error: error.message || 'Failed to update vehicle status' 
      };
    }
  },
  
  /**
   * Assign vehicle to driver
   * @param {string} vehicleId - Vehicle ID
   * @param {string} driverId - Driver ID to assign
   * @returns {Promise} Promise object with updated vehicle data or error
   */
  assignVehicleToDriver: async (vehicleId, driverId) => {
    try {
      // Check vehicle availability
      const { data: vehicle, error: vehicleError } = await supabase
        .from('vehicles')
        .select('status')
        .eq('id', vehicleId)
        .single();
      
      if (vehicleError) throw vehicleError;
      
      if (vehicle.status !== 'available') {
        return { 
          success: false, 
          error: 'Vehicle is not available for assignment' 
        };
      }
      
      // Update vehicle with assignment
      const { data, error } = await supabase
        .from('vehicles')
        .update({
          status: 'in-use',
          assigned_driver_id: driverId
        })
        .eq('id', vehicleId)
        .select()
        .single();
      
      if (error) throw error;
      
      return { 
        success: true, 
        data 
      };
    } catch (error) {
      console.error(`Error assigning vehicle ${vehicleId} to driver ${driverId}:`, error);
      return { 
        success: false, 
        error: error.message || 'Failed to assign vehicle to driver' 
      };
    }
  },
  
  /**
   * Unassign vehicle from driver
   * @param {string} vehicleId - Vehicle ID
   * @returns {Promise} Promise object with updated vehicle data or error
   */
  unassignVehicle: async (vehicleId) => {
    try {
      // Check if vehicle has any active time logs
      const { data: activeLogs, error: logsError } = await supabase
        .from('time_logs')
        .select('id')
        .eq('vehicle_id', vehicleId)
        .is('punch_out', null)
        .limit(1);
      
      if (logsError) throw logsError;
      
      if (activeLogs && activeLogs.length > 0) {
        return { 
          success: false, 
          error: 'Cannot unassign a vehicle that is currently in use' 
        };
      }
      
      // Update vehicle to available
      const { data, error } = await supabase
        .from('vehicles')
        .update({
          status: 'available',
          assigned_driver_id: null
        })
        .eq('id', vehicleId)
        .select()
        .single();
      
      if (error) throw error;
      
      return { 
        success: true, 
        data 
      };
    } catch (error) {
      console.error(`Error unassigning vehicle ${vehicleId}:`, error);
      return { 
        success: false, 
        error: error.message || 'Failed to unassign vehicle' 
      };
    }
  },
  
  /**
   * Get vehicle time logs
   * @param {string} vehicleId - Vehicle ID
   * @param {Object} options - Query options
   * @returns {Promise} Promise object with time logs data or error
   */
  getVehicleTimeLogs: async (vehicleId, options = {}) => {
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
          drivers:users(id, name, email)
        `, { count: options.includeCount ? 'exact' : null })
        .eq('vehicle_id', vehicleId)
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
      console.error(`Error fetching time logs for vehicle with ID ${vehicleId}:`, error);
      return { 
        success: false, 
        error: error.message || 'Failed to fetch time logs' 
      };
    }
  },
  
  /**
   * Get vehicle maintenance requests
   * @param {string} vehicleId - Vehicle ID
   * @param {Object} options - Query options
   * @returns {Promise} Promise object with maintenance requests data or error
   */
  getVehicleMaintenanceRequests: async (vehicleId, options = {}) => {
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
          drivers:users(id, name, email)
        `, { count: options.includeCount ? 'exact' : null })
        .eq('vehicle_id', vehicleId)
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
      console.error(`Error fetching maintenance requests for vehicle with ID ${vehicleId}:`, error);
      return { 
        success: false, 
        error: error.message || 'Failed to fetch maintenance requests' 
      };
    }
  },
  
  /**
   * Get vehicle usage statistics
   * @param {string} vehicleId - Vehicle ID
   * @returns {Promise} Promise object with vehicle statistics or error
   */
  getVehicleStats: async (vehicleId) => {
    try {
      // Get all time logs
      const { data: timeLogs, error: timeLogsError } = await supabase
        .from('time_logs')
        .select('id, driver_id, punch_in, punch_out, drivers:users(name)')
        .eq('vehicle_id', vehicleId);
      
      if (timeLogsError) throw timeLogsError;
      
      // Get maintenance requests
      const { data: maintenanceRequests, error: maintenanceError } = await supabase
        .from('maintenance_requests')
        .select('id, status, severity')
        .eq('vehicle_id', vehicleId);
      
      if (maintenanceError) throw maintenanceError;
      
      // Calculate total time (in seconds)
      let totalUsageTimeSeconds = 0;
      let completedTrips = 0;
      let activeTrip = false;
      let activeDriver = null;
      
      timeLogs?.forEach(log => {
        if (log.punch_out) {
          const punchIn = new Date(log.punch_in);
          const punchOut = new Date(log.punch_out);
          totalUsageTimeSeconds += (punchOut - punchIn) / 1000;
          completedTrips++;
        } else {
          activeTrip = true;
          activeDriver = log.drivers?.name || log.driver_id;
        }
      });
      
      // Calculate hours and format
      const totalUsageHours = (totalUsageTimeSeconds / 3600).toFixed(1);
      
      // Count unique drivers
      const uniqueDrivers = new Set();
      timeLogs?.forEach(log => {
        uniqueDrivers.add(log.driver_id);
      });
      
      // Count maintenance requests by status and severity
      const maintenanceStats = {
        total: maintenanceRequests?.length || 0,
        sorted: maintenanceRequests?.filter(r => r.status === 'sorted').length || 0,
        inProgress: maintenanceRequests?.filter(r => r.status === 'in-progress').length || 0,
        resolved: maintenanceRequests?.filter(r => r.status === 'resolved').length || 0,
        highSeverity: maintenanceRequests?.filter(r => r.severity === 'high').length || 0,
      };
      
      return {
        success: true,
        data: {
          totalTrips: (timeLogs?.length || 0),
          completedTrips,
          activeTrip,
          activeDriver,
          totalUsageHours,
          totalUsageTimeSeconds,
          uniqueDrivers: uniqueDrivers.size,
          maintenanceStats
        }
      };
    } catch (error) {
      console.error(`Error fetching stats for vehicle with ID ${vehicleId}:`, error);
      return { 
        success: false, 
        error: error.message || 'Failed to fetch vehicle statistics' 
      };
    }
  }
};

export default vehicleService;