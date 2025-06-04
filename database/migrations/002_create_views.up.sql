-- Migration: Create views and materialized views
-- Version: 002
-- Description: Creates views for common queries and performance analytics

BEGIN;

-- Create view for user file statistics
CREATE OR REPLACE VIEW user_file_stats AS
SELECT 
    u.id as user_id,
    u.email,
    u.full_name,
    COUNT(DISTINCT af.id) as total_files,
    COUNT(DISTINCT t.id) as total_transcriptions,
    COUNT(DISTINCT a.id) as total_analyses,
    COALESCE(SUM(af.file_size_bytes), 0) as total_storage_bytes,
    COALESCE(SUM(af.duration_seconds), 0) as total_duration_seconds,
    MAX(af.created_at) as last_upload_at
FROM users u
LEFT JOIN audio_files af ON u.id = af.user_id
LEFT JOIN transcriptions t ON u.id = t.user_id
LEFT JOIN analyses a ON u.id = a.user_id
GROUP BY u.id, u.email, u.full_name;

-- Create materialized view for daily usage statistics
CREATE MATERIALIZED VIEW IF NOT EXISTS daily_usage_stats AS
SELECT 
    DATE(created_at) as date,
    COUNT(DISTINCT user_id) as active_users,
    COUNT(*) as total_uploads,
    SUM(file_size_bytes) as total_bytes_uploaded,
    SUM(duration_seconds) as total_audio_seconds,
    AVG(duration_seconds) as avg_audio_duration
FROM audio_files
WHERE status = 'ready'
GROUP BY DATE(created_at);

-- Create index on materialized view
CREATE INDEX IF NOT EXISTS idx_daily_usage_stats_date ON daily_usage_stats(date);

-- Create view for recent user activity
CREATE OR REPLACE VIEW recent_user_activity AS
SELECT 
    u.id as user_id,
    u.email,
    u.full_name,
    'audio_upload' as activity_type,
    af.id as resource_id,
    af.file_name as resource_name,
    af.created_at as activity_timestamp
FROM users u
JOIN audio_files af ON u.id = af.user_id
UNION ALL
SELECT 
    u.id as user_id,
    u.email,
    u.full_name,
    'transcription' as activity_type,
    t.id as resource_id,
    'Transcription ' || t.id as resource_name,
    t.created_at as activity_timestamp
FROM users u
JOIN transcriptions t ON u.id = t.user_id
UNION ALL
SELECT 
    u.id as user_id,
    u.email,
    u.full_name,
    'analysis' as activity_type,
    a.id as resource_id,
    a.analysis_type as resource_name,
    a.created_at as activity_timestamp
FROM users u
JOIN analyses a ON u.id = a.user_id
ORDER BY activity_timestamp DESC;

-- Create view for processing queue status
CREATE OR REPLACE VIEW processing_queue_status AS
SELECT 
    'audio_files' as queue_type,
    status,
    COUNT(*) as count,
    MIN(created_at) as oldest_item,
    MAX(created_at) as newest_item
FROM audio_files
WHERE status IN ('uploaded', 'processing')
GROUP BY status
UNION ALL
SELECT 
    'transcriptions' as queue_type,
    status,
    COUNT(*) as count,
    MIN(created_at) as oldest_item,
    MAX(created_at) as newest_item
FROM transcriptions
WHERE status IN ('pending', 'processing')
GROUP BY status
UNION ALL
SELECT 
    'analyses' as queue_type,
    status,
    COUNT(*) as count,
    MIN(created_at) as oldest_item,
    MAX(created_at) as newest_item
FROM analyses
WHERE status IN ('pending', 'processing')
GROUP BY status;

-- Create view for file processing pipeline status
CREATE OR REPLACE VIEW file_processing_pipeline AS
SELECT 
    af.id as audio_file_id,
    af.user_id,
    af.file_name,
    af.status as audio_status,
    af.created_at as audio_uploaded_at,
    t.id as transcription_id,
    t.status as transcription_status,
    t.created_at as transcription_created_at,
    a.id as analysis_id,
    a.status as analysis_status,
    a.analysis_type,
    a.created_at as analysis_created_at,
    CASE 
        WHEN af.status = 'error' THEN 'failed'
        WHEN t.status = 'failed' THEN 'failed'
        WHEN a.status = 'failed' THEN 'failed'
        WHEN a.status = 'completed' THEN 'completed'
        WHEN a.status IN ('pending', 'processing') THEN 'analysis_in_progress'
        WHEN t.status = 'completed' THEN 'transcription_completed'
        WHEN t.status IN ('pending', 'processing') THEN 'transcription_in_progress'
        WHEN af.status = 'ready' THEN 'audio_ready'
        WHEN af.status = 'processing' THEN 'audio_processing'
        ELSE 'uploaded'
    END as pipeline_status
FROM audio_files af
LEFT JOIN transcriptions t ON af.id = t.audio_file_id
LEFT JOIN analyses a ON t.id = a.transcription_id;

COMMIT;