import api from './api';

const typingService = {
  // Submit a completed typing session
  submitSession: async (sessionData) => {
    const response = await api.post('/typing/sessions', sessionData);
    return response.data;
  },

  // Get all sessions for the current user
  getSessions: async (params = {}) => {
    const response = await api.get('/typing/sessions', { params });
    return response.data;
  },

  // Get a specific session by ID
  getSessionById: async (id) => {
    const response = await api.get(`/typing/sessions/${id}`);
    return response.data;
  },
};

export default typingService;
