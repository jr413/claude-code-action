-- TeleAI Pro Enterprise Database Schema
-- Version: 1.0.0
-- Description: Complete data model for audio files, transcriptions, analysis results, and user management

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Create custom types
CREATE TYPE user_role AS ENUM ('admin', 'manager', 'analyst', 'viewer');
CREATE TYPE file_status AS ENUM ('pending', 'processing', 'completed', 'failed', 'archived');
CREATE TYPE analysis_type AS ENUM ('sentiment', 'summary', 'keywords', 'entities', 'custom');
CREATE TYPE file_format AS ENUM ('mp3', 'wav', 'ogg', 'm4a', 'flac', 'webm');

-- Users table with enterprise features
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    username VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role user_role NOT NULL DEFAULT 'viewer',
    is_active BOOLEAN DEFAULT true,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    last_login_at TIMESTAMPTZ,
    deleted_at TIMESTAMPTZ,
    CONSTRAINT email_format CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$')
);

-- Sessions table for authentication
CREATE TABLE sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token_hash VARCHAR(255) UNIQUE NOT NULL,
    ip_address INET,
    user_agent TEXT,
    expires_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    last_accessed_at TIMESTAMPTZ DEFAULT NOW(),
    is_revoked BOOLEAN DEFAULT false,
    CONSTRAINT valid_expiry CHECK (expires_at > created_at)
);

-- Audio files table with comprehensive metadata
CREATE TABLE audio_files (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    file_name VARCHAR(255) NOT NULL,
    file_path TEXT NOT NULL,
    file_size BIGINT NOT NULL,
    file_format file_format NOT NULL,
    duration_seconds INTEGER,
    sample_rate INTEGER,
    channels INTEGER,
    bit_rate INTEGER,
    status file_status NOT NULL DEFAULT 'pending',
    upload_started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    upload_completed_at TIMESTAMPTZ,
    processing_started_at TIMESTAMPTZ,
    processing_completed_at TIMESTAMPTZ,
    metadata JSONB DEFAULT '{}',
    error_message TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMPTZ,
    CONSTRAINT positive_file_size CHECK (file_size > 0),
    CONSTRAINT positive_duration CHECK (duration_seconds IS NULL OR duration_seconds > 0),
    CONSTRAINT valid_sample_rate CHECK (sample_rate IS NULL OR sample_rate > 0),
    CONSTRAINT valid_channels CHECK (channels IS NULL OR channels BETWEEN 1 AND 32),
    CONSTRAINT valid_bit_rate CHECK (bit_rate IS NULL OR bit_rate > 0)
);

-- Transcriptions table with versioning support
CREATE TABLE transcriptions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    audio_file_id UUID NOT NULL REFERENCES audio_files(id) ON DELETE CASCADE,
    version INTEGER NOT NULL DEFAULT 1,
    transcription_text TEXT NOT NULL,
    language_code VARCHAR(10) NOT NULL DEFAULT 'en',
    confidence_score DECIMAL(3,2),
    word_count INTEGER,
    processing_time_ms INTEGER,
    engine_used VARCHAR(50),
    engine_version VARCHAR(20),
    metadata JSONB DEFAULT '{}',
    is_latest BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_by UUID REFERENCES users(id),
    CONSTRAINT valid_confidence CHECK (confidence_score IS NULL OR confidence_score BETWEEN 0 AND 1),
    CONSTRAINT positive_word_count CHECK (word_count IS NULL OR word_count >= 0),
    CONSTRAINT positive_processing_time CHECK (processing_time_ms IS NULL OR processing_time_ms > 0),
    CONSTRAINT unique_latest_version UNIQUE (audio_file_id, is_latest) WHERE is_latest = true
);

-- Analyses table for various AI-powered insights
CREATE TABLE analyses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    transcription_id UUID NOT NULL REFERENCES transcriptions(id) ON DELETE CASCADE,
    analysis_type analysis_type NOT NULL,
    result JSONB NOT NULL,
    confidence_scores JSONB DEFAULT '{}',
    processing_time_ms INTEGER,
    model_used VARCHAR(100),
    model_version VARCHAR(50),
    parameters JSONB DEFAULT '{}',
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_by UUID REFERENCES users(id),
    CONSTRAINT positive_analysis_time CHECK (processing_time_ms IS NULL OR processing_time_ms > 0)
);

-- Create indexes for performance optimization
-- User-related indexes
CREATE INDEX idx_users_email ON users(email) WHERE deleted_at IS NULL;
CREATE INDEX idx_users_username ON users(username) WHERE deleted_at IS NULL;
CREATE INDEX idx_users_role ON users(role) WHERE is_active = true AND deleted_at IS NULL;
CREATE INDEX idx_users_created_at ON users(created_at);

-- Session-related indexes
CREATE INDEX idx_sessions_user_id ON sessions(user_id);
CREATE INDEX idx_sessions_token_hash ON sessions(token_hash) WHERE is_revoked = false;
CREATE INDEX idx_sessions_expires_at ON sessions(expires_at) WHERE is_revoked = false;

-- Audio file indexes with composite optimization
CREATE INDEX idx_audio_files_user_id_created_at ON audio_files(user_id, created_at DESC) WHERE deleted_at IS NULL;
CREATE INDEX idx_audio_files_status ON audio_files(status) WHERE deleted_at IS NULL;
CREATE INDEX idx_audio_files_created_at ON audio_files(created_at DESC);
CREATE INDEX idx_audio_files_file_format ON audio_files(file_format);

-- Transcription indexes
CREATE INDEX idx_transcriptions_audio_file_id ON transcriptions(audio_file_id);
CREATE INDEX idx_transcriptions_latest ON transcriptions(audio_file_id) WHERE is_latest = true;
CREATE INDEX idx_transcriptions_language ON transcriptions(language_code);
CREATE INDEX idx_transcriptions_created_at ON transcriptions(created_at DESC);

-- Analysis indexes
CREATE INDEX idx_analyses_transcription_id ON analyses(transcription_id);
CREATE INDEX idx_analyses_type ON analyses(analysis_type);
CREATE INDEX idx_analyses_created_at ON analyses(created_at DESC);

-- Full-text search indexes
CREATE INDEX idx_transcriptions_text_search ON transcriptions USING gin(to_tsvector('english', transcription_text));

-- JSONB indexes for metadata queries
CREATE INDEX idx_audio_files_metadata ON audio_files USING gin(metadata);
CREATE INDEX idx_transcriptions_metadata ON transcriptions USING gin(metadata);
CREATE INDEX idx_analyses_result ON analyses USING gin(result);

-- Update triggers for updated_at timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_audio_files_updated_at BEFORE UPDATE ON audio_files
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to ensure only one latest transcription per audio file
CREATE OR REPLACE FUNCTION ensure_single_latest_transcription()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.is_latest = true THEN
        UPDATE transcriptions 
        SET is_latest = false 
        WHERE audio_file_id = NEW.audio_file_id 
        AND id != NEW.id 
        AND is_latest = true;
    END IF;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER manage_latest_transcription
    BEFORE INSERT OR UPDATE ON transcriptions
    FOR EACH ROW
    EXECUTE FUNCTION ensure_single_latest_transcription();

-- Row-level security policies (to be enabled as needed)
-- Enable RLS on tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE audio_files ENABLE ROW LEVEL SECURITY;
ALTER TABLE transcriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE analyses ENABLE ROW LEVEL SECURITY;

-- Create views for common queries
CREATE OR REPLACE VIEW user_activity_summary AS
SELECT 
    u.id,
    u.username,
    u.email,
    u.role,
    COUNT(DISTINCT af.id) as total_files,
    COUNT(DISTINCT t.id) as total_transcriptions,
    COUNT(DISTINCT a.id) as total_analyses,
    MAX(af.created_at) as last_upload,
    u.last_login_at
FROM users u
LEFT JOIN audio_files af ON u.id = af.user_id AND af.deleted_at IS NULL
LEFT JOIN transcriptions t ON af.id = t.audio_file_id AND t.is_latest = true
LEFT JOIN analyses a ON t.id = a.transcription_id
WHERE u.deleted_at IS NULL AND u.is_active = true
GROUP BY u.id, u.username, u.email, u.role, u.last_login_at;

-- Create materialized view for performance analytics
CREATE MATERIALIZED VIEW file_processing_analytics AS
SELECT 
    DATE_TRUNC('day', af.created_at) as date,
    af.file_format,
    af.status,
    COUNT(*) as file_count,
    AVG(af.file_size) as avg_file_size,
    AVG(af.duration_seconds) as avg_duration,
    AVG(EXTRACT(EPOCH FROM (af.processing_completed_at - af.processing_started_at))) as avg_processing_time_seconds
FROM audio_files af
WHERE af.deleted_at IS NULL
GROUP BY DATE_TRUNC('day', af.created_at), af.file_format, af.status;

-- Create index on materialized view
CREATE INDEX idx_file_processing_analytics_date ON file_processing_analytics(date DESC);

-- Grant appropriate permissions (adjust as needed)
-- Example grants for application user
-- GRANT SELECT, INSERT, UPDATE ON ALL TABLES IN SCHEMA public TO teleai_app;
-- GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO teleai_app;
-- GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO teleai_app;