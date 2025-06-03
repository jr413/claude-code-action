-- Rollback Migration: 002_add_sample_data
-- Description: サンプルデータの削除
-- Created: 2025-06-03
-- Author: Claude AI Assistant

BEGIN;

-- サンプル分析結果の削除
DELETE FROM analyses WHERE id IN (
    '850e8400-e29b-41d4-a716-446655440001',
    '850e8400-e29b-41d4-a716-446655440002'
);

-- サンプル文字起こしの削除
DELETE FROM transcriptions WHERE id IN (
    '750e8400-e29b-41d4-a716-446655440001',
    '750e8400-e29b-41d4-a716-446655440002'
);

-- サンプル音声ファイルの削除
DELETE FROM audio_files WHERE id IN (
    '650e8400-e29b-41d4-a716-446655440001',
    '650e8400-e29b-41d4-a716-446655440002',
    '650e8400-e29b-41d4-a716-446655440003'
);

-- サンプルユーザーの削除
DELETE FROM users WHERE id IN (
    '550e8400-e29b-41d4-a716-446655440001',
    '550e8400-e29b-41d4-a716-446655440002',
    '550e8400-e29b-41d4-a716-446655440003',
    '550e8400-e29b-41d4-a716-446655440004'
);

COMMIT;