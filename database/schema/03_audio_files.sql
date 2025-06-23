-- =============================================
-- テーブル名: audio_files
-- 説明: アップロードされた音声ファイルのメタデータを管理
-- =============================================

CREATE TABLE audio_files (
    -- 主キー
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- 外部キー
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    -- ファイル基本情報
    file_name VARCHAR(255) NOT NULL,
    original_file_name VARCHAR(255) NOT NULL,
    file_size BIGINT NOT NULL CHECK (file_size > 0),
    file_type VARCHAR(50) NOT NULL,
    mime_type VARCHAR(100) NOT NULL,
    
    -- ストレージ情報
    storage_path TEXT NOT NULL,
    storage_provider VARCHAR(50) DEFAULT 'local' CHECK (storage_provider IN ('local', 's3', 'gcs', 'azure')),
    storage_url TEXT,
    
    -- 音声メタデータ
    duration_seconds DECIMAL(10, 3) CHECK (duration_seconds > 0),
    sample_rate INTEGER,
    bit_rate INTEGER,
    channels INTEGER CHECK (channels IN (1, 2)),
    
    -- 処理ステータス
    status VARCHAR(50) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'deleted')),
    error_message TEXT,
    
    -- 分析メタデータ
    language_code VARCHAR(10),
    confidence_score DECIMAL(3, 2) CHECK (confidence_score >= 0 AND confidence_score <= 1),
    
    -- プライバシー設定
    is_public BOOLEAN DEFAULT FALSE,
    
    -- タグとカテゴリ
    tags TEXT[],
    category VARCHAR(100),
    
    -- タイムスタンプ
    uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    processed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP WITH TIME ZONE
);

-- インデックス
CREATE INDEX idx_audio_files_user_id ON audio_files(user_id);
CREATE INDEX idx_audio_files_status ON audio_files(status);
CREATE INDEX idx_audio_files_user_id_created_at ON audio_files(user_id, created_at DESC);
CREATE INDEX idx_audio_files_file_type ON audio_files(file_type);
CREATE INDEX idx_audio_files_language_code ON audio_files(language_code);
CREATE INDEX idx_audio_files_tags ON audio_files USING GIN(tags);
CREATE INDEX idx_audio_files_category ON audio_files(category);
CREATE INDEX idx_audio_files_deleted_at ON audio_files(deleted_at);
CREATE INDEX idx_audio_files_is_public ON audio_files(is_public) WHERE is_public = TRUE;

-- 更新日時の自動更新トリガー
CREATE TRIGGER update_audio_files_updated_at BEFORE UPDATE ON audio_files
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- コメント
COMMENT ON TABLE audio_files IS 'アップロードされた音声ファイルのメタデータを管理するテーブル';
COMMENT ON COLUMN audio_files.id IS '音声ファイルID（UUID）';
COMMENT ON COLUMN audio_files.user_id IS 'ユーザーID（外部キー）';
COMMENT ON COLUMN audio_files.file_name IS 'システム内でのファイル名';
COMMENT ON COLUMN audio_files.original_file_name IS 'オリジナルファイル名';
COMMENT ON COLUMN audio_files.file_size IS 'ファイルサイズ（バイト）';
COMMENT ON COLUMN audio_files.file_type IS 'ファイルタイプ（mp3, wav, m4a等）';
COMMENT ON COLUMN audio_files.mime_type IS 'MIMEタイプ';
COMMENT ON COLUMN audio_files.storage_path IS 'ストレージパス';
COMMENT ON COLUMN audio_files.storage_provider IS 'ストレージプロバイダー（local/s3/gcs/azure）';
COMMENT ON COLUMN audio_files.storage_url IS 'ストレージURL';
COMMENT ON COLUMN audio_files.duration_seconds IS '音声の長さ（秒）';
COMMENT ON COLUMN audio_files.sample_rate IS 'サンプリングレート（Hz）';
COMMENT ON COLUMN audio_files.bit_rate IS 'ビットレート（bps）';
COMMENT ON COLUMN audio_files.channels IS 'チャンネル数（1:モノラル, 2:ステレオ）';
COMMENT ON COLUMN audio_files.status IS '処理ステータス（pending/processing/completed/failed/deleted）';
COMMENT ON COLUMN audio_files.error_message IS 'エラーメッセージ';
COMMENT ON COLUMN audio_files.language_code IS '言語コード（ja, en等）';
COMMENT ON COLUMN audio_files.confidence_score IS '言語検出の信頼度スコア（0-1）';
COMMENT ON COLUMN audio_files.is_public IS '公開フラグ';
COMMENT ON COLUMN audio_files.tags IS 'タグ配列';
COMMENT ON COLUMN audio_files.category IS 'カテゴリー';
COMMENT ON COLUMN audio_files.uploaded_at IS 'アップロード日時';
COMMENT ON COLUMN audio_files.processed_at IS '処理完了日時';
COMMENT ON COLUMN audio_files.created_at IS '作成日時';
COMMENT ON COLUMN audio_files.updated_at IS '更新日時';
COMMENT ON COLUMN audio_files.deleted_at IS '削除日時（論理削除）';