// pollService.js
import axios from 'axios';
import useAuthStore from '@/store/authStore'; // Import your Zustand auth store

// Backend Polls API base URL
// Ensure NEXT_PUBLIC_API_URL is set in your .env.local file for production/deployment
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/polls';

const pollService = {
  // Helper function to get the auth token from the Zustand store
  _getToken: () => {
    // Directly access the current state of the auth store
    const { token } = useAuthStore.getState();
    return token;
  },

  /**
   * Helper function to convert a File object to a base64 string.
   * @param {File} file - The File object to convert.
   * @returns {Promise<string>} - A promise that resolves with the base64 string.
   */
  _fileToBase64: (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result.split(',')[1]); // Get only the base64 part
      reader.onerror = (error) => reject(error);
    });
  },

  /**
   * Creates a new poll.
   * @param {string} question - The poll question.
   * @param {string[]} options - An array of poll options (strings).
   * @param {File[]} [imageFiles=[]] - An array of File objects for poll images.
   * @returns {Promise<object>} - The response data from the backend.
   */
  createPoll: async (question, options, imageFiles = []) => {
    try {
      const token = pollService._getToken();
      if (!token) {
        throw new Error('Authentication required. Please log in to create a poll.');
      }

      const imagesData = await Promise.all(
        imageFiles.map(async (file) => ({
          base64: await pollService._fileToBase64(file),
          fileName: file.name,
        }))
      );

      const payload = {
        question,
        options,
        images: imagesData,
      };
      const response = await axios.post(`${API_URL}/create`, payload, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      return response.data;
    } catch (error) {
      console.error('Error creating poll:', error.response?.data || error.message);
      throw new Error(error.response?.data?.message || 'Failed to create poll. Please try again.');
    }
  },

  /**
   * Fetches all polls.
   * @returns {Promise<object[]>} - An array of poll objects.
   */
  getAllPolls: async () => {
    try {
      const response = await axios.get(`${API_URL}`);
      return response.data.data; // Assuming backend returns { success: true, data: [...] }
    } catch (error) {
      console.error('Error fetching all polls:', error.response?.data || error.message);
      throw new Error(error.response?.data?.message || 'Failed to fetch polls.');
    }
  },

  /**
   * Fetches a single poll by ID.
   * @param {string} pollId - The ID of the poll.
   * @returns {Promise<object>} - The poll object.
   */
  getPollById: async (pollId) => {
    try {
      const response = await axios.get(`${API_URL}/${pollId}`);
      return response.data.data; // Assuming backend returns { success: true, data: { ... } }
    } catch (error) {
      console.error('Error fetching poll by ID:', error.response?.data || error.message);
      throw new Error(error.response?.data?.message || 'Failed to fetch poll details.');
    }
  },

  /**
   * Casts a vote on a poll.
   * The backend's `vote` endpoint is designed to allow anonymous votes if no token is provided.
   * @param {string} pollId - The ID of the poll.
   * @param {string} optionId - The ID of the option to vote for.
   * @returns {Promise<object>} - The updated poll data after voting.
   */
  vote: async (pollId, optionId) => {
    try {
      const token = pollService._getToken();
      // Conditionally add 'Authorization' header only if a token exists
      const headers = token ? { 'Authorization': `Bearer ${token}` } : {};

      const response = await axios.post(`${API_URL}/${pollId}/vote`, { optionId }, { headers });
      return response.data; // Backend returns { success, message, data: updatedPoll }
    } catch (error) {
      console.error('Error voting on poll:', error.response?.data || error.message);
      throw new Error(error.response?.data?.message || 'Failed to cast vote.');
    }
  },

  /**
   * Updates an existing poll with new data and/or images.
   * @param {string} pollId - The ID of the poll to update.
   * @param {object} updatedData - Object containing updated question and/or options.
   * @param {string} [updatedData.question] - New question for the poll.
   * @param {string[]} [updatedData.options] - New array of options.
   * @param {File[]} [imageFiles=[]] - An array of new File objects for poll images. These will replace existing images on the backend.
   * @returns {Promise<object>} - The updated poll data.
   */
  updatePoll: async (pollId, updatedData, imageFiles = []) => {
    try {
      const token = pollService._getToken();
      if (!token) {
        throw new Error('Authentication required. Please log in to update a poll.');
      }

      const imagesData = await Promise.all(
        imageFiles.map(async (file) => ({
          base64: await pollService._fileToBase64(file),
          fileName: file.name,
        }))
      );

      const payload = {
        ...updatedData, // Includes question and/or options
        images: imagesData,
      };

      const response = await axios.put(`${API_URL}/${pollId}`, payload, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json', // Sending JSON
        },
      });
      return response.data; // Backend returns { success, message, data: updatedPoll }
    } catch (error) {
      console.error('Error updating poll:', error.response?.data || error.message);
      throw new Error(error.response?.data?.message || 'Failed to update poll.');
    }
  },

  /**
   * Deletes a poll.
   * @param {string} pollId - The ID of the poll to delete.
   * @returns {Promise<object>} - A confirmation message.
   */
  deletePoll: async (pollId) => {
    try {
      const token = pollService._getToken();
      if (!token) {
        throw new Error('Authentication required. Please log in to delete a poll.');
      }

      const response = await axios.delete(`${API_URL}/${pollId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      return response.data; // Backend returns { success, message, data: {} }
    } catch (error) {
      console.error('Error deleting poll:', error.response?.data || error.message);
      throw new Error(error.response?.data?.message || 'Failed to delete poll.');
    }
  },

  /**
   * Fetches polls created by the currently logged-in user.
   * Requires authentication.
   * @returns {Promise<object[]>} - An array of poll objects created by the user.
   */
  getMyPolls: async () => {
    try {
      const token = pollService._getToken();
      if (!token) {
        throw new Error('Authentication required. Please log in to view your polls.');
      }

      const response = await axios.get(`${API_URL}/my-polls`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      return response.data.data; // Assuming backend returns { success: true, count: N, data: [...] }
    } catch (error) {
      console.error("Error fetching user's created polls:", error.response?.data || error.message);
      throw new Error(error.response?.data?.message || 'Failed to fetch your created polls.');
    }
  },

  /**
   * Fetches polls that the currently logged-in user has voted on.
   * Requires authentication.
   * @returns {Promise<object[]>} - An array of poll objects the user has voted on.
   */
  getVotedPolls: async () => {
    try {
      const token = pollService._getToken();
      if (!token) {
        throw new Error('Authentication required. Please log in to view your voted polls.');
      }

      const response = await axios.get(`${API_URL}/voted-polls`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      return response.data.data; // Assuming backend returns { success: true, count: N, data: [...] }
    } catch (error) {
      console.error("Error fetching user's voted polls:", error.response?.data || error.message);
      throw new Error(error.response?.data?.message || 'Failed to fetch polls you have voted on.');
    }
  },
};

export default pollService;