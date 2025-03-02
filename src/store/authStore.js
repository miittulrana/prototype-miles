import { create } from 'zustand';
import { auth } from '../services/supabase';

const useAuthStore = create((set) => ({
  user: null,
  role: null,
  isLoading: false,
  error: null,

  // Login
  login: async (email, password) => {
    set({ isLoading: true, error: null });
    
    try {
      const { data, error } = await auth.signIn(email, password);
      
      if (error) throw error;
      
      // Get the user's role
      const userId = data.user.id;
      const { role, error: roleError } = await auth.getUserRole(userId);
      
      if (roleError) throw roleError;
      
      set({ 
        user: data.user,
        role: role,
        isLoading: false,
        error: null
      });

      return { success: true, role };
    } catch (error) {
      set({ 
        isLoading: false, 
        error: error.message || 'Failed to login' 
      });
      return { success: false, error: error.message };
    }
  },

  // Logout
  logout: async () => {
    set({ isLoading: true });
    
    try {
      const { error } = await auth.signOut();
      if (error) throw error;
      
      set({ 
        user: null,
        role: null,
        isLoading: false,
        error: null
      });
      
      return { success: true };
    } catch (error) {
      set({ 
        isLoading: false, 
        error: error.message || 'Failed to logout' 
      });
      return { success: false, error: error.message };
    }
  },

  // Check auth state
  checkAuthState: async () => {
    set({ isLoading: true });
    
    try {
      const user = await auth.getCurrentUser();
      
      if (!user) {
        set({ 
          user: null, 
          role: null,
          isLoading: false 
        });
        return { authenticated: false };
      }
      
      // Get the user's role
      const { role, error: roleError } = await auth.getUserRole(user.id);
      
      if (roleError) throw roleError;
      
      set({ 
        user, 
        role,
        isLoading: false,
        error: null
      });
      
      return { authenticated: true, role };
    } catch (error) {
      set({ 
        user: null,
        role: null,
        isLoading: false, 
        error: error.message || 'Failed to get auth state' 
      });
      return { authenticated: false, error: error.message };
    }
  },
}));

export default useAuthStore;