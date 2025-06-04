-- TeleAI Pro Enterprise Data Model
-- Database Schema for Audio Transcription and Analysis Platform
-- Version: 1.0.0
-- Created: 2025-06-04

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Create custom types
CREATE TYPE user_role AS ENUM ('admin', 'user', 'viewer');
CREATE TYPE analysis_status AS ENUM ('pending', 'processing', 'completed', 'failed');
CREATE TYPE transcription_status AS ENUM ('pending', 'processing', 'completed', 'failed');
CREATE TYPE audio_file_status AS ENUM ('uploaded', 'processing', 'ready', 'error');

-- Users table
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    role user_role DEFAULT 'user' NOT NULL,
    is_active BOOLEAN DEFAULT true NOT NULL,
    last_login_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    CONSTRAINT email_format CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}$')
);

-- Create index for user queries
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_created_at ON users(created_at);
CREATE INDEX idx_users_composite ON users(id, created_at);

-- Sessions table for user authentication
CREATE TABLE IF NOT EXISTS sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token_hash VARCHAR(255) UNIQUE NOT NULL,
    ip_address INET,
    user_agent TEXT,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    CONSTRAINT valid_expiry CHECK (expires_at > created_at)
);

-- Create indexes for session queries
CREATE INDEX idx_sessions_user_id ON sessions(user_id);
CREATE INDEX idx_sessions_token_hash ON sessions(token_hash);
CREATE INDEX idx_sessions_expires_at ON sessions(expires_at);

-- Audio files table
CREATE TABLE IF NOT EXISTS audio_files (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    file_name VARCHAR(500) NOT NULL,
    file_path TEXT NOT NULL,
    file_size_bytes BIGINT NOT NULL,
    duration_seconds DECIMAL(10, 2),
    mime_type VARCHAR(100) NOT NULL,
    sample_rate INTEGER,
    channels INTEGER,
    bit_rate INTEGER,
    status audio_file_status DEFAULT 'uploaded' NOT NULL,
    upload_completed_at TIMESTAMP WITH TIME ZONE,
    processing_started_at TIMESTAMP WITH TIME ZONE,
    processing_completed_at TIMESTAMP WITH TIME ZONE,
    error_message TEXT,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    CONSTRAINT positive_file_size CHECK (file_size_bytes > 0),
    CONSTRAINT positive_duration CHECK (duration_seconds > 0 OR duration_seconds IS NULL),
    CONSTRAINT valid_mime_type CHECK (mime_type IN ('audio/mpeg', 'audio/wav', 'audio/ogg', 'audio/webm', 'audio/aac', 'audio/flac'))
);

-- Create indexes for audio file queries
CREATE INDEX idx_audio_files_user_id ON audio_files(user_id);
CREATE INDEX idx_audio_files_status ON audio_files(status);
CREATE INDEX idx_audio_files_created_at ON audio_files(created_at);
CREATE INDEX idx_audio_files_composite ON audio_files(user_id, created_at);
CREATE INDEX idx_audio_files_metadata ON audio_files USING GIN(metadata);

-- Transcriptions table
CREATE TABLE IF NOT EXISTS transcriptions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    audio_file_id UUID NOT NULL REFERENCES audio_files(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    transcription_text TEXT NOT NULL,
    language_code VARCHAR(10) NOT NULL,
    confidence_score DECIMAL(3, 2),
    word_count INTEGER,
    status transcription_status DEFAULT 'pending' NOT NULL,
    engine VARCHAR(50) NOT NULL,
    engine_version VARCHAR(20),
    processing_started_at TIMESTAMP WITH TIME ZONE,
    processing_completed_at TIMESTAMP WITH TIME ZONE,
    processing_duration_ms INTEGER,
    error_message TEXT,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    CONSTRAINT valid_confidence CHECK (confidence_score >= 0 AND confidence_score <= 1),
    CONSTRAINT positive_word_count CHECK (word_count >= 0 OR word_count IS NULL),
    CONSTRAINT positive_processing_duration CHECK (processing_duration_ms > 0 OR processing_duration_ms IS NULL)
);

-- Create indexes for transcription queries
CREATE INDEX idx_transcriptions_audio_file_id ON transcriptions(audio_file_id);
CREATE INDEX idx_transcriptions_user_id ON transcriptions(user_id);
CREATE INDEX idx_transcriptions_status ON transcriptions(status);
CREATE INDEX idx_transcriptions_language_code ON transcriptions(language_code);
CREATE INDEX idx_transcriptions_created_at ON transcriptions(created_at);
CREATE INDEX idx_transcriptions_composite ON transcriptions(user_id, created_at);
CREATE INDEX idx_transcriptions_metadata ON transcriptions USING GIN(metadata);
-- Full text search index
CREATE INDEX idx_transcriptions_text_search ON transcriptions USING GIN(to_tsvector('english', transcription_text));

-- Analyses table
CREATE TABLE IF NOT EXISTS analyses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    transcription_id UUID NOT NULL REFERENCES transcriptions(id) ON DELETE CASCADE,
    audio_file_id UUID NOT NULL REFERENCES audio_files(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    analysis_type VARCHAR(100) NOT NULL,
    sentiment_score DECIMAL(3, 2),
    sentiment_label VARCHAR(20),
    key_phrases TEXT[],
    entities JSONB DEFAULT '[]',
    topics JSONB DEFAULT '[]',
    summary TEXT,
    insights JSONB DEFAULT '{}',
    status analysis_status DEFAULT 'pending' NOT NULL,
    engine VARCHAR(50) NOT NULL,
    engine_version VARCHAR(20),
    processing_started_at TIMESTAMP WITH TIME ZONE,
    processing_completed_at TIMESTAMP WITH TIME ZONE,
    processing_duration_ms INTEGER,
    error_message TEXT,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    CONSTRAINT valid_sentiment_score CHECK (sentiment_score >= -1 AND sentiment_score <= 1),
    CONSTRAINT valid_sentiment_label CHECK (sentiment_label IN ('positive', 'negative', 'neutral', 'mixed') OR sentiment_label IS NULL),
    CONSTRAINT positive_analysis_duration CHECK (processing_duration_ms > 0 OR processing_duration_ms IS NULL)
);

-- Create indexes for analysis queries
CREATE INDEX idx_analyses_transcription_id ON analyses(transcription_id);
CREATE INDEX idx_analyses_audio_file_id ON analyses(audio_file_id);
CREATE INDEX idx_analyses_user_id ON analyses(user_id);
CREATE INDEX idx_analyses_analysis_type ON analyses(analysis_type);
CREATE INDEX idx_analyses_status ON analyses(status);
CREATE INDEX idx_analyses_sentiment_label ON analyses(sentiment_label);
CREATE INDEX idx_analyses_created_at ON analyses(created_at);
CREATE INDEX idx_analyses_composite ON analyses(user_id, created_at);
CREATE INDEX idx_analyses_entities ON analyses USING GIN(entities);
CREATE INDEX idx_analyses_topics ON analyses USING GIN(topics);
CREATE INDEX idx_analyses_insights ON analyses USING GIN(insights);
CREATE INDEX idx_analyses_metadata ON analyses USING GIN(metadata);

-- Create update timestamp trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply update timestamp triggers to all tables
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_sessions_updated_at BEFORE UPDATE ON sessions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_audio_files_updated_at BEFORE UPDATE ON audio_files
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_transcriptions_updated_at BEFORE UPDATE ON transcriptions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_analyses_updated_at BEFORE UPDATE ON analyses
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create views for common queries
CREATE OR REPLACE VIEW user_file_stats AS
SELECT 
    u.id as user_id,
    u.email,
    u.full_name,
    COUNT(DISTINCT af.id) as total_files,
    COUNT(DISTINCT t.id) as total_transcriptions,
    COUNT(DISTINCT a.id) as total_analyses,
    SUM(af.file_size_bytes) as total_storage_bytes,
    SUM(af.duration_seconds) as total_duration_seconds,
    MAX(af.created_at) as last_upload_at
FROM users u
LEFT JOIN audio_files af ON u.id = af.user_id
LEFT JOIN transcriptions t ON u.id = t.user_id
LEFT JOIN analyses a ON u.id = a.user_id
GROUP BY u.id, u.email, u.full_name;

-- Create materialized view for performance analytics
CREATE MATERIALIZED VIEW daily_usage_stats AS
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
CREATE INDEX idx_daily_usage_stats_date ON daily_usage_stats(date);

-- Grant permissions (adjust based on your specific roles)
-- Example:
-- GRANT SELECT, INSERT, UPDATE ON ALL TABLES IN SCHEMA public TO app_user;
-- GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO app_user;