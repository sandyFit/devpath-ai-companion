-- Migration script to add FILENAME and LANGUAGE columns to ANALYSES table
-- This script adds the missing columns needed for displaying filenames in the frontend

USE DATABASE DEVPATH_AI;
USE SCHEMA MAIN;

-- Add FILENAME column to ANALYSES table
ALTER TABLE ANALYSES ADD COLUMN IF NOT EXISTS FILENAME VARCHAR(1000);

-- Add LANGUAGE column to ANALYSES table  
ALTER TABLE ANALYSES ADD COLUMN IF NOT EXISTS LANGUAGE VARCHAR(50);

-- Add PROJECT_ID column to ANALYSES table for direct project queries
ALTER TABLE ANALYSES ADD COLUMN IF NOT EXISTS PROJECT_ID VARCHAR(36);

-- Add comments to the new columns
COMMENT ON COLUMN ANALYSES.FILENAME IS 'Original filename of the analyzed code file';
COMMENT ON COLUMN ANALYSES.LANGUAGE IS 'Programming language of the analyzed file';
COMMENT ON COLUMN ANALYSES.PROJECT_ID IS 'Direct reference to project for faster queries';

-- Create index on PROJECT_ID for better query performance
CREATE INDEX IF NOT EXISTS IDX_ANALYSES_PROJECT_ID ON ANALYSES(PROJECT_ID);

-- Create index on FILENAME for searching
CREATE INDEX IF NOT EXISTS IDX_ANALYSES_FILENAME ON ANALYSES(FILENAME);

-- Show the updated table structure
DESCRIBE TABLE ANALYSES;

-- Verify the changes
SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE, COMMENT 
FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_SCHEMA = 'MAIN' 
AND TABLE_NAME = 'ANALYSES'
ORDER BY ORDINAL_POSITION;
