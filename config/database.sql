-- Create database if not exists
CREATE DATABASE IF NOT EXISTS handicare;
USE handicare;

-- Users table
CREATE TABLE IF NOT EXISTS users (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    phone VARCHAR(20),
    address TEXT,
    disability VARCHAR(100),
    profile_image VARCHAR(255),
    status ENUM('active', 'inactive', 'blocked') DEFAULT 'active',
    last_login DATETIME,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Volunteers table
CREATE TABLE IF NOT EXISTS volunteers (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    phone VARCHAR(20),
    address TEXT,
    skills JSON,
    availability JSON,
    service_radius INT DEFAULT 10,
    status ENUM('active', 'inactive', 'pending', 'blocked') DEFAULT 'pending',
    rating DECIMAL(3,2) DEFAULT 0,
    total_ratings INT DEFAULT 0,
    completed_tasks INT DEFAULT 0,
    profile_image VARCHAR(255),
    verification_documents JSON,
    verification_status ENUM('pending', 'verified', 'rejected') DEFAULT 'pending',
    last_login DATETIME,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Admins table
CREATE TABLE IF NOT EXISTS admins (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    role ENUM('super_admin', 'admin', 'moderator') DEFAULT 'admin',
    status ENUM('active', 'inactive') DEFAULT 'active',
    last_login DATETIME,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Help Requests table
CREATE TABLE IF NOT EXISTS help_requests (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    volunteer_id INT,
    title VARCHAR(255) NOT NULL,
    type VARCHAR(50) NOT NULL,
    date DATE NOT NULL,
    time TIME NOT NULL,
    duration INT, -- in minutes
    location TEXT,
    description TEXT,
    is_urgent BOOLEAN DEFAULT FALSE,
    status ENUM('pending', 'accepted', 'completed', 'cancelled', 'expired') DEFAULT 'pending',
    start_time DATETIME,
    end_time DATETIME,
    completion_notes TEXT,
    cancellation_reason TEXT,
    payment_status ENUM('pending', 'completed', 'refunded') DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (volunteer_id) REFERENCES volunteers(id)
);

-- Feedback table
CREATE TABLE IF NOT EXISTS feedback (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT,
    volunteer_id INT,
    help_request_id INT,
    rating INT CHECK (rating BETWEEN 1 AND 5),
    comment TEXT,
    response TEXT, -- Volunteer's response to feedback
    is_public BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (volunteer_id) REFERENCES volunteers(id),
    FOREIGN KEY (help_request_id) REFERENCES help_requests(id)
);

-- Emergency Contacts table
CREATE TABLE IF NOT EXISTS emergency_contacts (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    name VARCHAR(100) NOT NULL,
    relationship VARCHAR(50),
    phone VARCHAR(20) NOT NULL,
    email VARCHAR(100),
    is_primary BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Messages table
CREATE TABLE IF NOT EXISTS messages (
    id INT PRIMARY KEY AUTO_INCREMENT,
    sender_id INT NOT NULL,
    receiver_id INT NOT NULL,
    help_request_id INT,
    message TEXT NOT NULL,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (help_request_id) REFERENCES help_requests(id)
);

-- Notifications table
CREATE TABLE IF NOT EXISTS notifications (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    type VARCHAR(50) NOT NULL,
    is_read BOOLEAN DEFAULT FALSE,
    related_id INT, -- ID of related entity (help request, message, etc.)
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
);

-- User Settings table
CREATE TABLE IF NOT EXISTS user_settings (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    notification_email BOOLEAN DEFAULT TRUE,
    notification_sms BOOLEAN DEFAULT TRUE,
    notification_web BOOLEAN DEFAULT TRUE,
    language VARCHAR(10) DEFAULT 'en',
    theme VARCHAR(20) DEFAULT 'light',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Reports table
CREATE TABLE IF NOT EXISTS reports (
    id INT PRIMARY KEY AUTO_INCREMENT,
    reporter_id INT NOT NULL,
    reported_id INT NOT NULL,
    help_request_id INT,
    type VARCHAR(50) NOT NULL,
    description TEXT NOT NULL,
    status ENUM('pending', 'investigating', 'resolved', 'dismissed') DEFAULT 'pending',
    resolution_notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (help_request_id) REFERENCES help_requests(id)
);

-- Insert sample admin
INSERT INTO admins (name, email, password, role) VALUES
('Admin User', 'admin@handicare.org', '$2a$10$YourHashedPasswordHere', 'super_admin');

-- Insert sample users
INSERT INTO users (name, email, password, phone, address, disability) VALUES
('John Doe', 'john.doe@example.com', '$2a$10$YourHashedPasswordHere', '123-456-7890', '123 Main St, City', 'Mobility Impairment'),
('Jane Smith', 'jane.smith@example.com', '$2a$10$YourHashedPasswordHere', '987-654-3210', '456 Oak St, City', 'Visual Impairment');

-- Insert sample volunteers
INSERT INTO volunteers (name, email, password, phone, address, skills, availability, service_radius, status) VALUES
('Sarah Johnson', 'sarah.j@example.com', '$2a$10$YourHashedPasswordHere', '555-123-4567', '789 Pine St, City', 
'["driving", "shopping", "companionship"]', 
'["weekday-morning", "weekday-evening", "weekend-morning"]', 
15, 'active'),
('Mike Wilson', 'mike.w@example.com', '$2a$10$YourHashedPasswordHere', '555-987-6543', '321 Elm St, City', 
'["medical", "housework", "shopping"]', 
'["weekday-afternoon", "weekend-afternoon"]', 
10, 'active');

-- Insert sample help requests
INSERT INTO help_requests (user_id, volunteer_id, title, type, date, time, duration, location, description, is_urgent, status) VALUES
(1, 1, 'Grocery Shopping Assistance', 'shopping', CURDATE(), '10:00:00', 120, '123 Main St, City', 'Need help with weekly grocery shopping', FALSE, 'completed'),
(2, 1, 'Doctor Appointment', 'medical', CURDATE() + INTERVAL 1 DAY, '14:00:00', 180, '456 Health Ave, City', 'Need transportation to doctor appointment', TRUE, 'accepted'),
(1, 2, 'House Cleaning', 'housework', CURDATE() - INTERVAL 1 DAY, '13:00:00', 120, '123 Main St, City', 'Need help with cleaning apartment', FALSE, 'completed');

-- Insert sample feedback
INSERT INTO feedback (user_id, volunteer_id, help_request_id, rating, comment) VALUES
(1, 1, 1, 5, 'Sarah was extremely helpful and professional'),
(2, 1, 2, 4, 'Great service, very punctual'),
(1, 2, 3, 5, 'Mike did an excellent job with the cleaning');

-- Insert sample emergency contacts
INSERT INTO emergency_contacts (user_id, name, relationship, phone, email, is_primary) VALUES
(1, 'Mary Doe', 'Spouse', '555-111-2222', 'mary.doe@example.com', TRUE),
(2, 'Bob Smith', 'Brother', '555-333-4444', 'bob.smith@example.com', TRUE);

-- Insert sample user settings
INSERT INTO user_settings (user_id, notification_email, notification_sms, notification_web) VALUES
(1, TRUE, TRUE, TRUE),
(2, TRUE, FALSE, TRUE); 