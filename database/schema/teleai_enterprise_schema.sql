-- TeleAI Enterprise Database Schema
-- Version: 1.0.0
-- Created: 2025-06-05
-- Description: Enterprise data model for audio files, transcriptions, analysis results, and user management

-- Enable UUID extension (PostgreSQL)
-- CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- Users table - ユーザー管理
-- =====================================================
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    username VARCHAR(100) UNIQUE NOT NULL,
    full_name VARCHAR(255),
    password_hash VARCHAR(255) NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    is_admin BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    last_login_at TIMESTAMP WITH TIME ZONE,
    metadata JSONB DEFAULT '{}',
    
    -- Indexes
    INDEX idx_users_email (email),
    INDEX idx_users_username (username),
    INDEX idx_users_created_at (created_at),
    INDEX idx_users_is_active (is_active)
);

-- =====================================================
-- Sessions table - セッション管理
-- =====================================================
CREATE TABLE sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token_hash VARCHAR(255) UNIQUE NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    last_activity_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    -- Indexes
    INDEX idx_sessions_user_id (user_id),
    INDEX idx_sessions_token_hash (token_hash),
    INDEX idx_sessions_expires_at (expires_at)
);

-- =====================================================
-- Audio Files table - 音声ファイル管理
-- =====================================================
CREATE TABLE audio_files (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    file_name VARCHAR(255) NOT NULL,
    file_path TEXT NOT NULL,
    file_size BIGINT NOT NULL CHECK (file_size > 0),
    duration_seconds DECIMAL(10, 2),
    format VARCHAR(50) NOT NULL,
    sample_rate INTEGER,
    bit_rate INTEGER,
    channels INTEGER,
    upload_status VARCHAR(50) DEFAULT 'pending' CHECK (upload_status IN ('pending', 'processing', 'completed', 'failed')),
    checksum VARCHAR(64), -- SHA-256
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    metadata JSONB DEFAULT '{}',
    
    -- Composite index for performance optimization
    INDEX idx_audio_files_user_created (user_id, created_at DESC),
    INDEX idx_audio_files_status (upload_status),
    INDEX idx_audio_files_format (format),
    INDEX idx_audio_files_created_at (created_at DESC)
);

-- =====================================================
-- Transcriptions table - 文字起こし結果
-- =====================================================
CREATE TABLE transcriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    audio_file_id UUID NOT NULL REFERENCES audio_files(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    transcription_text TEXT NOT NULL,
    language_code VARCHAR(10) NOT NULL,
    confidence_score DECIMAL(5, 4) CHECK (confidence_score >= 0 AND confidence_score <= 1),
    word_count INTEGER,
    processing_time_ms INTEGER,
    engine VARCHAR(50) NOT NULL, -- e.g., 'whisper', 'google', 'aws'
    engine_version VARCHAR(50),
    status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'cancelled')),
    error_message TEXT,
    started_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    metadata JSONB DEFAULT '{}',
    
    -- Composite indexes for performance
    INDEX idx_transcriptions_audio_file (audio_file_id),
    INDEX idx_transcriptions_user_created (user_id, created_at DESC),
    INDEX idx_transcriptions_status (status),
    INDEX idx_transcriptions_language (language_code),
    INDEX idx_transcriptions_created_at (created_at DESC),
    
    -- Full-text search index
    INDEX idx_transcriptions_text_search USING gin(to_tsvector('english', transcription_text))
);

-- =====================================================
-- Analyses table - 分析結果
-- =====================================================
CREATE TABLE analyses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    transcription_id UUID NOT NULL REFERENCES transcriptions(id) ON DELETE CASCADE,
    audio_file_id UUID NOT NULL REFERENCES audio_files(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    analysis_type VARCHAR(100) NOT NULL, -- e.g., 'sentiment', 'summary', 'keywords', 'entities'
    analysis_result JSONB NOT NULL,
    confidence_score DECIMAL(5, 4) CHECK (confidence_score >= 0 AND confidence_score <= 1),
    processing_time_ms INTEGER,
    engine VARCHAR(50) NOT NULL,
    engine_version VARCHAR(50),
    status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'cancelled')),
    error_message TEXT,
    started_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    metadata JSONB DEFAULT '{}',
    
    -- Composite indexes
    INDEX idx_analyses_transcription (transcription_id),
    INDEX idx_analyses_audio_file (audio_file_id),
    INDEX idx_analyses_user_created (user_id, created_at DESC),
    INDEX idx_analyses_type (analysis_type),
    INDEX idx_analyses_status (status),
    INDEX idx_analyses_created_at (created_at DESC),
    
    -- Unique constraint to prevent duplicate analyses
    UNIQUE (transcription_id, analysis_type, engine)
);

-- =====================================================
-- Additional indexes for query optimization
-- =====================================================

-- Composite index for user activity queries
CREATE INDEX idx_user_activity ON audio_files (user_id, created_at DESC) 
    INCLUDE (file_name, file_size, duration_seconds);

-- Index for finding recent transcriptions by user
CREATE INDEX idx_recent_transcriptions ON transcriptions (user_id, created_at DESC) 
    WHERE status = 'completed';

-- Index for finding analyses by type and user
CREATE INDEX idx_analyses_by_type_user ON analyses (user_id, analysis_type, created_at DESC)
    WHERE status = 'completed';

-- =====================================================
-- Triggers for updated_at timestamps
-- =====================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply triggers to all tables
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_audio_files_updated_at BEFORE UPDATE ON audio_files
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_transcriptions_updated_at BEFORE UPDATE ON transcriptions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_analyses_updated_at BEFORE UPDATE ON analyses
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- Database Views for common queries
-- =====================================================

-- View for user file statistics
CREATE VIEW user_file_stats AS
SELECT 
    u.id as user_id,
    u.username,
    COUNT(DISTINCT af.id) as total_files,
    COALESCE(SUM(af.file_size), 0) as total_size_bytes,
    COALESCE(SUM(af.duration_seconds), 0) as total_duration_seconds,
    COUNT(DISTINCT t.id) as total_transcriptions,
    COUNT(DISTINCT a.id) as total_analyses
FROM users u
LEFT JOIN audio_files af ON u.id = af.user_id
LEFT JOIN transcriptions t ON af.id = t.audio_file_id AND t.status = 'completed'
LEFT JOIN analyses a ON t.id = a.transcription_id AND a.status = 'completed'
GROUP BY u.id, u.username;

-- View for recent activity
CREATE VIEW recent_activity AS
SELECT 
    'audio_upload' as activity_type,
    af.id as activity_id,
    af.user_id,
    af.file_name as description,
    af.created_at as activity_time
FROM audio_files af
WHERE af.created_at > CURRENT_TIMESTAMP - INTERVAL '30 days'
UNION ALL
SELECT 
    'transcription_completed' as activity_type,
    t.id as activity_id,
    t.user_id,
    'Transcription completed' as description,
    t.completed_at as activity_time
FROM transcriptions t
WHERE t.status = 'completed' 
    AND t.completed_at > CURRENT_TIMESTAMP - INTERVAL '30 days'
UNION ALL
SELECT 
    'analysis_completed' as activity_type,
    a.id as activity_id,
    a.user_id,
    a.analysis_type as description,
    a.completed_at as activity_time
FROM analyses a
WHERE a.status = 'completed' 
    AND a.completed_at > CURRENT_TIMESTAMP - INTERVAL '30 days'
ORDER BY activity_time DESC;

-- =====================================================
-- Comments and documentation
-- =====================================================
COMMENT ON TABLE users IS 'ユーザーアカウント情報を管理するテーブル';
COMMENT ON TABLE sessions IS 'ユーザーセッション情報を管理するテーブル';
COMMENT ON TABLE audio_files IS '音声ファイルのメタデータを管理するテーブル';
COMMENT ON TABLE transcriptions IS '音声ファイルの文字起こし結果を管理するテーブル';
COMMENT ON TABLE analyses IS '文字起こしの分析結果を管理するテーブル';

COMMENT ON COLUMN audio_files.checksum IS 'ファイルの整合性確認用SHA-256ハッシュ';
COMMENT ON COLUMN transcriptions.confidence_score IS '文字起こしの信頼度スコア (0.0-1.0)';
COMMENT ON COLUMN analyses.analysis_result IS '分析結果のJSON形式データ';