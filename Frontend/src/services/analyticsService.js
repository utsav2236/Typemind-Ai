import api from './api';

const analyticsService = {
  getOverview: async () => {
    const response = await api.get('/analytics/overview');
    return response.data;
  },

  getProgress: async (params = {}) => {
    const response = await api.get('/analytics/progress', { params });
    return response.data;
  },

  getWeaknesses: async () => {
    const response = await api.get('/analytics/weaknesses');
    return response.data;
  },

  getKeyPerformance: async () => {
    const response = await api.get('/analytics/key-performance');
    return response.data;
  },

  getFingerPerformance: async () => {
    const response = await api.get('/analytics/finger-performance');
    return response.data;
  },
};

export default analyticsService;
