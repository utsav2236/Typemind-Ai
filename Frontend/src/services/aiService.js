import api from './api';

const aiService = {
  generatePractice: async (data = {}) => {
    const response = await api.post('/ai/generate-practice', data);
    return response.data;
  },

  getAnalysis: async (sessionId) => {
    const response = await api.get(`/ai/analysis/${sessionId}`);
    return response.data;
  },

  getRecentAnalyses: async () => {
    const response = await api.get('/ai/analyses');
    return response.data;
  },
};

export default aiService;
