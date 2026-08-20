// controllers/achievementController.js
// Returns user achievement data.

import Achievement from '../models/Achievement.js';
import { successResponse } from '../utils/response.js';

/**
 * GET /api/achievements
 * Returns all achievements unlocked by the user.
 */
export const getAchievements = async (req, res, next) => {
  try {
    const achievements = await Achievement.find({ user: req.user._id })
      .sort({ unlockedAt: -1 })
      .lean();

    return successResponse(res, 200, 'Achievements retrieved.', {
      achievements,
      count: achievements.length,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/achievements/recent
 * Returns the 5 most recently unlocked achievements.
 */
export const getRecentAchievements = async (req, res, next) => {
  try {
    const achievements = await Achievement.find({ user: req.user._id })
      .sort({ unlockedAt: -1 })
      .limit(5)
      .lean();

    return successResponse(res, 200, 'Recent achievements retrieved.', { achievements });
  } catch (err) {
    next(err);
  }
};
