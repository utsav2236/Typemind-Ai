import api from './api.js';

// Helper to get or create a guest session ID in sessionStorage
export const getGuestSessionId = () => {
  let sessionId = sessionStorage.getItem('guestSessionId');
  if (!sessionId) {
    sessionId = crypto.randomUUID();
    sessionStorage.setItem('guestSessionId', sessionId);
  }
  return sessionId;
};

const guestService = {
  startGuestTest: async (duration) => {
    const sessionId = getGuestSessionId();
    const response = await api.post('/typing/guest/start', { duration, sessionId });
    return response.data;
  },

  submitGuestResult: async (testData) => {
    const response = await api.post('/typing/guest/result', testData);
    return response.data;
  },
};

export default guestService;
