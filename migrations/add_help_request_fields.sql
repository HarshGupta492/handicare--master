-- Add time tracking columns to help_requests table
ALTER TABLE help_requests
ADD COLUMN start_time DATETIME NULL,
ADD COLUMN end_time DATETIME NULL,
ADD COLUMN completed_at DATETIME NULL,
ADD COLUMN updated_at DATETIME NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP;

-- Update existing completed requests with default values
UPDATE help_requests 
SET start_time = created_at,
    end_time = DATE_ADD(created_at, INTERVAL duration HOUR),
    completed_at = DATE_ADD(created_at, INTERVAL duration HOUR),
    updated_at = CURRENT_TIMESTAMP
WHERE status = 'completed' 
AND start_time IS NULL; 