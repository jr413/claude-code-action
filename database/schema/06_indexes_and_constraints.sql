-- =============================================
-- 追加のインデックスと制約
-- 説明: パフォーマンス最適化のための複合インデックスと制約
-- =============================================

-- ========== 複合インデックス ==========

-- ユーザーごとの音声ファイル検索を高速化
CREATE INDEX idx_audio_files_user_status_created 
ON audio_files(user_id, status, created_at DESC) 
WHERE deleted_at IS NULL;

-- ユーザーごとの文字起こし検索を高速化
CREATE INDEX idx_transcriptions_user_status_created 
ON transcriptions(user_id, status, created_at DESC);

-- 音声ファイルごとの分析結果検索を高速化
CREATE INDEX idx_analyses_audio_type_created 
ON analyses(audio_file_id, analysis_type, created_at DESC);

-- 言語別の音声ファイル検索を高速化
CREATE INDEX idx_audio_files_lang_public_created 
ON audio_files(language_code, is_public, created_at DESC) 
WHERE deleted_at IS NULL;

-- ========== 外部キー制約の追加設定 ==========

-- カスケード削除の設定確認
ALTER TABLE sessions 
ADD CONSTRAINT fk_sessions_user 
FOREIGN KEY (user_id) 
REFERENCES users(id) 
ON DELETE CASCADE;

ALTER TABLE audio_files 
ADD CONSTRAINT fk_audio_files_user 
FOREIGN KEY (user_id) 
REFERENCES users(id) 
ON DELETE CASCADE;

ALTER TABLE transcriptions 
ADD CONSTRAINT fk_transcriptions_audio 
FOREIGN KEY (audio_file_id) 
REFERENCES audio_files(id) 
ON DELETE CASCADE;

ALTER TABLE analyses 
ADD CONSTRAINT fk_analyses_transcription 
FOREIGN KEY (transcription_id) 
REFERENCES transcriptions(id) 
ON DELETE CASCADE;

-- ========== チェック制約の追加 ==========

-- ファイルサイズの上限設定（1GB）
ALTER TABLE audio_files 
ADD CONSTRAINT chk_audio_files_max_size 
CHECK (file_size <= 1073741824);

-- 音声ファイルの長さ制限（3時間）
ALTER TABLE audio_files 
ADD CONSTRAINT chk_audio_files_max_duration 
CHECK (duration_seconds <= 10800);

-- 分析結果のサイズ制限（10MB）
ALTER TABLE analyses 
ADD CONSTRAINT chk_analyses_result_size 
CHECK (pg_column_size(result) <= 10485760);

-- ========== 部分インデックス ==========

-- アクティブなセッションのみのインデックス
CREATE INDEX idx_sessions_active_users 
ON sessions(user_id, last_activity_at DESC) 
WHERE is_active = TRUE;

-- 処理待ちの音声ファイルのインデックス
CREATE INDEX idx_audio_files_pending 
ON audio_files(created_at) 
WHERE status = 'pending';

-- 失敗した処理のインデックス
CREATE INDEX idx_audio_files_failed 
ON audio_files(user_id, created_at DESC) 
WHERE status = 'failed';

-- ========== パフォーマンス統計用のマテリアライズドビュー ==========

-- ユーザーごとの統計情報
CREATE MATERIALIZED VIEW user_statistics AS
SELECT 
    u.id AS user_id,
    u.username,
    COUNT(DISTINCT af.id) AS total_audio_files,
    COUNT(DISTINCT t.id) AS total_transcriptions,
    COUNT(DISTINCT a.id) AS total_analyses,
    SUM(af.file_size) AS total_storage_used,
    SUM(af.duration_seconds) AS total_audio_duration,
    MAX(af.created_at) AS last_upload_at
FROM users u
LEFT JOIN audio_files af ON u.id = af.user_id AND af.deleted_at IS NULL
LEFT JOIN transcriptions t ON af.id = t.audio_file_id
LEFT JOIN analyses a ON t.id = a.transcription_id
GROUP BY u.id, u.username;

-- 統計情報ビューのインデックス
CREATE UNIQUE INDEX idx_user_statistics_user_id ON user_statistics(user_id);
CREATE INDEX idx_user_statistics_total_files ON user_statistics(total_audio_files DESC);

-- 統計情報の定期更新用関数
CREATE OR REPLACE FUNCTION refresh_user_statistics()
RETURNS void AS $$
BEGIN
    REFRESH MATERIALIZED VIEW CONCURRENTLY user_statistics;
END;
$$ LANGUAGE plpgsql;

-- ========== パーティショニング設定（大規模データ用） ==========

-- 音声ファイルテーブルの月別パーティショニング（例）
-- CREATE TABLE audio_files_2024_01 PARTITION OF audio_files
-- FOR VALUES FROM ('2024-01-01') TO ('2024-02-01');

-- ========== 監査ログテーブル ==========

CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    table_name VARCHAR(50) NOT NULL,
    record_id UUID NOT NULL,
    user_id UUID REFERENCES users(id),
    action VARCHAR(20) NOT NULL CHECK (action IN ('INSERT', 'UPDATE', 'DELETE')),
    old_values JSONB,
    new_values JSONB,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 監査ログのインデックス
CREATE INDEX idx_audit_logs_table_record ON audit_logs(table_name, record_id);
CREATE INDEX idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at DESC);

-- コメント
COMMENT ON MATERIALIZED VIEW user_statistics IS 'ユーザーごとの使用状況統計';
COMMENT ON TABLE audit_logs IS 'データ変更の監査ログ';