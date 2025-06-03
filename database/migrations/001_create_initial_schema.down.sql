-- Rollback Migration: 001_create_initial_schema
-- Description: TeleAI Pro エンタープライズデータモデルの初期スキーマのロールバック
-- Created: 2025-06-03
-- Author: Claude AI Assistant

-- このマイグレーションは、001_create_initial_schema.sqlで作成された
-- すべてのテーブル、ビュー、関数、トリガーを削除します。

BEGIN;

-- ビューの削除
DROP VIEW IF EXISTS processing_status_summary;
DROP VIEW IF EXISTS user_statistics;

-- トリガーの削除
DROP TRIGGER IF EXISTS update_analyses_updated_at ON analyses;
DROP TRIGGER IF EXISTS update_transcriptions_updated_at ON transcriptions;
DROP TRIGGER IF EXISTS update_audio_files_updated_at ON audio_files;
DROP TRIGGER IF EXISTS update_users_updated_at ON users;

-- 関数の削除
DROP FUNCTION IF EXISTS update_updated_at_column();

-- テーブルの削除（依存関係の順序に注意）
DROP TABLE IF EXISTS analyses CASCADE;
DROP TABLE IF EXISTS transcriptions CASCADE;
DROP TABLE IF EXISTS audio_files CASCADE;
DROP TABLE IF EXISTS sessions CASCADE;
DROP TABLE IF EXISTS users CASCADE;

COMMIT;