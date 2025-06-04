-- TeleAI Pro Sample Queries
-- Common query patterns for the application

-- ============================================
-- User Management Queries
-- ============================================

-- Create a new user
INSERT INTO users (email, password_hash, full_name, role) 
VALUES ('user@example.com', '$2b$10$...', 'John Doe', 'user')
RETURNING *;

-- Find user by email
SELECT * FROM users WHERE email = 'user@example.com';

-- Update last login
UPDATE users 
SET last_login_at = CURRENT_TIMESTAMP 
WHERE id = '123e4567-e89b-12d3-a456-426614174000';

-- Get active admin users
SELECT * FROM users 
WHERE role = 'admin' AND is_active = true 
ORDER BY created_at DESC;

-- ============================================
-- Session Management Queries
-- ============================================

-- Create new session
INSERT INTO sessions (user_id, token_hash, ip_address, user_agent, expires_at)
VALUES (
    '123e4567-e89b-12d3-a456-426614174000',
    '$2b$10$...',
    '192.168.1.1'::inet,
    'Mozilla/5.0...',
    CURRENT_TIMESTAMP + INTERVAL '7 days'
)
RETURNING *;

-- Validate session
SELECT s.*, u.* 
FROM sessions s
JOIN users u ON s.user_id = u.id
WHERE s.token_hash = '$2b$10$...'
  AND s.expires_at > CURRENT_TIMESTAMP
  AND u.is_active = true;

-- Clean up expired sessions
DELETE FROM sessions WHERE expires_at < CURRENT_TIMESTAMP;

-- ============================================
-- Audio File Queries
-- ============================================

-- Insert new audio file
INSERT INTO audio_files (
    user_id, file_name, file_path, file_size_bytes, 
    mime_type, status, metadata
) VALUES (
    '123e4567-e89b-12d3-a456-426614174000',
    'interview_001.mp3',
    '/uploads/2025/06/04/abc123.mp3',
    5242880,
    'audio/mpeg',
    'uploaded',
    '{"source": "web_upload", "client": "chrome"}'::jsonb
)
RETURNING *;

-- Get user's recent uploads
SELECT * FROM audio_files 
WHERE user_id = '123e4567-e89b-12d3-a456-426614174000'
  AND status != 'error'
ORDER BY created_at DESC 
LIMIT 10;

-- Update file processing status
UPDATE audio_files 
SET 
    status = 'processing',
    processing_started_at = CURRENT_TIMESTAMP
WHERE id = 'file-uuid'
  AND status = 'uploaded';

-- Get files pending processing
SELECT * FROM audio_files 
WHERE status = 'uploaded'
ORDER BY created_at ASC
LIMIT 100;

-- Files by size and duration
SELECT 
    COUNT(*) as file_count,
    SUM(file_size_bytes) as total_bytes,
    AVG(file_size_bytes) as avg_bytes,
    SUM(duration_seconds) as total_duration,
    AVG(duration_seconds) as avg_duration
FROM audio_files
WHERE user_id = '123e4567-e89b-12d3-a456-426614174000'
  AND status = 'ready';

-- ============================================
-- Transcription Queries
-- ============================================

-- Create transcription
INSERT INTO transcriptions (
    audio_file_id, user_id, transcription_text, 
    language_code, confidence_score, word_count,
    status, engine, engine_version
) VALUES (
    'audio-file-uuid',
    '123e4567-e89b-12d3-a456-426614174000',
    'This is the transcribed text...',
    'en-US',
    0.95,
    150,
    'completed',
    'whisper',
    'v3'
)
RETURNING *;

-- Full-text search in transcriptions
SELECT 
    t.*,
    af.file_name,
    ts_rank(to_tsvector('english', t.transcription_text), query) as rank
FROM transcriptions t
JOIN audio_files af ON t.audio_file_id = af.id
CROSS JOIN plainto_tsquery('english', 'meeting budget') query
WHERE to_tsvector('english', t.transcription_text) @@ query
  AND t.user_id = '123e4567-e89b-12d3-a456-426614174000'
ORDER BY rank DESC
LIMIT 20;

-- Get transcriptions by language
SELECT 
    language_code,
    COUNT(*) as count,
    AVG(confidence_score) as avg_confidence,
    AVG(word_count) as avg_word_count
FROM transcriptions
WHERE user_id = '123e4567-e89b-12d3-a456-426614174000'
GROUP BY language_code
ORDER BY count DESC;

-- ============================================
-- Analysis Queries
-- ============================================

-- Create analysis with all fields
INSERT INTO analyses (
    transcription_id, audio_file_id, user_id,
    analysis_type, sentiment_score, sentiment_label,
    key_phrases, entities, topics, summary,
    insights, status, engine, engine_version
) VALUES (
    'transcription-uuid',
    'audio-file-uuid',
    '123e4567-e89b-12d3-a456-426614174000',
    'comprehensive',
    0.75,
    'positive',
    ARRAY['quarterly results', 'growth strategy', 'market expansion'],
    '[{"text": "Q3 2025", "type": "DATE", "confidence": 0.98}]'::jsonb,
    '[{"topic": "business", "confidence": 0.85, "keywords": ["revenue", "growth"]}]'::jsonb,
    'The meeting discussed positive Q3 results...',
    '{"action_items": ["Review Q4 projections", "Schedule follow-up"]}'::jsonb,
    'completed',
    'gpt-4',
    '2025-01'
)
RETURNING *;

-- Get sentiment distribution
SELECT 
    sentiment_label,
    COUNT(*) as count,
    AVG(sentiment_score) as avg_score
FROM analyses
WHERE user_id = '123e4567-e89b-12d3-a456-426614174000'
  AND sentiment_label IS NOT NULL
GROUP BY sentiment_label;

-- Find analyses with specific entities
SELECT a.*, t.transcription_text 
FROM analyses a
JOIN transcriptions t ON a.transcription_id = t.id
WHERE a.user_id = '123e4567-e89b-12d3-a456-426614174000'
  AND a.entities @> '[{"type": "PERSON"}]'::jsonb
ORDER BY a.created_at DESC;

-- Top key phrases across all analyses
SELECT 
    unnest(key_phrases) as phrase,
    COUNT(*) as frequency
FROM analyses
WHERE user_id = '123e4567-e89b-12d3-a456-426614174000'
  AND status = 'completed'
GROUP BY phrase
ORDER BY frequency DESC
LIMIT 50;

-- ============================================
-- Complex Queries Using Views
-- ============================================

-- Get complete user statistics
SELECT * FROM user_file_stats 
WHERE user_id = '123e4567-e89b-12d3-a456-426614174000';

-- Daily usage trends (from materialized view)
SELECT * FROM daily_usage_stats 
WHERE date >= CURRENT_DATE - INTERVAL '30 days'
ORDER BY date DESC;

-- Recent activity feed
SELECT * FROM recent_user_activity 
WHERE user_id = '123e4567-e89b-12d3-a456-426614174000'
ORDER BY activity_timestamp DESC
LIMIT 50;

-- Monitor processing pipeline
SELECT * FROM file_processing_pipeline
WHERE user_id = '123e4567-e89b-12d3-a456-426614174000'
  AND pipeline_status NOT IN ('completed', 'failed')
ORDER BY audio_uploaded_at DESC;

-- ============================================
-- Analytics and Reporting Queries
-- ============================================

-- User engagement metrics
WITH user_metrics AS (
    SELECT 
        u.id,
        u.email,
        COUNT(DISTINCT af.id) as files_uploaded,
        COUNT(DISTINCT t.id) as transcriptions_created,
        COUNT(DISTINCT a.id) as analyses_performed,
        MAX(af.created_at) as last_active
    FROM users u
    LEFT JOIN audio_files af ON u.id = af.user_id
    LEFT JOIN transcriptions t ON u.id = t.user_id
    LEFT JOIN analyses a ON u.id = a.user_id
    WHERE u.created_at >= CURRENT_DATE - INTERVAL '30 days'
    GROUP BY u.id, u.email
)
SELECT * FROM user_metrics 
WHERE files_uploaded > 0
ORDER BY files_uploaded DESC;

-- Processing time analysis
SELECT 
    DATE(created_at) as date,
    AVG(EXTRACT(EPOCH FROM (processing_completed_at - processing_started_at))) as avg_processing_seconds,
    MIN(EXTRACT(EPOCH FROM (processing_completed_at - processing_started_at))) as min_processing_seconds,
    MAX(EXTRACT(EPOCH FROM (processing_completed_at - processing_started_at))) as max_processing_seconds,
    COUNT(*) as files_processed
FROM audio_files
WHERE status = 'ready'
  AND processing_started_at IS NOT NULL
  AND processing_completed_at IS NOT NULL
GROUP BY DATE(created_at)
ORDER BY date DESC
LIMIT 30;

-- Error analysis
SELECT 
    status,
    COUNT(*) as error_count,
    array_agg(DISTINCT error_message) as error_messages
FROM (
    SELECT 'audio' as type, status, error_message FROM audio_files WHERE status = 'error'
    UNION ALL
    SELECT 'transcription' as type, status, error_message FROM transcriptions WHERE status = 'failed'
    UNION ALL
    SELECT 'analysis' as type, status, error_message FROM analyses WHERE status = 'failed'
) errors
GROUP BY status
ORDER BY error_count DESC;

-- ============================================
-- Maintenance Queries
-- ============================================

-- Refresh materialized view
REFRESH MATERIALIZED VIEW CONCURRENTLY daily_usage_stats;

-- Vacuum and analyze tables
VACUUM ANALYZE audio_files;
VACUUM ANALYZE transcriptions;
VACUUM ANALYZE analyses;

-- Check table sizes
SELECT 
    schemaname,
    tablename,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;

-- Index usage statistics
SELECT 
    schemaname,
    tablename,
    indexname,
    idx_scan,
    idx_tup_read,
    idx_tup_fetch
FROM pg_stat_user_indexes
WHERE schemaname = 'public'
ORDER BY idx_scan DESC;