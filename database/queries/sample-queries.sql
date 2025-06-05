-- Sample Queries for TeleAI Pro Database
-- These queries demonstrate common use cases and patterns

-- ============================================
-- USER MANAGEMENT QUERIES
-- ============================================

-- Get active users with their roles
SELECT 
    id, 
    username, 
    email, 
    role, 
    last_login_at,
    created_at
FROM users
WHERE is_active = true 
    AND deleted_at IS NULL
ORDER BY created_at DESC;

-- Find users who haven't logged in for 30 days
SELECT 
    username, 
    email, 
    last_login_at,
    EXTRACT(DAY FROM NOW() - last_login_at) as days_inactive
FROM users
WHERE last_login_at < NOW() - INTERVAL '30 days'
    AND is_active = true
    AND deleted_at IS NULL
ORDER BY last_login_at ASC;

-- Get user statistics
SELECT 
    role,
    COUNT(*) as user_count,
    COUNT(CASE WHEN last_login_at > NOW() - INTERVAL '7 days' THEN 1 END) as active_last_week
FROM users
WHERE deleted_at IS NULL
GROUP BY role
ORDER BY user_count DESC;

-- ============================================
-- SESSION MANAGEMENT QUERIES
-- ============================================

-- Get active sessions with user details
SELECT 
    s.id as session_id,
    u.username,
    u.email,
    s.ip_address,
    s.created_at,
    s.expires_at,
    EXTRACT(EPOCH FROM (s.expires_at - NOW())) / 3600 as hours_remaining
FROM sessions s
JOIN users u ON s.user_id = u.id
WHERE s.expires_at > NOW() 
    AND NOT s.is_revoked
ORDER BY s.created_at DESC;

-- Clean up expired sessions
DELETE FROM sessions
WHERE expires_at < NOW() OR is_revoked = true;

-- ============================================
-- AUDIO FILE QUERIES
-- ============================================

-- Get recent uploads with processing status
SELECT 
    af.id,
    af.file_name,
    af.file_format,
    af.status,
    u.username as uploaded_by,
    af.created_at,
    pg_size_pretty(af.file_size::numeric) as file_size_human,
    af.duration_seconds / 60.0 as duration_minutes
FROM audio_files af
JOIN users u ON af.user_id = u.id
WHERE af.deleted_at IS NULL
ORDER BY af.created_at DESC
LIMIT 20;

-- Get processing queue status
SELECT 
    status,
    COUNT(*) as file_count,
    pg_size_pretty(SUM(file_size)::numeric) as total_size,
    AVG(EXTRACT(EPOCH FROM (NOW() - upload_started_at))) / 60 as avg_wait_minutes
FROM audio_files
WHERE status IN ('pending', 'processing')
GROUP BY status;

-- Find large files that might need special handling
SELECT 
    file_name,
    file_format,
    pg_size_pretty(file_size::numeric) as size,
    duration_seconds / 60.0 as duration_minutes,
    status
FROM audio_files
WHERE file_size > 100 * 1024 * 1024 -- Files larger than 100MB
    AND deleted_at IS NULL
ORDER BY file_size DESC;

-- Get daily upload statistics
SELECT 
    DATE(created_at) as upload_date,
    COUNT(*) as files_uploaded,
    COUNT(DISTINCT user_id) as unique_users,
    pg_size_pretty(SUM(file_size)::numeric) as total_size,
    AVG(duration_seconds) / 60.0 as avg_duration_minutes
FROM audio_files
WHERE created_at > NOW() - INTERVAL '30 days'
    AND deleted_at IS NULL
GROUP BY DATE(created_at)
ORDER BY upload_date DESC;

-- ============================================
-- TRANSCRIPTION QUERIES
-- ============================================

-- Get latest transcriptions with confidence scores
SELECT 
    t.id,
    af.file_name,
    t.language_code,
    t.confidence_score,
    t.word_count,
    t.engine_used,
    t.created_at,
    LEFT(t.transcription_text, 100) || '...' as preview
FROM transcriptions t
JOIN audio_files af ON t.audio_file_id = af.id
WHERE t.is_latest = true
ORDER BY t.created_at DESC
LIMIT 20;

-- Find transcriptions with low confidence
SELECT 
    t.id,
    af.file_name,
    t.confidence_score,
    t.language_code,
    u.username as user_name
FROM transcriptions t
JOIN audio_files af ON t.audio_file_id = af.id
JOIN users u ON af.user_id = u.id
WHERE t.is_latest = true 
    AND t.confidence_score < 0.7
ORDER BY t.confidence_score ASC;

-- Full-text search in transcriptions
SELECT 
    t.id,
    af.file_name,
    ts_rank(to_tsvector('english', t.transcription_text), query) as rank,
    ts_headline('english', t.transcription_text, query, 
                'StartSel=<mark>, StopSel=</mark>, MaxWords=20, MinWords=10') as excerpt
FROM transcriptions t
JOIN audio_files af ON t.audio_file_id = af.id,
    to_tsquery('english', 'important & meeting') query
WHERE to_tsvector('english', t.transcription_text) @@ query
    AND t.is_latest = true
ORDER BY rank DESC
LIMIT 10;

-- Get transcription version history
SELECT 
    version,
    created_at,
    confidence_score,
    word_count,
    engine_used,
    engine_version,
    created_by
FROM transcriptions
WHERE audio_file_id = 'your-audio-file-id-here'
ORDER BY version DESC;

-- ============================================
-- ANALYSIS QUERIES
-- ============================================

-- Get recent analyses by type
SELECT 
    a.analysis_type,
    COUNT(*) as count,
    AVG(a.processing_time_ms) as avg_processing_ms,
    MAX(a.created_at) as last_analysis
FROM analyses a
WHERE a.created_at > NOW() - INTERVAL '7 days'
GROUP BY a.analysis_type
ORDER BY count DESC;

-- Get sentiment analysis results
SELECT 
    af.file_name,
    t.language_code,
    a.result->>'sentiment' as sentiment,
    (a.result->>'score')::numeric as sentiment_score,
    a.confidence_scores->>'overall' as confidence,
    a.created_at
FROM analyses a
JOIN transcriptions t ON a.transcription_id = t.id
JOIN audio_files af ON t.audio_file_id = af.id
WHERE a.analysis_type = 'sentiment'
    AND t.is_latest = true
ORDER BY a.created_at DESC
LIMIT 20;

-- Find keywords across all analyses
SELECT 
    keyword,
    COUNT(*) as frequency,
    AVG((confidence)::numeric) as avg_confidence
FROM (
    SELECT 
        jsonb_array_elements_text(a.result->'keywords') as keyword,
        a.confidence_scores->>'keywords' as confidence
    FROM analyses a
    WHERE a.analysis_type = 'keywords'
        AND a.created_at > NOW() - INTERVAL '30 days'
) keywords
GROUP BY keyword
HAVING COUNT(*) > 5
ORDER BY frequency DESC
LIMIT 50;

-- ============================================
-- AGGREGATED REPORTS
-- ============================================

-- User activity report
SELECT 
    u.username,
    u.role,
    uas.total_files,
    uas.total_transcriptions,
    uas.total_analyses,
    uas.last_upload,
    u.last_login_at,
    CASE 
        WHEN u.last_login_at > NOW() - INTERVAL '7 days' THEN 'Active'
        WHEN u.last_login_at > NOW() - INTERVAL '30 days' THEN 'Moderate'
        ELSE 'Inactive'
    END as activity_status
FROM users u
JOIN user_activity_summary uas ON u.id = uas.id
ORDER BY uas.total_files DESC;

-- Processing performance by file format
SELECT 
    file_format,
    COUNT(*) as files_processed,
    AVG(EXTRACT(EPOCH FROM (processing_completed_at - processing_started_at))) as avg_processing_seconds,
    PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY EXTRACT(EPOCH FROM (processing_completed_at - processing_started_at))) as median_processing_seconds,
    PERCENTILE_CONT(0.95) WITHIN GROUP (ORDER BY EXTRACT(EPOCH FROM (processing_completed_at - processing_started_at))) as p95_processing_seconds
FROM audio_files
WHERE status = 'completed'
    AND processing_completed_at IS NOT NULL
    AND processing_started_at IS NOT NULL
GROUP BY file_format
ORDER BY files_processed DESC;

-- Language distribution in transcriptions
SELECT 
    language_code,
    COUNT(*) as transcription_count,
    AVG(confidence_score) as avg_confidence,
    AVG(word_count) as avg_word_count,
    SUM(word_count) as total_words
FROM transcriptions
WHERE is_latest = true
GROUP BY language_code
ORDER BY transcription_count DESC;

-- ============================================
-- MAINTENANCE QUERIES
-- ============================================

-- Identify orphaned records
-- Orphaned transcriptions (audio file deleted)
SELECT t.id, t.audio_file_id, t.created_at
FROM transcriptions t
LEFT JOIN audio_files af ON t.audio_file_id = af.id
WHERE af.id IS NULL;

-- Identify stuck processing jobs
SELECT 
    id,
    file_name,
    status,
    processing_started_at,
    EXTRACT(EPOCH FROM (NOW() - processing_started_at)) / 3600 as hours_processing
FROM audio_files
WHERE status = 'processing'
    AND processing_started_at < NOW() - INTERVAL '2 hours'
ORDER BY processing_started_at ASC;

-- Storage usage by user
SELECT 
    u.username,
    u.role,
    COUNT(af.id) as file_count,
    pg_size_pretty(SUM(af.file_size)::numeric) as total_storage,
    pg_size_pretty(AVG(af.file_size)::numeric) as avg_file_size
FROM users u
LEFT JOIN audio_files af ON u.id = af.user_id AND af.deleted_at IS NULL
GROUP BY u.id, u.username, u.role
HAVING SUM(af.file_size) > 0
ORDER BY SUM(af.file_size) DESC;

-- ============================================
-- PERFORMANCE MONITORING
-- ============================================

-- Table sizes
SELECT 
    tablename,
    pg_size_pretty(pg_total_relation_size(tablename::regclass)) as total_size,
    pg_size_pretty(pg_relation_size(tablename::regclass)) as table_size,
    pg_size_pretty(pg_indexes_size(tablename::regclass)) as indexes_size
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(tablename::regclass) DESC;

-- Index usage statistics
SELECT 
    schemaname,
    tablename,
    indexname,
    idx_scan as index_scans,
    idx_tup_read as tuples_read,
    idx_tup_fetch as tuples_fetched
FROM pg_stat_user_indexes
WHERE schemaname = 'public'
ORDER BY idx_scan DESC;