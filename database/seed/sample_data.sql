-- Sample data for TeleAI Enterprise
-- This file contains sample data for development and testing

-- Insert sample users
INSERT INTO users (id, email, username, full_name, password_hash, is_active, is_admin) VALUES
    ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'admin@teleai.com', 'admin', 'System Administrator', '$2b$10$YourHashedPasswordHere', true, true),
    ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a12', 'john.doe@example.com', 'johndoe', 'John Doe', '$2b$10$YourHashedPasswordHere', true, false),
    ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a13', 'jane.smith@example.com', 'janesmith', 'Jane Smith', '$2b$10$YourHashedPasswordHere', true, false);

-- Insert sample audio files
INSERT INTO audio_files (id, user_id, file_name, file_path, file_size, duration_seconds, format, sample_rate, bit_rate, channels, upload_status) VALUES
    ('b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a21', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a12', 'meeting_2025_01_15.mp3', '/storage/audio/2025/01/meeting_2025_01_15.mp3', 15728640, 982.5, 'mp3', 44100, 128000, 2, 'completed'),
    ('b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a22', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a12', 'interview_client_a.wav', '/storage/audio/2025/01/interview_client_a.wav', 52428800, 300.0, 'wav', 48000, 1536000, 2, 'completed'),
    ('b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a23', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a13', 'podcast_episode_001.mp3', '/storage/audio/2025/01/podcast_episode_001.mp3', 31457280, 1964.8, 'mp3', 44100, 128000, 2, 'completed');

-- Insert sample transcriptions
INSERT INTO transcriptions (id, audio_file_id, user_id, transcription_text, language_code, confidence_score, word_count, processing_time_ms, engine, engine_version, status, completed_at) VALUES
    ('c0eebc99-9c0b-4ef8-bb6d-6bb9bd380a31', 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a21', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a12', 
     'Good morning everyone. Today we will discuss the Q1 results and planning for Q2. As you can see from the dashboard, our revenue has increased by 15% compared to last quarter...', 
     'en-US', 0.9523, 150, 3500, 'whisper', 'v3', 'completed', CURRENT_TIMESTAMP - INTERVAL '2 days'),
    
    ('c0eebc99-9c0b-4ef8-bb6d-6bb9bd380a32', 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a22', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a12',
     'Thank you for taking the time to meet with us today. We are very interested in your product and would like to understand more about the integration capabilities...',
     'en-US', 0.9812, 85, 1200, 'whisper', 'v3', 'completed', CURRENT_TIMESTAMP - INTERVAL '1 day');

-- Insert sample analyses
INSERT INTO analyses (id, transcription_id, audio_file_id, user_id, analysis_type, analysis_result, confidence_score, processing_time_ms, engine, engine_version, status, completed_at) VALUES
    ('d0eebc99-9c0b-4ef8-bb6d-6bb9bd380a41', 'c0eebc99-9c0b-4ef8-bb6d-6bb9bd380a31', 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a21', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a12',
     'sentiment', 
     '{"overall": "positive", "score": 0.78, "breakdown": {"positive": 0.78, "neutral": 0.20, "negative": 0.02}}',
     0.8901, 500, 'claude', 'v2', 'completed', CURRENT_TIMESTAMP - INTERVAL '2 days'),
    
    ('d0eebc99-9c0b-4ef8-bb6d-6bb9bd380a42', 'c0eebc99-9c0b-4ef8-bb6d-6bb9bd380a31', 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a21', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a12',
     'summary',
     '{"summary": "Quarterly business meeting discussing Q1 results showing 15% revenue increase and planning for Q2 initiatives.", "key_points": ["15% revenue increase", "Q2 planning", "Dashboard review"]}',
     0.9234, 800, 'claude', 'v2', 'completed', CURRENT_TIMESTAMP - INTERVAL '2 days'),
    
    ('d0eebc99-9c0b-4ef8-bb6d-6bb9bd380a43', 'c0eebc99-9c0b-4ef8-bb6d-6bb9bd380a32', 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a22', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a12',
     'keywords',
     '{"keywords": ["product", "integration", "capabilities", "meeting", "interested"], "relevance_scores": {"product": 0.95, "integration": 0.92, "capabilities": 0.88}}',
     0.8765, 300, 'claude', 'v2', 'completed', CURRENT_TIMESTAMP - INTERVAL '1 day');