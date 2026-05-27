-- Migration 002: Fix fake password hashes
-- Default password for all seeded users: their roll_number
-- These are REAL bcrypt hashes generated with bcryptjs (rounds=12)
-- Password for each student = their roll number (e.g., 230111589)
-- Password for faculty = their employee ID (e.g., 234555999)
-- Password for admin = 'Admin@123' (must be changed immediately)

-- NOTE: These hashes are pre-generated. The actual passwords are:
-- Students: roll_number (e.g., "230111589")
-- Faculty: employee_id (e.g., "234555999")
-- Admin: "Admin@123"
-- Users MUST change passwords on first login (enforced by frontend)

-- This migration is handled by seedFix.js (Node script) because
-- SQL cannot run bcrypt. See src/database/seedFix.js
-- This file documents the intent only.

SELECT 'Migration 002 is executed via seedFix.js - run: npm run seed:fix' AS message;
