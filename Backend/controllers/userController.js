// controllers/userController.js
// Manages user profile read and update.

import User from '../models/User.js';
import { successResponse, errorResponse } from '../utils/response.js';

/**
 * GET /api/users/profile
 * Returns the authenticated user's full profile.
 */
export const getProfile = (req, res) => {
  return successResponse(res, 200, 'Profile retrieved.', { user: req.user });
};

/**
 * PUT /api/users/profile
 * Updates allowed profile fields.
 * Stats like typingIQ, bestWpm are NOT modifiable here.
 */
export const updateProfile = async (req, res, next) => {
  try {
    const allowedFields = ['name', 'avatar', 'preferences'];
    const updates = {};

    for (const field of allowedFields) {
      if (req.body[field] !== undefined) {
        updates[field] = req.body[field];
      }
    }

    if (Object.keys(updates).length === 0) {
      return errorResponse(res, 400, 'No valid fields to update.');
    }

    const user = await User.findByIdAndUpdate(
      req.user._id,
      { $set: updates },
      { new: true, runValidators: true }
    ).select('-password');

    if (!user) {
      return errorResponse(res, 404, 'User not found.');
    }

    return successResponse(res, 200, 'Profile updated successfully.', { user });
  } catch (err) {
    next(err);
  }
};
