-- Common Query Examples for TeleAI Enterprise Database
-- これらのクエリは、一般的な使用ケースのサンプルです

-- =====================================================
-- ユーザー関連のクエリ
-- =====================================================

-- 1. アクティブユーザーの一覧を取得
SELECT id, username, email, full_name, last_login_at
FROM users
WHERE is_active = true
ORDER BY last_login_at DESC;

-- 2. 過去30日間にログインしたユーザー
SELECT username, email, last_login_at
FROM users
WHERE last_login_at > CURRENT_TIMESTAMP - INTERVAL '30 days'
  AND is_active = true
ORDER BY last_login_at DESC;

-- =====================================================
-- 音声ファイル関連のクエリ
-- =====================================================

-- 3. 特定ユーザーの最近アップロードしたファイル
SELECT 
    af.id,
    af.file_name,
    af.file_size,
    af.duration_seconds,
    af.format,
    af.created_at,
    COUNT(t.id) as transcription_count
FROM audio_files af
LEFT JOIN transcriptions t ON af.id = t.audio_file_id AND t.status = 'completed'
WHERE af.user_id = :user_id
  AND af.upload_status = 'completed'
GROUP BY af.id, af.file_name, af.file_size, af.duration_seconds, af.format, af.created_at
ORDER BY af.created_at DESC
LIMIT 20;

-- 4. ファイルサイズ別の統計
SELECT 
    CASE 
        WHEN file_size < 1048576 THEN '< 1MB'
        WHEN file_size < 10485760 THEN '1-10MB'
        WHEN file_size < 104857600 THEN '10-100MB'
        ELSE '> 100MB'
    END as size_range,
    COUNT(*) as file_count,
    SUM(file_size) as total_size,
    AVG(duration_seconds) as avg_duration
FROM audio_files
WHERE upload_status = 'completed'
GROUP BY size_range
ORDER BY MIN(file_size);

-- =====================================================
-- 文字起こし関連のクエリ
-- =====================================================

-- 5. 文字起こしの検索（全文検索）
SELECT 
    t.id,
    t.audio_file_id,
    af.file_name,
    t.language_code,
    t.confidence_score,
    ts_headline('english', t.transcription_text, q) as highlighted_text,
    t.created_at
FROM transcriptions t
JOIN audio_files af ON t.audio_file_id = af.id,
     to_tsquery('english', 'revenue & increase') q
WHERE to_tsvector('english', t.transcription_text) @@ q
  AND t.status = 'completed'
ORDER BY ts_rank(to_tsvector('english', t.transcription_text), q) DESC
LIMIT 10;

-- 6. 言語別の文字起こし統計
SELECT 
    language_code,
    COUNT(*) as transcription_count,
    AVG(confidence_score) as avg_confidence,
    AVG(word_count) as avg_word_count,
    AVG(processing_time_ms) as avg_processing_time
FROM transcriptions
WHERE status = 'completed'
GROUP BY language_code
ORDER BY transcription_count DESC;

-- =====================================================
-- 分析関連のクエリ
-- =====================================================

-- 7. ユーザーの分析サマリー
SELECT 
    a.user_id,
    u.username,
    a.analysis_type,
    COUNT(*) as analysis_count,
    AVG(a.confidence_score) as avg_confidence,
    AVG(a.processing_time_ms) as avg_processing_time
FROM analyses a
JOIN users u ON a.user_id = u.id
WHERE a.status = 'completed'
  AND a.created_at > CURRENT_TIMESTAMP - INTERVAL '90 days'
GROUP BY a.user_id, u.username, a.analysis_type
ORDER BY a.user_id, analysis_count DESC;

-- 8. センチメント分析の傾向
SELECT 
    DATE_TRUNC('week', a.created_at) as week,
    (a.analysis_result->>'overall')::text as sentiment,
    COUNT(*) as count,
    AVG((a.analysis_result->>'score')::float) as avg_score
FROM analyses a
WHERE a.analysis_type = 'sentiment'
  AND a.status = 'completed'
  AND a.created_at > CURRENT_TIMESTAMP - INTERVAL '3 months'
GROUP BY week, sentiment
ORDER BY week DESC, count DESC;

-- =====================================================
-- パフォーマンス監視用クエリ
-- =====================================================

-- 9. 処理時間の統計
SELECT 
    'transcription' as process_type,
    AVG(processing_time_ms) as avg_time_ms,
    PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY processing_time_ms) as median_time_ms,
    PERCENTILE_CONT(0.95) WITHIN GROUP (ORDER BY processing_time_ms) as p95_time_ms,
    MAX(processing_time_ms) as max_time_ms
FROM transcriptions
WHERE status = 'completed'
  AND completed_at > CURRENT_TIMESTAMP - INTERVAL '7 days'
UNION ALL
SELECT 
    'analysis_' || analysis_type,
    AVG(processing_time_ms),
    PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY processing_time_ms),
    PERCENTILE_CONT(0.95) WITHIN GROUP (ORDER BY processing_time_ms),
    MAX(processing_time_ms)
FROM analyses
WHERE status = 'completed'
  AND completed_at > CURRENT_TIMESTAMP - INTERVAL '7 days'
GROUP BY analysis_type;

-- 10. 日別のアクティビティサマリー
WITH daily_stats AS (
    SELECT 
        DATE(created_at) as activity_date,
        COUNT(DISTINCT user_id) as active_users,
        COUNT(*) as uploads,
        SUM(file_size) as total_size,
        SUM(duration_seconds) as total_duration
    FROM audio_files
    WHERE created_at > CURRENT_TIMESTAMP - INTERVAL '30 days'
    GROUP BY DATE(created_at)
)
SELECT 
    activity_date,
    active_users,
    uploads,
    pg_size_pretty(total_size::bigint) as total_size_pretty,
    INTERVAL '1 second' * total_duration as total_duration_interval,
    ROUND(uploads::numeric / NULLIF(active_users, 0), 2) as uploads_per_user
FROM daily_stats
ORDER BY activity_date DESC;

-- =====================================================
-- データ品質チェック用クエリ
-- =====================================================

-- 11. 失敗した処理の確認
SELECT 
    'transcription' as process_type,
    t.id,
    t.audio_file_id,
    af.file_name,
    t.status,
    t.error_message,
    t.created_at
FROM transcriptions t
JOIN audio_files af ON t.audio_file_id = af.id
WHERE t.status IN ('failed', 'cancelled')
  AND t.created_at > CURRENT_TIMESTAMP - INTERVAL '7 days'
UNION ALL
SELECT 
    'analysis_' || a.analysis_type,
    a.id,
    a.audio_file_id,
    af.file_name,
    a.status,
    a.error_message,
    a.created_at
FROM analyses a
JOIN audio_files af ON a.audio_file_id = af.id
WHERE a.status IN ('failed', 'cancelled')
  AND a.created_at > CURRENT_TIMESTAMP - INTERVAL '7 days'
ORDER BY created_at DESC;

-- 12. 孤立したレコードの検出
-- （関連する音声ファイルがない文字起こし）
SELECT t.id, t.audio_file_id, t.created_at
FROM transcriptions t
LEFT JOIN audio_files af ON t.audio_file_id = af.id
WHERE af.id IS NULL;

-- =====================================================
-- 管理者用レポートクエリ
-- =====================================================

-- 13. 月次利用状況レポート
SELECT 
    DATE_TRUNC('month', af.created_at) as month,
    COUNT(DISTINCT af.user_id) as unique_users,
    COUNT(af.id) as total_files,
    SUM(af.file_size) / 1073741824.0 as total_gb,
    SUM(af.duration_seconds) / 3600.0 as total_hours,
    COUNT(t.id) as transcriptions,
    COUNT(a.id) as analyses
FROM audio_files af
LEFT JOIN transcriptions t ON af.id = t.audio_file_id AND t.status = 'completed'
LEFT JOIN analyses a ON t.id = a.transcription_id AND a.status = 'completed'
WHERE af.created_at > CURRENT_TIMESTAMP - INTERVAL '12 months'
GROUP BY month
ORDER BY month DESC;

-- 14. ユーザー利用状況ランキング
SELECT 
    u.username,
    u.email,
    COUNT(DISTINCT af.id) as file_count,
    pg_size_pretty(COALESCE(SUM(af.file_size), 0)::bigint) as total_size,
    COALESCE(SUM(af.duration_seconds) / 3600.0, 0)::decimal(10,2) as total_hours,
    COUNT(DISTINCT t.id) as transcription_count,
    COUNT(DISTINCT a.id) as analysis_count,
    MAX(af.created_at) as last_upload
FROM users u
LEFT JOIN audio_files af ON u.id = af.user_id
LEFT JOIN transcriptions t ON af.id = t.audio_file_id AND t.status = 'completed'
LEFT JOIN analyses a ON t.id = a.transcription_id AND a.status = 'completed'
WHERE u.is_active = true
GROUP BY u.id, u.username, u.email
ORDER BY file_count DESC
LIMIT 20;