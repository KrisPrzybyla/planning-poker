-- Planning Poker Database Schema
-- MySQL/MariaDB compatible

CREATE DATABASE IF NOT EXISTS planning_poker;
USE planning_poker;

-- Rooms table
CREATE TABLE rooms (
    id VARCHAR(6) PRIMARY KEY,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT TRUE,
    voting_count INT DEFAULT 0,
    current_story_id VARCHAR(36) NULL,
    is_voting_active BOOLEAN DEFAULT FALSE,
    is_results_visible BOOLEAN DEFAULT FALSE
);

-- Users table
CREATE TABLE users (
    id VARCHAR(36) PRIMARY KEY,
    room_id VARCHAR(6) NOT NULL,
    name VARCHAR(100) NOT NULL,
    role ENUM('Scrum Master', 'Participant', 'Temporary Scrum Master', 'Displaced Scrum Master') DEFAULT 'Participant',
    is_connected BOOLEAN DEFAULT TRUE,
    connected_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    disconnected_at TIMESTAMP NULL,
    FOREIGN KEY (room_id) REFERENCES rooms(id) ON DELETE CASCADE,
    INDEX idx_room_users (room_id, is_connected)
);

-- Stories table
CREATE TABLE stories (
    id VARCHAR(36) PRIMARY KEY,
    room_id VARCHAR(6) NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    voting_started_at TIMESTAMP NULL,
    voting_ended_at TIMESTAMP NULL,
    average_vote DECIMAL(4,2) NULL,
    consensus_reached BOOLEAN DEFAULT FALSE,
    FOREIGN KEY (room_id) REFERENCES rooms(id) ON DELETE CASCADE,
    INDEX idx_room_stories (room_id, created_at)
);

-- Votes table
CREATE TABLE votes (
    id VARCHAR(36) PRIMARY KEY,
    story_id VARCHAR(36) NOT NULL,
    user_id VARCHAR(36) NOT NULL,
    vote_value VARCHAR(10) NOT NULL, -- '1', '2', '3', '5', '8', '13', '21', '?', '☕'
    voted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (story_id) REFERENCES stories(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE KEY unique_user_story_vote (story_id, user_id),
    INDEX idx_story_votes (story_id, voted_at)
);

-- Session analytics table
CREATE TABLE session_analytics (
    id INT AUTO_INCREMENT PRIMARY KEY,
    room_id VARCHAR(6) NOT NULL,
    session_date DATE NOT NULL,
    total_users INT DEFAULT 0,
    total_stories INT DEFAULT 0,
    total_votes INT DEFAULT 0,
    session_duration_minutes INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (room_id) REFERENCES rooms(id) ON DELETE CASCADE,
    UNIQUE KEY unique_room_date (room_id, session_date)
);

-- Views for common queries
CREATE VIEW active_rooms AS
SELECT 
    r.*,
    COUNT(DISTINCT u.id) as user_count,
    COUNT(DISTINCT s.id) as story_count
FROM rooms r
LEFT JOIN users u ON r.id = u.room_id AND u.is_connected = TRUE
LEFT JOIN stories s ON r.id = s.room_id
WHERE r.is_active = TRUE
GROUP BY r.id;

CREATE VIEW voting_statistics AS
SELECT 
    s.id as story_id,
    s.title,
    s.room_id,
    COUNT(v.id) as total_votes,
    AVG(CAST(v.vote_value AS DECIMAL)) as average_vote,
    MIN(v.vote_value) as min_vote,
    MAX(v.vote_value) as max_vote,
    GROUP_CONCAT(DISTINCT v.vote_value ORDER BY v.vote_value) as all_votes
FROM stories s
LEFT JOIN votes v ON s.id = v.story_id
WHERE v.vote_value REGEXP '^[0-9]+$' -- Only numeric votes for average
GROUP BY s.id;

-- Indexes for performance
CREATE INDEX idx_rooms_active ON rooms(is_active, created_at);
CREATE INDEX idx_users_connection ON users(is_connected, disconnected_at);
CREATE INDEX idx_votes_value ON votes(vote_value, voted_at);

-- Sample data for testing
INSERT INTO rooms (id, voting_count) VALUES 
('TEST01', 0),
('DEMO02', 2);

INSERT INTO users (id, room_id, name, role) VALUES 
('user-1', 'TEST01', 'John Doe', 'Scrum Master'),
('user-2', 'TEST01', 'Jane Smith', 'Participant'),
('user-3', 'DEMO02', 'Bob Wilson', 'Scrum Master');

INSERT INTO stories (id, room_id, title, description) VALUES 
('story-1', 'TEST01', 'User Authentication', 'Implement login and registration system'),
('story-2', 'DEMO02', 'Database Migration', 'Migrate from in-memory to MySQL storage');