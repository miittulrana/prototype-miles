import { create } from 'zustand';
import { supabase } from '../services/supabase';

const useVehicleStore = create((set, get) => ({
  vehicles: [],
  vehicle: null,
  isLoading: false,
  error: null,
  filters: {
    status: 'all',
    searchTerm: '',
  },

  // Fetch all vehicles
  fetchVehicles: async () => {
    set({ isLoading: true, error: null });
    
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
          drivers:users(id, name, email)
        `)
        .order('vehicle_number', { ascending: true });
      
      if (error) throw error;
      
      set({ 
        vehicles: data || [],
        isLoading: false,
        error: null
      });
      
      return { success: true, data };
    } catch (err) {
      console.error('Error fetching vehicles:', err);
      set({ 
        isLoading: false, 
        error: err.message || 'Failed to load vehicles' 
      });
      return { success: false, error: err.message };
    }
  },

  // Fetch a single vehicle by ID
  fetchVehicleById: async (id) => {
    set({ isLoading: true, error: null });
    
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
          drivers:users(id, name, email)
        `)
        .eq('id', id)
        .single();
      
      if (error) throw error;
      
      set({ 
        vehicle: data,
        isLoading: false,
        error: null
      });
      
      return { success: true, data };
    } catch (err) {
      console.error('Error fetching vehicle:', err);
      set({ 
        isLoading: false, 
        error: err.message || 'Failed to load vehicle' 
      });
      return { success: false, error: err.message };
    }
  },

  // Fetch available vehicles
  fetchAvailableVehicles: async () => {
    set({ isLoading: true, error: null });
    
    try {
      const { data, error } = await supabase
        .from('vehicles')
        .select(`
          id,
          vehicle_number,
          make,
          model,
          status,
          created_at
        `)
        .eq('status', 'available')
        .order('vehicle_number', { ascending: true });
      
      if (error) throw error;
      
      set({ 
        vehicles: data || [],
        isLoading: false,
        error: null
      });
      
      return { success: true, data };
    } catch (err) {
      console.error('Error fetching available vehicles:', err);
      set({ 
        isLoading: false, 
        error: err.message || 'Failed to load available vehicles' 
      });
      return { success: false, error: err.message };
    }
  },

  // Add new vehicle
  addVehicle: async (vehicleData) => {
    set({ isLoading: true, error: null });
    
    try {
      const { data, error } = await supabase
        .from('vehicles')
        .insert([vehicleData])
        .select();
      
      if (error) throw error;
      
      // Update vehicles list
      set(state => ({ 
        vehicles: [...state.vehicles, data[0]],
        isLoading: false,
        error: null
      }));
      
      return { success: true, data: data[0] };
    } catch (err) {
      console.error('Error adding vehicle:', err);
      set({ 
        isLoading: false, 
        error: err.message || 'Failed to add vehicle' 
      });
      return { success: false, error: err.message };
    }
  },

  // Update vehicle
  updateVehicle: async (id, updates) => {
    set({ isLoading: true, error: null });
    
    try {
      const { data, error } = await supabase
        .from('vehicles')
        .update(updates)
        .eq('id', id)
        .select();
      
      if (error) throw error;
      
      // Update vehicles list
      set(state => ({
        vehicles: state.vehicles.map(vehicle => 
          vehicle.id === id ? { ...vehicle, ...updates } : vehicle
        ),
        vehicle: state.vehicle?.id === id ? { ...state.vehicle, ...updates } : state.vehicle,
        isLoading: false,
        error: null
      }));
      
      return { success: true, data: data[0] };
    } catch (err) {
      console.error('Error updating vehicle:', err);
      set({ 
        isLoading: false, 
        error: err.message || 'Failed to update vehicle' 
      });
      return { success: false, error: err.message };
    }
  },

  // Delete vehicle
  deleteVehicle: async (id) => {
    set({ isLoading: true, error: null });
    
    try {
      const { error } = await supabase
        .from('vehicles')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      
      // Update vehicles list
      set(state => ({
        vehicles: state.vehicles.filter(vehicle => vehicle.id !== id),
        isLoading: false,
        error: null
      }));
      
      return { success: true };
    } catch (err) {
      console.error('Error deleting vehicle:', err);
      set({ 
        isLoading: false, 
        error: err.message || 'Failed to delete vehicle' 
      });
      return { success: false, error: err.message };
    }
  },

  // Update vehicle status
  updateVehicleStatus: async (id, status, driverId = null) => {
    set({ isLoading: true, error: null });
    
    try {
      const updates = { 
        status, 
        assigned_driver_id: driverId 
      };
      
      const { data, error } = await supabase
        .from('vehicles')
        .update(updates)
        .eq('id', id)
        .select();
      
      if (error) throw error;
      
      // Update vehicles list
      set(state => ({
        vehicles: state.vehicles.map(vehicle => 
          vehicle.id === id ? { ...vehicle, ...updates } : vehicle
        ),
        vehicle: state.vehicle?.id === id ? { ...state.vehicle, ...updates } : state.vehicle,
        isLoading: false,
        error: null
      }));
      
      return { success: true, data: data[0] };
    } catch (err) {
      console.error('Error updating vehicle status:', err);
      set({ 
        isLoading: false, 
        error: err.message || 'Failed to update vehicle status' 
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
      }
    });
  },

  // Get filtered vehicles
  getFilteredVehicles: () => {
    const { vehicles, filters } = get();
    let filteredVehicles = [...vehicles];
    
    // Apply status filter
    if (filters.status !== 'all') {
      filteredVehicles = filteredVehicles.filter(vehicle => vehicle.status === filters.status);
    }
    
    // Apply search filter
    if (filters.searchTerm) {
      const searchTerm = filters.searchTerm.toLowerCase();
      filteredVehicles = filteredVehicles.filter(vehicle => 
        vehicle.vehicle_number.toLowerCase().includes(searchTerm) ||
        vehicle.make.toLowerCase().includes(searchTerm) ||
        vehicle.model.toLowerCase().includes(searchTerm) ||
        (vehicle.drivers?.name && vehicle.drivers.name.toLowerCase().includes(searchTerm))
      );
    }
    
    return filteredVehicles;
  },

  // Reset store
  resetStore: () => {
    set({
      vehicles: [],
      vehicle: null,
      isLoading: false,
      error: null,
      filters: {
        status: 'all',
        searchTerm: '',
      }
    });
  }
}));

export default useVehicleStore;