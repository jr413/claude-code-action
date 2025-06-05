-- Migration: 001_initial_schema
-- Description: Rollback initial database schema for TeleAI Pro
-- Created: 2025-06-04
-- Direction: DOWN

-- Drop views
DROP VIEW IF EXISTS user_activity_summary;
DROP MATERIALIZED VIEW IF EXISTS file_processing_analytics;

-- Drop triggers
DROP TRIGGER IF EXISTS manage_latest_transcription ON transcriptions;
DROP TRIGGER IF EXISTS update_audio_files_updated_at ON audio_files;
DROP TRIGGER IF EXISTS update_users_updated_at ON users;

-- Drop functions
DROP FUNCTION IF EXISTS ensure_single_latest_transcription();
DROP FUNCTION IF EXISTS update_updated_at_column();

-- Drop tables in reverse dependency order
DROP TABLE IF EXISTS analyses;
DROP TABLE IF EXISTS transcriptions;
DROP TABLE IF EXISTS audio_files;
DROP TABLE IF EXISTS sessions;
DROP TABLE IF EXISTS users;

-- Drop custom types
DROP TYPE IF EXISTS file_format;
DROP TYPE IF EXISTS analysis_type;
DROP TYPE IF EXISTS file_status;
DROP TYPE IF EXISTS user_role;

-- Note: We don't drop extensions as they might be used by other schemas

-- Remove migration record
DELETE FROM schema_migrations WHERE version = '001_initial_schema';