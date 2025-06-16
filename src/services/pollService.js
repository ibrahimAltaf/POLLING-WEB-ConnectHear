import axios from 'axios';
import useAuthStore from '@/store/authStore'; 

const API_URL = 'http://connecthearpolling.vercel.app/api/polls';

const pollService = {
  _getToken: () => {
    const { token } = useAuthStore.getState();
    return token;
  },

  _fileToBase64: (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result.split(',')[1]); 
      reader.onerror = (error) => reject(error);
    });
  },

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

  getAllPolls: async () => {
    try {
      const response = await axios.get(`${API_URL}`);
      return response.data.data;
    } catch (error) {
      console.error('Error fetching all polls:', error.response?.data || error.message);
      throw new Error(error.response?.data?.message || 'Failed to fetch polls.');
    }
  },

  getPollById: async (pollId) => {
    try {
      const response = await axios.get(`${API_URL}/${pollId}`);
      return response.data.data; 
    } catch (error) {
      console.error('Error fetching poll by ID:', error.response?.data || error.message);
      throw new Error(error.response?.data?.message || 'Failed to fetch poll details.');
    }
  },

  vote: async (pollId, optionId) => {
    try {
      const token = pollService._getToken();
      
      const headers = token ? { 'Authorization': `Bearer ${token}` } : {};

      const response = await axios.post(`${API_URL}/${pollId}/vote`, { optionId }, { headers });
      return response.data;
    } catch (error) {
      console.error('Error voting on poll:', error.response?.data || error.message);
      throw new Error(error.response?.data?.message || 'Failed to cast vote.');
    }
  },

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
        ...updatedData,
        images: imagesData,
      };

      const response = await axios.put(`${API_URL}/${pollId}`, payload, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json', 
        },
      });
      return response.data;
    } catch (error) {
      console.error('Error updating poll:', error.response?.data || error.message);
      throw new Error(error.response?.data?.message || 'Failed to update poll.');
    }
  },

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
      return response.data;
    } catch (error) {
      console.error('Error deleting poll:', error.response?.data || error.message);
      throw new Error(error.response?.data?.message || 'Failed to delete poll.');
    }
  },

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
      return response.data.data;
    } catch (error) {
      console.error("Error fetching user's created polls:", error.response?.data || error.message);
      throw new Error(error.response?.data?.message || 'Failed to fetch your created polls.');
    }
  },

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
      return response.data.data;
    } catch (error) {
      console.error("Error fetching user's voted polls:", error.response?.data || error.message);
      throw new Error(error.response?.data?.message || 'Failed to fetch polls you have voted on.');
    }
  },
};

export default pollService;
