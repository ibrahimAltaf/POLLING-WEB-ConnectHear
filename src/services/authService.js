// frontend/src/services/authService.js (Complete updated file)

import axios from 'axios';

const API_URL =  'http://connecthearpolling.vercel.app/api/auth'; 

const authService = {
  login: async (email, password) => {
    try {
      const response = await axios.post(`${API_URL}/login`, { email, password });
      
      const { token, user } = response.data; 

      if (!token || !user) {
        throw new Error('Login response did not contain token or user data.');
      }
      console.log('Login successful:', user);
      console.log('Token:', token);
      return { token, user };
    } catch (error) {
      const errorMessage = error.response?.data?.message || error.message || 'Login failed due to an unexpected error.'; // Use error.response.data.message for consistency
      console.error('Login error:', errorMessage);
      throw new Error(errorMessage);
    }
  },

  register: async (username, email, password, profileImageFile = null) => {
    try {
      const formData = new FormData();
      formData.append('username', username);
      formData.append('email', email);
      formData.append('password', password);
      if (profileImageFile) {
        formData.append('profileImage', profileImageFile); // Append the image file
      }

      const response = await axios.post(`${API_URL}/register`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data', // Important for file uploads
        },
      });
      
      const { token, user } = response.data;

      if (!token || !user) {
        throw new Error('Registration response did not contain token or user data.');
      }
      return { token, user };
    } catch (error) {
      const errorMessage = error.response?.data?.message || error.message || 'Registration failed due to an unexpected error.';
      console.error('Registration error:', errorMessage);
      throw new Error(errorMessage);
    }
  },

  getCurrentUser: async (token) => {
    try {
      const response = await axios.get(`${API_URL}/user`, {
        headers: {
          'x-auth-token': token,
        },
      });
      return response.data.data; // Backend sends { success: true, data: user } for getUser route
    } catch (error) {
      const errorMessage = error.response?.data?.message || error.message || 'Failed to fetch user data. Please log in again.';
      console.error('getCurrentUser error:', errorMessage);
      throw new Error(errorMessage);
    }
  },

  /**
   * Updates user profile data including optional profile image.
   * @param {string} token - User's authentication token.
   * @param {object} userData - Object with fields to update (username, email).
   * @param {File | null} profileImageFile - New profile image file (optional).
   * @param {boolean} clearProfileImage - Flag to clear current profile image (optional).
   * @returns {Promise<object>} - Updated user object.
   * @throws {Error} - Throws an error on failure.
   */
  updateProfile: async (token, userData, profileImageFile = null, clearProfileImage = false) => {
    try {
      const formData = new FormData();
      if (userData.username !== undefined) formData.append('username', userData.username);
      if (userData.email !== undefined) formData.append('email', userData.email);
      if (profileImageFile) formData.append('profileImage', profileImageFile);
      if (clearProfileImage) formData.append('clearProfileImage', 'true'); // Send a flag to backend

      const response = await axios.put(`${API_URL}/profile`, formData, {
        headers: {
          'Authorization': token,
          'Content-Type': 'multipart/form-data',
        },
      });
      // Backend returns { success, message, data: user } for updateUser route
      return response.data.data; // Return the updated user object
    } catch (error) {
      const errorMessage = error.response?.data?.message || error.message || 'Failed to update profile.';
      console.error('Update profile error:', errorMessage);
      throw new Error(errorMessage);
    }
  },

  // New: Request password reset (sends OTP)
  forgotPassword: async (email) => {
    try {
      const response = await axios.post(`${API_URL}/forgotpassword`, { email });
      return response.data; // Expected: { success: true, message: 'OTP sent...' }
    } catch (error) {
      const errorMessage = error.response?.data?.message || error.message || 'Failed to send password reset email.';
      console.error('Forgot password error:', errorMessage);
      throw new Error(errorMessage);
    }
  },

  // New: Verify OTP
  verifyOtp: async (email, otp) => {
    try {
      const response = await axios.post(`${API_URL}/verify-otp`, { email, otp });
      // Expected: { success: true, message: 'OTP verified...', passwordChangeToken: '...' }
      return response.data; 
    } catch (error) {
      const errorMessage = error.response?.data?.message || error.message || 'OTP verification failed.';
      console.error('Verify OTP error:', errorMessage);
      throw new Error(errorMessage);
    }
  },

  // New: Reset Password
  resetPassword: async (password, passwordChangeToken) => {
    try {
      const response = await axios.put(`${API_URL}/resetpassword`, { password, passwordChangeToken });
      // Expected: { success: true, message: 'Password has been reset...', token: '...', user: {...} }
      return response.data; 
    } catch (error) {
      const errorMessage = error.response?.data?.message || error.message || 'Password reset failed.';
      console.error('Reset password error:', errorMessage);
      throw new Error(errorMessage);
    }
  },

  // New: Logout (calls backend endpoint, clears cookie)
  logout: async (token) => { // Accept token for protected route if backend requires
    try {
      // You might or might not need to send the token depending on how your backend's logout route is protected.
      // If your backend's logout clears an HTTP-only cookie, you might not even need the token in the request.
      // If it's a protected route that checks the 'x-auth-token' header, include it.
      await axios.post(`${API_URL}/logout`, {}, {
        headers: {
          'x-auth-token': token, // Include token if your logout route is protected by authMiddleware
        },
      });
      // The backend will clear the cookie. Frontend will clear local storage via Zustand.
      return { success: true, message: 'Logged out successfully.' };
    } catch (error) {
      const errorMessage = error.response?.data?.message || error.message || 'Logout failed.';
      console.error('Logout error:', errorMessage);
      throw new Error(errorMessage);
    }
  }
};

export default authService;