-- =============================================
-- マイグレーション: 001_initial_schema
-- 説明: TeleAIプラットフォームの初期データベーススキーマ作成
-- 作成日: 2025-06-23
-- =============================================

-- 拡張機能の有効化
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm"; -- 全文検索用

-- スキーマの作成
\i ../schema/01_users.sql
\i ../schema/02_sessions.sql
\i ../schema/03_audio_files.sql
\i ../schema/04_transcriptions.sql
\i ../schema/05_analyses.sql
\i ../schema/06_indexes_and_constraints.sql

-- 初期データの投入（必要に応じて）
-- INSERT INTO users (email, username, password_hash, role) 
-- VALUES ('admin@teleai.com', 'admin', '$2b$10$...', 'admin');

-- マイグレーション履歴テーブル
CREATE TABLE IF NOT EXISTS schema_migrations (
    version VARCHAR(255) PRIMARY KEY,
    applied_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- このマイグレーションを記録
INSERT INTO schema_migrations (version) VALUES ('001_initial_schema');

-- 権限の設定（必要に応じて）
-- GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO app_user;
-- GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO app_user;