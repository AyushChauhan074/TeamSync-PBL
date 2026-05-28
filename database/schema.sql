-- TeamSync PBL Database Schema

-- Users table (Students + Faculty + Admin)
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    roll_number VARCHAR(20) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(20) NOT NULL CHECK (role IN ('student', 'faculty', 'admin')),
    branch VARCHAR(50),
    year INTEGER,
    phone VARCHAR(15),
    github_username VARCHAR(50),
    bio TEXT,
    skills TEXT[],
    interests TEXT[],
    profile_image_url VARCHAR(255),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Teams table
CREATE TABLE teams (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    project_name VARCHAR(150),
    github_repo_url VARCHAR(255),
    description TEXT,
    code VARCHAR(10) UNIQUE NOT NULL,
    max_members INTEGER DEFAULT 4,
    current_members INTEGER DEFAULT 0,
    status VARCHAR(20) DEFAULT 'forming' CHECK (status IN ('forming', 'active', 'completed', 'inactive')),
    required_skills TEXT[],
    created_by INTEGER REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Team Members (Junction table)
CREATE TABLE team_members (
    id SERIAL PRIMARY KEY,
    team_id INTEGER REFERENCES teams(id) ON DELETE CASCADE,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    role VARCHAR(20) DEFAULT 'member' CHECK (role IN ('leader', 'member')),
    joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(team_id, user_id)
);

-- Team Requests
CREATE TABLE team_requests (
    id SERIAL PRIMARY KEY,
    team_id INTEGER REFERENCES teams(id) ON DELETE CASCADE,
    student_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(team_id, student_id)
);

-- Projects table
CREATE TABLE projects (
    id SERIAL PRIMARY KEY,
    title VARCHAR(200) NOT NULL,
    description TEXT,
    team_id INTEGER REFERENCES teams(id),
    github_repo_url VARCHAR(255),
    status VARCHAR(20) DEFAULT 'planning' CHECK (status IN ('planning', 'design', 'development', 'testing', 'completed')),
    progress INTEGER DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
    start_date DATE,
    due_date DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Contributions table (GitHub integration)
CREATE TABLE contributions (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    project_id INTEGER REFERENCES projects(id),
    contribution_type VARCHAR(20) CHECK (contribution_type IN ('commit', 'pull_request', 'issue', 'review')),
    title VARCHAR(255),
    description TEXT,
    github_url VARCHAR(255),
    additions INTEGER DEFAULT 0,
    deletions INTEGER DEFAULT 0,
    contribution_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert Students Data
INSERT INTO users (roll_number, name, email, password_hash, role, branch, year, phone, github_username, bio, skills, interests) VALUES
('230111589', 'Abhishek Giri', 'abhishek.giri@gehu.ac.in', '$2b$10$student123hash', 'student', 'Computer Science', 3, '+91 9876543210', 'AbhishekGiri04', 'Full-stack developer passionate about AI', ARRAY['React', 'Node.js', 'Python', 'Machine Learning'], ARRAY['Web Development', 'AI/ML', 'Open Source']),
('230111588', 'Deepali Chauhan', 'deepali.chauhan@gehu.ac.in', '$2b$10$student123hash', 'student', 'Computer Science', 3, '+91 9876543211', 'deepali88', 'Frontend developer with design skills', ARRAY['React', 'CSS', 'Figma', 'JavaScript'], ARRAY['UI/UX', 'Frontend', 'Design']),
('230111587', 'Sidh Khurana', 'sidh.khurana@gehu.ac.in', '$2b$10$student123hash', 'student', 'Computer Science', 3, '+91 9876543212', 'sidhkhurana', 'Backend developer interested in databases', ARRAY['Java', 'Spring Boot', 'MySQL', 'MongoDB'], ARRAY['Backend Development', 'Database Design']),
('230111586', 'Ayush Chauhan', 'ayush.chauhan@gehu.ac.in', '$2b$10$student123hash', 'student', 'Computer Science', 3, '+91 9876543213', 'ayushchauhan', 'Mobile app developer', ARRAY['Flutter', 'Dart', 'Firebase', 'Android'], ARRAY['Mobile Development', 'Cross-platform']),
('230111585', 'Abhay Kanojia', 'abhay.kanojia@gehu.ac.in', '$2b$10$student123hash', 'student', 'Computer Science', 3, '+91 9876543214', 'abhaykanojia', 'Data science enthusiast', ARRAY['Python', 'Pandas', 'NumPy', 'Scikit-learn'], ARRAY['Data Science', 'Machine Learning']),
('230111584', 'Harsh Rawat', 'harsh.rawat@gehu.ac.in', '$2b$10$student123hash', 'student', 'Computer Science', 3, '+91 9876543215', 'harshrawat', 'DevOps and cloud computing specialist', ARRAY['Docker', 'Kubernetes', 'AWS', 'Jenkins'], ARRAY['DevOps', 'Cloud Computing']),
('230111583', 'Ayush Chamoli', 'ayush.chamoli@gehu.ac.in', '$2b$10$student123hash', 'student', 'Computer Science', 3, '+91 9876543216', 'ayushchamoli', 'Cybersecurity focused developer', ARRAY['Python', 'Ethical Hacking', 'Network Security'], ARRAY['Cybersecurity', 'Penetration Testing']),
('230111582', 'Ayush Bhatt', 'ayush.bhatt@gehu.ac.in', '$2b$10$student123hash', 'student', 'Computer Science', 3, '+91 9876543217', 'ayushbhatt', 'Game developer and graphics programmer', ARRAY['Unity', 'C#', 'Blender', 'OpenGL'], ARRAY['Game Development', '3D Graphics']),
('230111581', 'Muskan Sharma', 'muskan.sharma@gehu.ac.in', '$2b$10$student123hash', 'student', 'Computer Science', 3, '+91 9876543218', 'muskansharma', 'AI/ML researcher', ARRAY['Python', 'TensorFlow', 'PyTorch', 'OpenCV'], ARRAY['Artificial Intelligence', 'Computer Vision']),
('230111580', 'Kashish Sharma', 'kashish.sharma@gehu.ac.in', '$2b$10$student123hash', 'student', 'Computer Science', 3, '+91 9876543219', 'kashishsharma', 'Web designer and developer', ARRAY['HTML', 'CSS', 'JavaScript', 'Adobe XD'], ARRAY['Web Design', 'User Experience']),
('230111579', 'Harsh Pal', 'harsh.pal@gehu.ac.in', '$2b$10$student123hash', 'student', 'Computer Science', 3, '+91 9876543220', 'harshpal', 'Software testing and quality assurance', ARRAY['Selenium', 'TestNG', 'JUnit', 'Postman'], ARRAY['Software Testing', 'Quality Assurance']),
('230111578', 'Sachin Bisht', 'sachin.bisht@gehu.ac.in', '$2b$10$student123hash', 'student', 'Computer Science', 3, '+91 9876543221', 'sachinbisht', 'Blockchain and cryptocurrency developer', ARRAY['Solidity', 'Web3.js', 'Ethereum', 'Smart Contracts'], ARRAY['Blockchain', 'Cryptocurrency']);

-- Insert Faculty Data
INSERT INTO users (roll_number, name, email, password_hash, role, branch, year, phone, github_username, bio, skills, interests) VALUES
('234555999', 'Sushant Chamoli', 'sushant.chamoli@gehu.ac.in', '$2b$10$student123hash', 'faculty', 'Computer Science', NULL, '+91 9876543222', 'sushantchamoli', 'Professor of Computer Science specializing in AI and Machine Learning', ARRAY['Python', 'Machine Learning', 'Deep Learning', 'Research'], ARRAY['Artificial Intelligence', 'Research', 'Teaching']),
('234555998', 'Amit Gupta', 'amit.gupta@gehu.ac.in', '$2b$10$student123hash', 'faculty', 'Computer Science', NULL, '+91 9876543223', 'amitgupta', 'Associate Professor in Software Engineering and Database Systems', ARRAY['Java', 'Database Design', 'Software Engineering', 'System Design'], ARRAY['Software Engineering', 'Database Systems', 'Mentoring']),
('234555997', 'Ashok Kumar', 'ashok.kumar@gehu.ac.in', '$2b$10$student123hash', 'faculty', 'Computer Science', NULL, '+91 9876543224', 'ashokkumar', 'Senior Professor in Computer Networks and Cybersecurity', ARRAY['Network Security', 'Cybersecurity', 'Computer Networks', 'Cryptography'], ARRAY['Network Security', 'Research', 'Academic Leadership']);

-- Insert Admin Data
INSERT INTO users (roll_number, name, email, password_hash, role, branch, year, phone, github_username, bio, skills, interests) VALUES
('ADMIN001', 'Admin', 'admin@gehu.ac.in', '$2b$10$admin@123hash', 'admin', 'Administration', NULL, '+91 9876543225', 'admin', 'System Administrator for TeamSync PBL Platform', ARRAY['System Administration', 'Database Management', 'User Management'], ARRAY['System Management', 'Platform Administration']);

-- Sample Teams
INSERT INTO teams (name, description, max_members, current_members, status, required_skills, created_by) VALUES
('AI Research Team', 'Working on machine learning algorithms for academic projects', 6, 4, 'active', ARRAY['Python', 'TensorFlow', 'Data Science'], 1),
('Web Development Squad', 'Building modern web applications with React and Node.js', 5, 3, 'forming', ARRAY['React', 'Node.js', 'MongoDB'], 2),
('Mobile App Innovators', 'Creating cross-platform mobile applications', 4, 2, 'forming', ARRAY['Flutter', 'React Native', 'Firebase'], 4);

-- Sample Team Members
INSERT INTO team_members (team_id, user_id, role) VALUES
(1, 1, 'leader'),
(1, 9, 'member'),
(1, 5, 'member'),
(2, 2, 'leader'),
(2, 10, 'member'),
(3, 4, 'leader'),
(3, 8, 'member');

-- Sample Projects
INSERT INTO projects (title, description, team_id, status, progress, due_date) VALUES
('Smart Campus Management System', 'A comprehensive system for managing campus resources and student activities', 1, 'development', 65, '2024-03-15'),
('E-Learning Platform', 'Interactive online learning platform with video streaming and assessments', 2, 'design', 30, '2024-04-20'),
('Campus Navigation App', 'Mobile app for navigating the campus with AR features', 3, 'planning', 10, '2024-05-10');

-- Indexes for better performance
CREATE INDEX idx_users_roll_number ON users(roll_number);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_team_members_team_id ON team_members(team_id);
CREATE INDEX idx_team_members_user_id ON team_members(user_id);
CREATE INDEX idx_contributions_user_id ON contributions(user_id);
CREATE INDEX idx_contributions_project_id ON contributions(project_id);-- Chat Messages Table
CREATE TABLE team_messages (
    id SERIAL PRIMARY KEY,
    team_id INTEGER REFERENCES teams(id) ON DELETE CASCADE,
    sender_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    message_text TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_team_messages_team_id ON team_messages(team_id);

-- Messages archive for Team Room Chat
CREATE TABLE IF NOT EXISTS messages (
    id SERIAL PRIMARY KEY,
    team_id INTEGER REFERENCES teams(id) ON DELETE CASCADE,
    sender_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    message_text TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
