-- Migration: 001_create_initial_schema
-- Description: TeleAI Pro エンタープライズデータモデルの初期スキーマ作成
-- Created: 2025-06-03
-- Author: Claude AI Assistant

-- このマイグレーションは、audio_files、transcriptions、analyses、users、sessionsの
-- 各テーブルを作成し、必要なインデックスと制約を設定します。

BEGIN;

-- ユーザーテーブルの作成
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    username VARCHAR(100) UNIQUE NOT NULL,
    full_name VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN DEFAULT TRUE NOT NULL,
    role VARCHAR(50) DEFAULT 'user' NOT NULL,
    CONSTRAINT chk_role CHECK (role IN ('user', 'admin', 'moderator'))
);

-- セッションテーブルの作成
CREATE TABLE IF NOT EXISTS sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    token VARCHAR(500) UNIQUE NOT NULL,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    is_active BOOLEAN DEFAULT TRUE NOT NULL,
    CONSTRAINT fk_session_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 音声ファイルテーブルの作成
CREATE TABLE IF NOT EXISTS audio_files (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    file_name VARCHAR(255) NOT NULL,
    file_path TEXT NOT NULL,
    file_size BIGINT NOT NULL,
    mime_type VARCHAR(100) NOT NULL,
    duration_seconds INTEGER,
    sample_rate INTEGER,
    bit_rate INTEGER,
    channels INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP WITH TIME ZONE,
    status VARCHAR(50) DEFAULT 'uploaded' NOT NULL,
    metadata JSONB,
    CONSTRAINT fk_audio_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT chk_status CHECK (status IN ('uploaded', 'processing', 'processed', 'failed', 'deleted')),
    CONSTRAINT chk_file_size CHECK (file_size > 0)
);

-- 文字起こしテーブルの作成
CREATE TABLE IF NOT EXISTS transcriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    audio_file_id UUID NOT NULL,
    user_id UUID NOT NULL,
    transcription_text TEXT NOT NULL,
    language_code VARCHAR(10) NOT NULL,
    confidence_score DECIMAL(5,4),
    word_count INTEGER,
    processing_time_ms INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    status VARCHAR(50) DEFAULT 'pending' NOT NULL,
    error_message TEXT,
    metadata JSONB,
    CONSTRAINT fk_transcription_audio FOREIGN KEY (audio_file_id) REFERENCES audio_files(id) ON DELETE CASCADE,
    CONSTRAINT fk_transcription_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT chk_transcription_status CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
    CONSTRAINT chk_confidence_score CHECK (confidence_score >= 0 AND confidence_score <= 1)
);

-- 分析結果テーブルの作成
CREATE TABLE IF NOT EXISTS analyses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    transcription_id UUID NOT NULL,
    user_id UUID NOT NULL,
    analysis_type VARCHAR(100) NOT NULL,
    summary TEXT,
    key_points JSONB,
    sentiment_score DECIMAL(3,2),
    entities JSONB,
    topics JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    processing_time_ms INTEGER,
    status VARCHAR(50) DEFAULT 'pending' NOT NULL,
    error_message TEXT,
    metadata JSONB,
    CONSTRAINT fk_analysis_transcription FOREIGN KEY (transcription_id) REFERENCES transcriptions(id) ON DELETE CASCADE,
    CONSTRAINT fk_analysis_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT chk_analysis_status CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
    CONSTRAINT chk_sentiment_score CHECK (sentiment_score >= -1 AND sentiment_score <= 1)
);

-- インデックスの作成
CREATE INDEX IF NOT EXISTS idx_users_created_at ON users(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_users_active_role ON users(is_active, role) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_sessions_expires_at ON sessions(expires_at) WHERE is_active = TRUE;
CREATE INDEX IF NOT EXISTS idx_audio_files_user_created ON audio_files(user_id, created_at DESC) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_audio_files_status ON audio_files(status) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_transcriptions_user_created ON transcriptions(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_transcriptions_audio_file ON transcriptions(audio_file_id);
CREATE INDEX IF NOT EXISTS idx_transcriptions_status ON transcriptions(status);
CREATE INDEX IF NOT EXISTS idx_analyses_user_created ON analyses(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_analyses_transcription ON analyses(transcription_id);
CREATE INDEX IF NOT EXISTS idx_analyses_type_status ON analyses(analysis_type, status);

-- updated_at自動更新関数の作成
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- トリガーの作成
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_audio_files_updated_at BEFORE UPDATE ON audio_files
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_transcriptions_updated_at BEFORE UPDATE ON transcriptions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_analyses_updated_at BEFORE UPDATE ON analyses
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ビューの作成
CREATE VIEW IF NOT EXISTS user_statistics AS
SELECT 
    u.id,
    u.username,
    u.email,
    COUNT(DISTINCT af.id) AS total_audio_files,
    COUNT(DISTINCT t.id) AS total_transcriptions,
    COUNT(DISTINCT a.id) AS total_analyses,
    MAX(af.created_at) AS last_upload_at,
    MAX(t.created_at) AS last_transcription_at,
    MAX(a.created_at) AS last_analysis_at
FROM users u
LEFT JOIN audio_files af ON u.id = af.user_id AND af.deleted_at IS NULL
LEFT JOIN transcriptions t ON u.id = t.user_id
LEFT JOIN analyses a ON u.id = a.user_id
WHERE u.deleted_at IS NULL
GROUP BY u.id, u.username, u.email;

CREATE VIEW IF NOT EXISTS processing_status_summary AS
SELECT 
    'audio_files' AS entity_type,
    status,
    COUNT(*) AS count
FROM audio_files
WHERE deleted_at IS NULL
GROUP BY status
UNION ALL
SELECT 
    'transcriptions' AS entity_type,
    status,
    COUNT(*) AS count
FROM transcriptions
GROUP BY status
UNION ALL
SELECT 
    'analyses' AS entity_type,
    status,
    COUNT(*) AS count
FROM analyses
GROUP BY status;

COMMIT;