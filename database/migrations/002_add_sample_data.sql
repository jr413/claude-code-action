-- Migration: 002_add_sample_data
-- Description: 開発環境用のサンプルデータを追加
-- Created: 2025-06-03
-- Author: Claude AI Assistant
-- Note: このマイグレーションは開発環境でのみ実行してください

BEGIN;

-- サンプルユーザーの追加
INSERT INTO users (id, email, username, full_name, role) VALUES
    ('550e8400-e29b-41d4-a716-446655440001', 'admin@teleai.pro', 'admin', '管理者', 'admin'),
    ('550e8400-e29b-41d4-a716-446655440002', 'user1@example.com', 'user1', '山田太郎', 'user'),
    ('550e8400-e29b-41d4-a716-446655440003', 'user2@example.com', 'user2', '鈴木花子', 'user'),
    ('550e8400-e29b-41d4-a716-446655440004', 'moderator@teleai.pro', 'moderator', 'モデレーター', 'moderator');

-- サンプル音声ファイルの追加
INSERT INTO audio_files (id, user_id, file_name, file_path, file_size, mime_type, duration_seconds, sample_rate, bit_rate, channels, status) VALUES
    ('650e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440002', 'meeting_20250601.mp3', '/uploads/2025/06/meeting_20250601.mp3', 5242880, 'audio/mpeg', 300, 44100, 128000, 2, 'processed'),
    ('650e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440002', 'interview_20250602.wav', '/uploads/2025/06/interview_20250602.wav', 10485760, 'audio/wav', 600, 48000, 768000, 1, 'processed'),
    ('650e8400-e29b-41d4-a716-446655440003', '550e8400-e29b-41d4-a716-446655440003', 'presentation_20250603.mp3', '/uploads/2025/06/presentation_20250603.mp3', 8388608, 'audio/mpeg', 480, 44100, 192000, 2, 'processing');

-- サンプル文字起こしの追加
INSERT INTO transcriptions (id, audio_file_id, user_id, transcription_text, language_code, confidence_score, word_count, processing_time_ms, status) VALUES
    ('750e8400-e29b-41d4-a716-446655440001', '650e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440002', 
     '本日は新製品の開発について議論したいと思います。まず、市場調査の結果から見ていきましょう。現在のトレンドとしては、AIを活用した音声認識技術への需要が高まっています。', 
     'ja', 0.9523, 50, 1500, 'completed'),
    ('750e8400-e29b-41d4-a716-446655440002', '650e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440002', 
     'Thank you for joining today''s interview. Can you tell us about your experience with voice recognition technology? I have been working in this field for over 10 years...', 
     'en', 0.9812, 120, 2300, 'completed');

-- サンプル分析結果の追加
INSERT INTO analyses (id, transcription_id, user_id, analysis_type, summary, key_points, sentiment_score, entities, topics, processing_time_ms, status) VALUES
    ('850e8400-e29b-41d4-a716-446655440001', '750e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440002', 
     'meeting_summary', 
     '新製品開発に関する会議。AI音声認識技術の市場需要について議論。',
     '["AI音声認識技術の需要増加", "市場調査結果の共有", "新製品開発の方向性"]'::jsonb,
     0.75,
     '{"organizations": ["TeleAI Pro"], "technologies": ["AI", "音声認識"], "products": ["新製品"]}'::jsonb,
     '["製品開発", "市場調査", "AI技術", "音声認識"]'::jsonb,
     500,
     'completed'),
    ('850e8400-e29b-41d4-a716-446655440002', '750e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440002', 
     'interview_analysis', 
     'Interview with experienced voice recognition engineer discussing 10+ years of industry experience.',
     '["10 years experience", "Voice recognition expertise", "Industry insights"]'::jsonb,
     0.85,
     '{"persons": ["Interviewee"], "technologies": ["voice recognition"], "duration": ["10 years"]}'::jsonb,
     '["Interview", "Voice Recognition", "Experience", "Technology"]'::jsonb,
     750,
     'completed');

COMMIT;