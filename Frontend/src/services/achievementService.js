import api from './api';

const achievementService = {
  getAchievements: async () => {
    const response = await api.get('/achievements');
    return response.data;
  },

  getRecentAchievements: async () => {
    const response = await api.get('/achievements/recent');
    return response.data;
  },
};

export default achievementService;
