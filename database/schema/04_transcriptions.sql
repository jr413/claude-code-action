-- =============================================
-- テーブル名: transcriptions
-- 説明: 音声ファイルの文字起こし結果を保存
-- =============================================

CREATE TABLE transcriptions (
    -- 主キー
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- 外部キー
    audio_file_id UUID NOT NULL REFERENCES audio_files(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    -- 文字起こしテキスト
    content TEXT NOT NULL,
    content_html TEXT, -- フォーマット済みHTML版
    
    -- メタデータ
    word_count INTEGER NOT NULL DEFAULT 0,
    character_count INTEGER NOT NULL DEFAULT 0,
    
    -- 処理情報
    transcription_engine VARCHAR(50) NOT NULL CHECK (transcription_engine IN ('whisper', 'google', 'aws', 'azure', 'custom')),
    model_version VARCHAR(50),
    processing_time_ms INTEGER,
    
    -- 精度情報
    confidence_score DECIMAL(3, 2) CHECK (confidence_score >= 0 AND confidence_score <= 1),
    
    -- タイムスタンプ付き文字起こし
    timestamps JSONB, -- [{"start": 0.0, "end": 2.5, "text": "こんにちは"}, ...]
    
    -- スピーカー識別
    speaker_diarization JSONB, -- {"speakers": [{"id": "speaker1", "segments": [...]}]}
    speaker_count INTEGER DEFAULT 1,
    
    -- 言語情報
    language_code VARCHAR(10) NOT NULL,
    detected_languages JSONB, -- {"ja": 0.95, "en": 0.05}
    
    -- 編集履歴
    is_edited BOOLEAN DEFAULT FALSE,
    edit_history JSONB[], -- 編集履歴の配列
    
    -- ステータス
    status VARCHAR(50) NOT NULL DEFAULT 'completed' CHECK (status IN ('processing', 'completed', 'failed', 'edited')),
    error_message TEXT,
    
    -- 検索最適化
    search_vector tsvector,
    
    -- タイムスタンプ
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP WITH TIME ZONE
);

-- インデックス
CREATE UNIQUE INDEX idx_transcriptions_audio_file_id ON transcriptions(audio_file_id);
CREATE INDEX idx_transcriptions_user_id ON transcriptions(user_id);
CREATE INDEX idx_transcriptions_status ON transcriptions(status);
CREATE INDEX idx_transcriptions_language_code ON transcriptions(language_code);
CREATE INDEX idx_transcriptions_created_at ON transcriptions(created_at);
CREATE INDEX idx_transcriptions_search_vector ON transcriptions USING GIN(search_vector);
CREATE INDEX idx_transcriptions_user_id_created_at ON transcriptions(user_id, created_at DESC);

-- 全文検索の更新トリガー
CREATE OR REPLACE FUNCTION update_transcription_search_vector()
RETURNS TRIGGER AS $$
BEGIN
    NEW.search_vector := to_tsvector('japanese', COALESCE(NEW.content, ''));
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_transcription_search_vector_trigger
BEFORE INSERT OR UPDATE OF content ON transcriptions
FOR EACH ROW EXECUTE FUNCTION update_transcription_search_vector();

-- 更新日時の自動更新トリガー
CREATE TRIGGER update_transcriptions_updated_at BEFORE UPDATE ON transcriptions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 文字数・単語数の自動計算トリガー
CREATE OR REPLACE FUNCTION update_transcription_counts()
RETURNS TRIGGER AS $$
BEGIN
    NEW.character_count := length(NEW.content);
    NEW.word_count := array_length(string_to_array(NEW.content, ' '), 1);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_transcription_counts_trigger
BEFORE INSERT OR UPDATE OF content ON transcriptions
FOR EACH ROW EXECUTE FUNCTION update_transcription_counts();

-- コメント
COMMENT ON TABLE transcriptions IS '音声ファイルの文字起こし結果を保存するテーブル';
COMMENT ON COLUMN transcriptions.id IS '文字起こしID（UUID）';
COMMENT ON COLUMN transcriptions.audio_file_id IS '音声ファイルID（外部キー）';
COMMENT ON COLUMN transcriptions.user_id IS 'ユーザーID（外部キー）';
COMMENT ON COLUMN transcriptions.content IS '文字起こしテキスト';
COMMENT ON COLUMN transcriptions.content_html IS 'フォーマット済みHTML版';
COMMENT ON COLUMN transcriptions.word_count IS '単語数';
COMMENT ON COLUMN transcriptions.character_count IS '文字数';
COMMENT ON COLUMN transcriptions.transcription_engine IS '文字起こしエンジン（whisper/google/aws/azure/custom）';
COMMENT ON COLUMN transcriptions.model_version IS 'モデルバージョン';
COMMENT ON COLUMN transcriptions.processing_time_ms IS '処理時間（ミリ秒）';
COMMENT ON COLUMN transcriptions.confidence_score IS '全体の信頼度スコア（0-1）';
COMMENT ON COLUMN transcriptions.timestamps IS 'タイムスタンプ付き文字起こしデータ（JSON）';
COMMENT ON COLUMN transcriptions.speaker_diarization IS 'スピーカー識別データ（JSON）';
COMMENT ON COLUMN transcriptions.speaker_count IS 'スピーカー数';
COMMENT ON COLUMN transcriptions.language_code IS '主要言語コード';
COMMENT ON COLUMN transcriptions.detected_languages IS '検出された言語と割合（JSON）';
COMMENT ON COLUMN transcriptions.is_edited IS '編集済みフラグ';
COMMENT ON COLUMN transcriptions.edit_history IS '編集履歴（JSON配列）';
COMMENT ON COLUMN transcriptions.status IS 'ステータス（processing/completed/failed/edited）';
COMMENT ON COLUMN transcriptions.error_message IS 'エラーメッセージ';
COMMENT ON COLUMN transcriptions.search_vector IS '全文検索用ベクター';
COMMENT ON COLUMN transcriptions.created_at IS '作成日時';
COMMENT ON COLUMN transcriptions.updated_at IS '更新日時';
COMMENT ON COLUMN transcriptions.completed_at IS '完了日時';