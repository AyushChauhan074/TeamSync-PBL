const logActivity = async (pool, userId, actionType, description) => {
  try {
    const query = `
      INSERT INTO activities (user_id, action_type, description) 
      VALUES ($1, $2, $3)
    `;
    await pool.query(query, [userId, actionType, description]);
  } catch (error) {
    console.error('Failed to log activity:', error);
  }
};

module.exports = { logActivity };
