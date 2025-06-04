-- Migration: Rollback initial tables for TeleAI Pro
-- Version: 001
-- Description: Drops all tables and custom types created in the up migration

BEGIN;

-- Drop views first
DROP VIEW IF EXISTS user_file_stats;
DROP MATERIALIZED VIEW IF EXISTS daily_usage_stats;

-- Drop triggers
DROP TRIGGER IF EXISTS update_users_updated_at ON users;
DROP TRIGGER IF EXISTS update_sessions_updated_at ON sessions;
DROP TRIGGER IF EXISTS update_audio_files_updated_at ON audio_files;
DROP TRIGGER IF EXISTS update_transcriptions_updated_at ON transcriptions;
DROP TRIGGER IF EXISTS update_analyses_updated_at ON analyses;

-- Drop function
DROP FUNCTION IF EXISTS update_updated_at_column();

-- Drop tables in reverse order of dependencies
DROP TABLE IF EXISTS analyses;
DROP TABLE IF EXISTS transcriptions;
DROP TABLE IF EXISTS audio_files;
DROP TABLE IF EXISTS sessions;
DROP TABLE IF EXISTS users;

-- Drop custom types
DROP TYPE IF EXISTS user_role;
DROP TYPE IF EXISTS analysis_status;
DROP TYPE IF EXISTS transcription_status;
DROP TYPE IF EXISTS audio_file_status;

COMMIT;