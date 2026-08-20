// controllers/leaderboardController.js
// Paginated leaderboard supporting weekly, monthly, and all-time views.

import TypingSession from '../models/TypingSession.js';
import User from '../models/User.js';
import { successResponse, errorResponse } from '../utils/response.js';
import { LEADERBOARD } from '../utils/constants.js';

/**
 * GET /api/leaderboard
 * Query params: period (weekly|monthly|allTime), page, limit
 */
export const getLeaderboard = async (req, res, next) => {
  try {
    const period = req.query.period || 'allTime';
    const page   = Math.max(1, parseInt(req.query.page)  || 1);
    const limit  = Math.min(parseInt(req.query.limit) || LEADERBOARD.DEFAULT_LIMIT, LEADERBOARD.MAX_LIMIT);
    const skip   = (page - 1) * limit;

    // Validate period
    if (!['weekly', 'monthly', 'allTime'].includes(period)) {
      return errorResponse(res, 400, "Period must be 'weekly', 'monthly', or 'allTime'.");
    }

    // ── Build date filter ─────────────────────────────────────────────────
    let dateFilter = {};
    const now = new Date();
    if (period === 'weekly') {
      const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      dateFilter = { createdAt: { $gte: weekAgo } };
    } else if (period === 'monthly') {
      const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      dateFilter = { createdAt: { $gte: monthAgo } };
    }

    // ── Get users with leaderboardVisible = true ───────────────────────────
    const visibleUsers = await User.find({
      'preferences.leaderboardVisible': true,
    }).select('_id').lean();
    const visibleUserIds = visibleUsers.map((u) => u._id);

    if (visibleUserIds.length === 0) {
      return successResponse(res, 200, 'Leaderboard retrieved.', {
        leaderboard: [],
        pagination: { page, limit, total: 0, totalPages: 0 },
        period,
      });
    }

    // ── Aggregate best WPM per user in the time period ───────────────────
    const pipeline = [
      {
        $match: {
          user: { $in: visibleUserIds },
          ...dateFilter,
        },
      },
      {
        $group: {
          _id:             '$user',
          bestWpm:         { $max: '$wpm' },
          averageAccuracy: { $avg: '$accuracy' },
          totalTests:      { $sum: 1 },
          bestTypingIQ:    { $max: '$typingIQ' },
        },
      },
      { $sort: { bestWpm: -1 } },
      { $skip: skip },
      { $limit: limit },
      {
        $lookup: {
          from:         'users',
          localField:   '_id',
          foreignField: '_id',
          as:           'userInfo',
        },
      },
      { $unwind: '$userInfo' },
      {
        $project: {
          _id:             0,
          userId:          '$_id',
          name:            '$userInfo.name',
          avatar:          '$userInfo.avatar',
          bestWpm:         1,
          averageAccuracy: { $round: ['$averageAccuracy', 2] },
          totalTests:      1,
          typingIQ:        '$userInfo.stats.typingIQ',
          // Email is intentionally excluded
        },
      },
    ];

    const entries = await TypingSession.aggregate(pipeline);

    // Get total count for pagination
    const countPipeline = [
      {
        $match: {
          user: { $in: visibleUserIds },
          ...dateFilter,
        },
      },
      { $group: { _id: '$user' } },
      { $count: 'total' },
    ];
    const countResult = await TypingSession.aggregate(countPipeline);
    const total = countResult[0]?.total || 0;

    // Add rank numbers
    const ranked = entries.map((entry, i) => ({
      rank: skip + i + 1,
      ...entry,
    }));

    return successResponse(res, 200, 'Leaderboard retrieved.', {
      leaderboard: ranked,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
      period,
    });
  } catch (err) {
    next(err);
  }
};
