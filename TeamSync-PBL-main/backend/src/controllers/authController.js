const authService = require('../services/authService');

async function register(req, res, next) {
  try {
    const user = await authService.register(req.body);
    res.status(201).json({ success: true, user });
  } catch (err) {
    next(err);
  }
}

async function login(req, res, next) {
  try {
    const { rollNumber, password } = req.body;
    const result = await authService.login(rollNumber, password);
    res.json({ success: true, ...result });
  } catch (err) {
    next(err);
  }
}

async function refresh(req, res, next) {
  try {
    const { refresh_token } = req.body;
    const result = await authService.refreshAccessToken(refresh_token);
    res.json({ success: true, ...result });
  } catch (err) {
    next(err);
  }
}

async function logout(req, res, next) {
  try {
    const { refresh_token } = req.body;
    if (refresh_token) await authService.logout(refresh_token);
    res.json({ success: true, message: 'Logged out' });
  } catch (err) {
    next(err);
  }
}

async function me(req, res, next) {
  try {
    const userService = require('../services/userService');
    const user = await userService.getUserById(req.user.userId);
    res.json({ user });
  } catch (err) {
    next(err);
  }
}

module.exports = { register, login, refresh, logout, me };
