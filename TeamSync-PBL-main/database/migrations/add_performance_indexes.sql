-- Add performance indexes for faster queries
-- Run: psql -d teamsync_pbl -f database/migrations/add_performance_indexes.sql

CREATE INDEX IF NOT EXISTS idx_users_is_active ON users(is_active);
CREATE INDEX IF NOT EXISTS idx_users_role_active ON users(role, is_active);
CREATE INDEX IF NOT EXISTS idx_users_name ON users(name);
CREATE INDEX IF NOT EXISTS idx_teams_status ON teams(status);

ANALYZE users;
ANALYZE teams;
ANALYZE team_members;
ANALYZE contributions;
