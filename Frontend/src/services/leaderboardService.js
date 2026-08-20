import api from './api';

const leaderboardService = {
  getLeaderboard: async (params = {}) => {
    const response = await api.get('/leaderboard', { params });
    return response.data;
  },
};

export default leaderboardService;
