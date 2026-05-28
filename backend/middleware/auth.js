const jwt = require('jsonwebtoken');

/**
 * Authentication middleware — verifies JWT token from Authorization header.
 * Attaches decoded user info to req.user on success.
 */
const authMiddleware = (req, res, next) => {
  try {
    const authHeader = req.header('Authorization');
    if (!authHeader) {
      return res.status(401).json({ error: 'Access denied. No token provided.' });
    }

    const token = authHeader.replace('Bearer ', '');
    if (!token) {
      return res.status(401).json({ error: 'Access denied. No token provided.' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret');
    req.user = decoded; // { userId, rollNumber, role }
    next();
  } catch (error) {
    res.status(401).json({ error: 'Invalid or expired token.' });
  }
};

/**
 * Admin-only middleware — must be used AFTER authMiddleware.
 */
const adminOnly = (req, res, next) => {
  if (req.user && req.user.role && req.user.role.toLowerCase() === 'admin') {
    next();
  } else {
    res.status(403).json({ error: 'Access denied. Admin privileges required.' });
  }
};

/**
 * Maintenance mode gate — blocks non-admin users with 503 when maintenance is active.
 * Reads the maintenance_mode flag directly from the configurations table.
 * Must be used AFTER authMiddleware so req.user is available.
 */
const maintenanceGate = (pool) => {
  return async (req, res, next) => {
    try {
      // Admins always pass through
      if (req.user && req.user.role === 'admin') {
        return next();
      }

      const result = await pool.query(
        `SELECT value FROM configurations WHERE key = 'maintenance_mode'`
      );

      if (result.rows.length > 0 && result.rows[0].value === 'true') {
        return res.status(503).json({
          error: 'System is currently under maintenance. Please try again later.',
          maintenance: true
        });
      }

      next();
    } catch (error) {
      // If configurations table doesn't exist yet, let the request through
      console.error('Maintenance gate check failed:', error.message);
      next();
    }
  };
};

module.exports = { authMiddleware, adminOnly, maintenanceGate };
