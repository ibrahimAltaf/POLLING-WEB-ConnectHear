import { create } from 'zustand';

const useAuthStore = create((set) => ({

  token: typeof window !== 'undefined' ? localStorage.getItem('token') : null,
  user: typeof window !== 'undefined' && localStorage.getItem('user')
        ? (() => {
            try {
              const storedUser = JSON.parse(localStorage.getItem('user'));
     
              return storedUser ? { id: storedUser.id || storedUser._id, ...storedUser } : null;
            } catch (e) {
              console.error("Error parsing user from localStorage:", e);
              return null; 
            }
          })()
        : null, 
  isAuthenticated: typeof window !== 'undefined' ? !!localStorage.getItem('token') : false,
  loading: true, 


  setAuth: (token, userData) => {
    
    const userToStore = userData ? { id: userData.id || userData._id, ...userData } : null;
    console.log('[AuthStore] Setting auth with processed user data:', userToStore); 

    if (typeof window !== 'undefined') {
      localStorage.setItem('token', token);

      localStorage.setItem('user', JSON.stringify(userToStore));
    }
 
    set({ token, user: userToStore, isAuthenticated: true, loading: false });
  },

  logout: () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
    }

    set({ token: null, user: null, isAuthenticated: false, loading: false });
    console.log('[AuthStore] User logged out.'); // Debug log
  },

 
  setLoading: (isLoading) => set({ loading: isLoading }),


  initializeAuth: () => {
    console.log('[AuthStore] Initializing auth from localStorage...'); 
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('token');
      const userString = localStorage.getItem('user'); 
      if (token && userString) {
        try {
          const storedUser = JSON.parse(userString); 
     
          const user = storedUser ? { id: storedUser.id || storedUser._id, ...storedUser } : null;
          console.log('[AuthStore] Loaded user from localStorage:', user);
          
          set({ token, user, isAuthenticated: true, loading: false });
        } catch (e) {
          console.error("Error initializing user from localStorage:", e);
     
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          set({ token: null, user: null, isAuthenticated: false, loading: false });
        }
      } else {
 
        set({ loading: false });
        console.log('[AuthStore] No token or user found in localStorage.'); 
      }
    } else {
   
      set({ loading: false });
      console.log('[AuthStore] Not in browser, setting loading false.'); // Debug log
    }
  },
}));


useAuthStore.getState().initializeAuth();

export default useAuthStore;
