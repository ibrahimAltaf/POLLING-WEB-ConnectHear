// src/store/authStore.js
import { create } from 'zustand';

// Define the shape of your authentication state
const useAuthStore = create((set) => ({
  // Initialize state from localStorage. Handle potential missing 'id' or other user properties.
  token: typeof window !== 'undefined' ? localStorage.getItem('token') : null,
  user: typeof window !== 'undefined' && localStorage.getItem('user')
        ? (() => {
            try {
              const storedUser = JSON.parse(localStorage.getItem('user'));
              // Ensure user object has an 'id' property. If backend sends '_id', map it to 'id'.
              // This is a common point of failure.
              // We create a new object to ensure 'id' is always present, preferring existing 'id' if available.
              return storedUser ? { id: storedUser.id || storedUser._id, ...storedUser } : null;
            } catch (e) {
              console.error("Error parsing user from localStorage:", e);
              return null; // Return null if parsing fails
            }
          })()
        : null, // If not in window or no user in localStorage, default to null
  isAuthenticated: typeof window !== 'undefined' ? !!localStorage.getItem('token') : false,
  loading: true, // Set to true initially while checking auth status

  // Action to set authentication state (e.g., after login/register)
  setAuth: (token, userData) => {
    // Process the incoming userData to ensure it has an 'id' property.
    // If the backend sends '_id', we map it to 'id' for consistency.
    const userToStore = userData ? { id: userData.id || userData._id, ...userData } : null;
    console.log('[AuthStore] Setting auth with processed user data:', userToStore); // Debug log

    if (typeof window !== 'undefined') {
      localStorage.setItem('token', token);
      // Store the processed user object in localStorage
      localStorage.setItem('user', JSON.stringify(userToStore));
    }
    // Update the Zustand store state
    set({ token, user: userToStore, isAuthenticated: true, loading: false });
  },

  // Action for logout
  logout: () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
    }
    // Reset state to initial unauthenticated values
    set({ token: null, user: null, isAuthenticated: false, loading: false });
    console.log('[AuthStore] User logged out.'); // Debug log
  },

  // Action to set loading state (useful for external loading indicators)
  setLoading: (isLoading) => set({ loading: isLoading }),

  // Initialize auth state on store creation (runs once)
  // This helps to hydrate the store with existing auth data from localStorage on app load
  initializeAuth: () => {
    console.log('[AuthStore] Initializing auth from localStorage...'); // Debug log
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('token');
      const userString = localStorage.getItem('user'); // Get user data as string
      if (token && userString) {
        try {
          const storedUser = JSON.parse(userString); // Parse stored user data
          // Ensure 'id' is present when initializing from localStorage
          // Map '_id' to 'id' if necessary for consistency
          const user = storedUser ? { id: storedUser.id || storedUser._id, ...storedUser } : null;
          console.log('[AuthStore] Loaded user from localStorage:', user); // Debug log
          // Set state with loaded data
          set({ token, user, isAuthenticated: true, loading: false });
        } catch (e) {
          console.error("Error initializing user from localStorage:", e);
          // If parsing fails, clear auth state and stop loading
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          set({ token: null, user: null, isAuthenticated: false, loading: false });
        }
      } else {
        // If no token or user found, set state as not authenticated and stop loading
        set({ loading: false });
        console.log('[AuthStore] No token or user found in localStorage.'); // Debug log
      }
    } else {
      // For server-side rendering environments, set loading to false immediately
      set({ loading: false });
      console.log('[AuthStore] Not in browser, setting loading false.'); // Debug log
    }
  },
}));

// This line calls initializeAuth immediately when the module is first imported.
// It ensures your store is hydrated with authentication status from localStorage
// as soon as your application starts.
useAuthStore.getState().initializeAuth();

export default useAuthStore;
