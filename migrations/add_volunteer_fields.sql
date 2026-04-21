-- Add specialization field to volunteers table
ALTER TABLE volunteers
ADD COLUMN specialization VARCHAR(100) NULL;

-- Add default specializations for existing volunteers
UPDATE volunteers 
SET specialization = 'General Assistance'
WHERE specialization IS NULL; 