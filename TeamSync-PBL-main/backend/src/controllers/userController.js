const userService = require('../services/userService');

async function getProfile(req, res, next) {
  try {
    const userId = parseInt(req.params.userId) || req.user.userId;
    const user = await userService.getUserById(userId);
    res.json({ user });
  } catch (err) {
    next(err);
  }
}

async function updateProfile(req, res, next) {
  try {
    const user = await userService.updateProfile(req.user.userId, req.body);
    res.json({ success: true, user });
  } catch (err) {
    next(err);
  }
}

async function getStats(req, res, next) {
  try {
    const userId = parseInt(req.params.userId) || req.user.userId;
    const stats = await userService.getUserStats(userId);
    res.json({ stats });
  } catch (err) {
    next(err);
  }
}

async function getContributions(req, res, next) {
  try {
    const userId = parseInt(req.params.userId) || req.user.userId;
    const limit = parseInt(req.query.limit) || 20;
    const contributions = await userService.getUserContributions(userId, limit);
    res.json({ contributions });
  } catch (err) {
    next(err);
  }
}

async function getAllUsers(req, res, next) {
  try {
    const { role, search } = req.query;
    const users = await userService.getAllUsers(role, search);
    res.json({ users });
  } catch (err) {
    next(err);
  }
}

async function searchUsers(req, res, next) {
  try {
    const { role, search, roll_number } = req.query;
    const users = await userService.searchUsers(role, search, roll_number);
    res.json({ users });
  } catch (err) {
    next(err);
  }
}

async function deactivateUser(req, res, next) {
  try {
    const targetId = parseInt(req.params.userId);
    if (targetId === req.user.userId) {
      return res.status(400).json({ error: 'Cannot deactivate your own account' });
    }
    const { rows } = await require('../config/db').query(
      `UPDATE users SET is_active = false, updated_at = NOW()
       WHERE id = $1 AND role != 'admin'
       RETURNING id, name, roll_number`,
      [targetId]
    );
    if (rows.length === 0) {
      return res.status(404).json({ error: 'User not found or cannot deactivate admin' });
    }
    // Revoke all tokens for deactivated user
    await require('../services/authService').revokeAllUserTokens(targetId);
    res.json({ success: true, user: rows[0] });
  } catch (err) {
    next(err);
  }
}

module.exports = { getProfile, updateProfile, getStats, getContributions, getAllUsers, searchUsers, deactivateUser };
