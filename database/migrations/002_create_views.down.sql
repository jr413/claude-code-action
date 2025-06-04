-- Migration: Drop views and materialized views
-- Version: 002
-- Description: Drops all views created in the up migration

BEGIN;

-- Drop regular views
DROP VIEW IF EXISTS file_processing_pipeline;
DROP VIEW IF EXISTS processing_queue_status;
DROP VIEW IF EXISTS recent_user_activity;
DROP VIEW IF EXISTS user_file_stats;

-- Drop materialized views
DROP MATERIALIZED VIEW IF EXISTS daily_usage_stats;

COMMIT;