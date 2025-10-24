-- =============================================
-- テーブル名: analyses
-- 説明: 文字起こしデータの分析結果を保存
-- =============================================

CREATE TABLE analyses (
    -- 主キー
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- 外部キー
    transcription_id UUID NOT NULL REFERENCES transcriptions(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    audio_file_id UUID NOT NULL REFERENCES audio_files(id) ON DELETE CASCADE,
    
    -- 分析タイプ
    analysis_type VARCHAR(50) NOT NULL CHECK (analysis_type IN (
        'sentiment',      -- 感情分析
        'summary',        -- 要約
        'keywords',       -- キーワード抽出
        'entities',       -- エンティティ抽出
        'topics',         -- トピック分析
        'action_items',   -- アクションアイテム抽出
        'questions',      -- 質問抽出
        'custom'         -- カスタム分析
    )),
    
    -- 分析結果
    result JSONB NOT NULL,
    
    -- 分析メタデータ
    analysis_engine VARCHAR(50) NOT NULL,
    model_name VARCHAR(100),
    model_version VARCHAR(50),
    
    -- 処理情報
    processing_time_ms INTEGER,
    token_count INTEGER,
    
    -- 信頼度スコア
    confidence_score DECIMAL(3, 2) CHECK (confidence_score >= 0 AND confidence_score <= 1),
    
    -- カスタムパラメータ
    parameters JSONB,
    
    -- 結果の可視化データ
    visualization_data JSONB,
    
    -- ステータス
    status VARCHAR(50) NOT NULL DEFAULT 'completed' CHECK (status IN ('processing', 'completed', 'failed')),
    error_message TEXT,
    
    -- タイムスタンプ
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP WITH TIME ZONE
);

-- インデックス
CREATE INDEX idx_analyses_transcription_id ON analyses(transcription_id);
CREATE INDEX idx_analyses_user_id ON analyses(user_id);
CREATE INDEX idx_analyses_audio_file_id ON analyses(audio_file_id);
CREATE INDEX idx_analyses_analysis_type ON analyses(analysis_type);
CREATE INDEX idx_analyses_status ON analyses(status);
CREATE INDEX idx_analyses_created_at ON analyses(created_at);
CREATE INDEX idx_analyses_user_id_created_at ON analyses(user_id, created_at DESC);
CREATE INDEX idx_analyses_transcription_id_type ON analyses(transcription_id, analysis_type);

-- 更新日時の自動更新トリガー
CREATE TRIGGER update_analyses_updated_at BEFORE UPDATE ON analyses
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- サンプル分析結果の構造
-- 感情分析の例:
-- {
--   "overall_sentiment": "positive",
--   "sentiment_scores": {
--     "positive": 0.75,
--     "neutral": 0.20,
--     "negative": 0.05
--   },
--   "emotions": {
--     "joy": 0.6,
--     "trust": 0.3,
--     "anticipation": 0.1
--   },
--   "sentiment_timeline": [
--     {"start": 0, "end": 30, "sentiment": "neutral"},
--     {"start": 30, "end": 120, "sentiment": "positive"}
--   ]
-- }

-- 要約の例:
-- {
--   "summary": "会議では新商品の開発スケジュールについて議論されました。",
--   "key_points": [
--     "開発期間は3ヶ月",
--     "予算は500万円",
--     "チームメンバーは5名"
--   ],
--   "summary_type": "extractive",
--   "compression_ratio": 0.15
-- }

-- キーワード抽出の例:
-- {
--   "keywords": [
--     {"word": "AI", "score": 0.95, "frequency": 12},
--     {"word": "音声認識", "score": 0.88, "frequency": 8},
--     {"word": "自動化", "score": 0.75, "frequency": 5}
--   ],
--   "keyphrases": [
--     {"phrase": "音声認識技術", "score": 0.92},
--     {"phrase": "AIによる自動化", "score": 0.85}
--   ]
-- }

-- コメント
COMMENT ON TABLE analyses IS '文字起こしデータの分析結果を保存するテーブル';
COMMENT ON COLUMN analyses.id IS '分析ID（UUID）';
COMMENT ON COLUMN analyses.transcription_id IS '文字起こしID（外部キー）';
COMMENT ON COLUMN analyses.user_id IS 'ユーザーID（外部キー）';
COMMENT ON COLUMN analyses.audio_file_id IS '音声ファイルID（外部キー）';
COMMENT ON COLUMN analyses.analysis_type IS '分析タイプ（sentiment/summary/keywords/entities/topics/action_items/questions/custom）';
COMMENT ON COLUMN analyses.result IS '分析結果（JSON）';
COMMENT ON COLUMN analyses.analysis_engine IS '分析エンジン名';
COMMENT ON COLUMN analyses.model_name IS 'モデル名';
COMMENT ON COLUMN analyses.model_version IS 'モデルバージョン';
COMMENT ON COLUMN analyses.processing_time_ms IS '処理時間（ミリ秒）';
COMMENT ON COLUMN analyses.token_count IS 'トークン数';
COMMENT ON COLUMN analyses.confidence_score IS '信頼度スコア（0-1）';
COMMENT ON COLUMN analyses.parameters IS 'カスタムパラメータ（JSON）';
COMMENT ON COLUMN analyses.visualization_data IS '可視化用データ（JSON）';
COMMENT ON COLUMN analyses.status IS 'ステータス（processing/completed/failed）';
COMMENT ON COLUMN analyses.error_message IS 'エラーメッセージ';
COMMENT ON COLUMN analyses.created_at IS '作成日時';
COMMENT ON COLUMN analyses.updated_at IS '更新日時';
COMMENT ON COLUMN analyses.completed_at IS '完了日時';