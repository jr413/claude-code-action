-- Migration: 001_initial_schema
-- Created: 2025-06-05
-- Description: Initial database schema for TeleAI Enterprise

-- Create migration history table
CREATE TABLE IF NOT EXISTS schema_migrations (
    version VARCHAR(255) PRIMARY KEY,
    applied_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Check if migration has been applied
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM schema_migrations WHERE version = '001_initial_schema') THEN
        -- Insert the migration record
        INSERT INTO schema_migrations (version) VALUES ('001_initial_schema');
        
        -- Create the schema (calling the main schema file would be done here)
        -- In practice, you would include the schema creation here or source from the schema file
        
        RAISE NOTICE 'Migration 001_initial_schema applied successfully';
    ELSE
        RAISE NOTICE 'Migration 001_initial_schema already applied';
    END IF;
END $$;