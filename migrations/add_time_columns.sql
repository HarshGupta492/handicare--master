-- Add time columns to help_requests table
ALTER TABLE help_requests
ADD COLUMN start_time DATETIME NULL,
ADD COLUMN end_time DATETIME NULL;

-- Update existing completed requests with default values
UPDATE help_requests 
SET start_time = created_at,
    end_time = DATE_ADD(created_at, INTERVAL 2 HOUR)
WHERE status = 'completed' 
AND start_time IS NULL 
AND end_time IS NULL; 