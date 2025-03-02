import { create } from 'zustand';
import { supabase } from '../services/supabase';

const useMaintenanceStore = create((set, get) => ({
  requests: [],
  request: null,
  isLoading: false,
  error: null,
  filters: {
    status: 'all',
    searchTerm: '',
    dateRange: null, // { start, end }
  },
  stats: {
    total: 0,
    sorted: 0,
    inProgress: 0,
    resolved: 0,
  },

  // Fetch all maintenance requests
  fetchRequests: async () => {
    set({ isLoading: true, error: null });
    
    try {
      const { data, error } = await supabase
        .from('maintenance_requests')
        .select(`
          id,
          description,
          severity,
          status,
          created_at,
          resolved_at,
          drivers:users(id, name, email),
          vehicles(id, vehicle_number, make, model)
        `)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      
      // Calculate stats
      const stats = {
        total: data?.length || 0,
        sorted: data?.filter(r => r.status === 'sorted').length || 0,
        inProgress: data?.filter(r => r.status === 'in-progress').length || 0,
        resolved: data?.filter(r => r.status === 'resolved').length || 0,
      };
      
      set({ 
        requests: data || [],
        stats,
        isLoading: false,
        error: null
      });
      
      return { success: true, data };
    } catch (err) {
      console.error('Error fetching maintenance requests:', err);
      set({ 
        isLoading: false, 
        error: err.message || 'Failed to load maintenance requests' 
      });
      return { success: false, error: err.message };
    }
  },

  // Fetch maintenance requests by status
  fetchRequestsByStatus: async (status) => {
    set({ isLoading: true, error: null });
    
    try {
      const { data, error } = await supabase
        .from('maintenance_requests')
        .select(`
          id,
          description,
          severity,
          status,
          created_at,
          resolved_at,
          drivers:users(id, name, email),
          vehicles(id, vehicle_number, make, model)
        `)
        .eq('status', status)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      
      set({ 
        requests: data || [],
        isLoading: false,
        error: null
      });
      
      return { success: true, data };
    } catch (err) {
      console.error('Error fetching maintenance requests by status:', err);
      set({ 
        isLoading: false, 
        error: err.message || 'Failed to load maintenance requests' 
      });
      return { success: false, error: err.message };
    }
  },

  // Fetch a single maintenance request by ID
  fetchRequestById: async (id) => {
    set({ isLoading: true, error: null });
    
    try {
      const { data, error } = await supabase
        .from('maintenance_requests')
        .select(`
          id,
          description,
          severity,
          status,
          created_at,
          resolved_at,
          drivers:users(id, name, email),
          vehicles(id, vehicle_number, make, model)
        `)
        .eq('id', id)
        .single();
      
      if (error) throw error;
      
      set({ 
        request: data,
        isLoading: false,
        error: null
      });
      
      return { success: true, data };
    } catch (err) {
      console.error('Error fetching maintenance request:', err);
      set({ 
        isLoading: false, 
        error: err.message || 'Failed to load maintenance request' 
      });
      return { success: false, error: err.message };
    }
  },

  // Fetch maintenance requests for a driver
  fetchDriverRequests: async (driverId) => {
    set({ isLoading: true, error: null });
    
    try {
      const { data, error } = await supabase
        .from('maintenance_requests')
        .select(`
          id,
          description,
          severity,
          status,
          created_at,
          resolved_at,
          vehicles(id, vehicle_number, make, model)
        `)
        .eq('driver_id', driverId)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      
      set({ 
        requests: data || [],
        isLoading: false,
        error: null
      });
      
      return { success: true, data };
    } catch (err) {
      console.error('Error fetching driver maintenance requests:', err);
      set({ 
        isLoading: false, 
        error: err.message || 'Failed to load maintenance requests' 
      });
      return { success: false, error: err.message };
    }
  },

  // Add new maintenance request
  addRequest: async (requestData) => {
    set({ isLoading: true, error: null });
    
    try {
      const { data, error } = await supabase
        .from('maintenance_requests')
        .insert([requestData])
        .select();
      
      if (error) throw error;
      
      // Update requests list and stats
      set(state => {
        const newStats = {
          ...state.stats,
          total: state.stats.total + 1,
          sorted: state.stats.sorted + (requestData.status === 'sorted' ? 1 : 0),
          inProgress: state.stats.inProgress + (requestData.status === 'in-progress' ? 1 : 0),
          resolved: state.stats.resolved + (requestData.status === 'resolved' ? 1 : 0),
        };
        
        return { 
          requests: [data[0], ...state.requests],
          stats: newStats,
          isLoading: false,
          error: null
        };
      });
      
      return { success: true, data: data[0] };
    } catch (err) {
      console.error('Error adding maintenance request:', err);
      set({ 
        isLoading: false, 
        error: err.message || 'Failed to add maintenance request' 
      });
      return { success: false, error: err.message };
    }
  },

  // Update maintenance request status
  updateRequestStatus: async (id, newStatus) => {
    set({ isLoading: true, error: null });
    
    try {
      const updates = {
        status: newStatus,
      };
      
      // If marking as resolved, add timestamp
      if (newStatus === 'resolved') {
        updates.resolved_at = new Date().toISOString();
      }
      
      const { data, error } = await supabase
        .from('maintenance_requests')
        .update(updates)
        .eq('id', id)
        .select();
      
      if (error) throw error;
      
      // Update requests list and stats
      set(state => {
        const request = state.requests.find(r => r.id === id);
        const oldStatus = request ? request.status : null;
        
        const newStats = {
          ...state.stats,
          sorted: state.stats.sorted + (newStatus === 'sorted' ? 1 : 0) - (oldStatus === 'sorted' ? 1 : 0),
          inProgress: state.stats.inProgress + (newStatus === 'in-progress' ? 1 : 0) - (oldStatus === 'in-progress' ? 1 : 0),
          resolved: state.stats.resolved + (newStatus === 'resolved' ? 1 : 0) - (oldStatus === 'resolved' ? 1 : 0),
        };
        
        return {
          requests: state.requests.map(request => 
            request.id === id 
              ? { ...request, ...updates, resolved_at: newStatus === 'resolved' ? updates.resolved_at : request.resolved_at } 
              : request
          ),
          request: state.request?.id === id 
            ? { ...state.request, ...updates, resolved_at: newStatus === 'resolved' ? updates.resolved_at : state.request.resolved_at } 
            : state.request,
          stats: newStats,
          isLoading: false,
          error: null
        }
      });
      
      return { success: true, data: data[0] };
    } catch (err) {
      console.error('Error updating maintenance request status:', err);
      set({ 
        isLoading: false, 
        error: err.message || 'Failed to update maintenance request status' 
      });
      return { success: false, error: err.message };
    }
  },

  // Delete maintenance request
  deleteRequest: async (id) => {
    set({ isLoading: true, error: null });
    
    try {
      const { error } = await supabase
        .from('maintenance_requests')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      
      // Update requests list and stats
      set(state => {
        const request = state.requests.find(r => r.id === id);
        const status = request ? request.status : null;
        
        const newStats = {
          ...state.stats,
          total: state.stats.total - 1,
          sorted: state.stats.sorted - (status === 'sorted' ? 1 : 0),
          inProgress: state.stats.inProgress - (status === 'in-progress' ? 1 : 0),
          resolved: state.stats.resolved - (status === 'resolved' ? 1 : 0),
        };
        
        return {
          requests: state.requests.filter(request => request.id !== id),
          stats: newStats,
          isLoading: false,
          error: null
        }
      });
      
      return { success: true };
    } catch (err) {
      console.error('Error deleting maintenance request:', err);
      set({ 
        isLoading: false, 
        error: err.message || 'Failed to delete maintenance request' 
      });
      return { success: false, error: err.message };
    }
  },

  // Set filters
  setFilters: (filters) => {
    set(state => ({
      filters: {
        ...state.filters,
        ...filters
      }
    }));
  },

  // Reset filters
  resetFilters: () => {
    set({
      filters: {
        status: 'all',
        searchTerm: '',
        dateRange: null,
      }
    });
  },

  // Get filtered requests
  getFilteredRequests: () => {
    const { requests, filters } = get();
    let filteredRequests = [...requests];
    
    // Apply status filter
    if (filters.status !== 'all') {
      filteredRequests = filteredRequests.filter(request => request.status === filters.status);
    }
    
    // Apply search filter
    if (filters.searchTerm) {
      const searchTerm = filters.searchTerm.toLowerCase();
      filteredRequests = filteredRequests.filter(request => 
        (request.description && request.description.toLowerCase().includes(searchTerm)) ||
        (request.vehicles?.vehicle_number && request.vehicles.vehicle_number.toLowerCase().includes(searchTerm)) ||
        (request.drivers?.name && request.drivers.name.toLowerCase().includes(searchTerm))
      );
    }
    
    // Apply date range filter
    if (filters.dateRange) {
      const { start, end } = filters.dateRange;
      if (start && end) {
        const startDate = new Date(start);
        const endDate = new Date(end);
        endDate.setHours(23, 59, 59, 999); // Set to end of day
        
        filteredRequests = filteredRequests.filter(request => {
          const createdAt = new Date(request.created_at);
          return createdAt >= startDate && createdAt <= endDate;
        });
      }
    }
    
    return filteredRequests;
  },

  // Reset store
  resetStore: () => {
    set({
      requests: [],
      request: null,
      isLoading: false,
      error: null,
      filters: {
        status: 'all',
        searchTerm: '',
        dateRange: null,
      },
      stats: {
        total: 0,
        sorted: 0,
        inProgress: 0,
        resolved: 0,
      }
    });
  }
}));

export default useMaintenanceStore;