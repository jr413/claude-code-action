-- =============================================
-- テーブル名: sessions
-- 説明: ユーザーのログインセッション情報を管理
-- =============================================

CREATE TABLE sessions (
    -- 主キー
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- 外部キー
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    -- セッション情報
    session_token VARCHAR(255) NOT NULL,
    refresh_token VARCHAR(255),
    
    -- デバイス情報
    ip_address INET,
    user_agent TEXT,
    device_type VARCHAR(50) CHECK (device_type IN ('desktop', 'mobile', 'tablet', 'unknown')),
    device_name VARCHAR(255),
    
    -- 位置情報
    country_code VARCHAR(2),
    city VARCHAR(255),
    
    -- セッションステータス
    is_active BOOLEAN DEFAULT TRUE,
    
    -- セッションタイムスタンプ
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    last_activity_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    -- タイムスタンプ
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- インデックス
CREATE UNIQUE INDEX idx_sessions_session_token ON sessions(session_token);
CREATE INDEX idx_sessions_user_id ON sessions(user_id);
CREATE INDEX idx_sessions_is_active ON sessions(is_active);
CREATE INDEX idx_sessions_expires_at ON sessions(expires_at);
CREATE INDEX idx_sessions_last_activity_at ON sessions(last_activity_at);
CREATE INDEX idx_sessions_user_id_created_at ON sessions(user_id, created_at DESC);

-- 更新日時の自動更新トリガー
CREATE TRIGGER update_sessions_updated_at BEFORE UPDATE ON sessions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 期限切れセッションの自動削除（定期実行）
CREATE OR REPLACE FUNCTION cleanup_expired_sessions()
RETURNS void AS $$
BEGIN
    DELETE FROM sessions WHERE expires_at < CURRENT_TIMESTAMP;
END;
$$ LANGUAGE plpgsql;

-- コメント
COMMENT ON TABLE sessions IS 'ユーザーのログインセッション情報を管理するテーブル';
COMMENT ON COLUMN sessions.id IS 'セッションID（UUID）';
COMMENT ON COLUMN sessions.user_id IS 'ユーザーID（外部キー）';
COMMENT ON COLUMN sessions.session_token IS 'セッショントークン（ユニーク）';
COMMENT ON COLUMN sessions.refresh_token IS 'リフレッシュトークン';
COMMENT ON COLUMN sessions.ip_address IS 'IPアドレス';
COMMENT ON COLUMN sessions.user_agent IS 'ユーザーエージェント';
COMMENT ON COLUMN sessions.device_type IS 'デバイスタイプ（desktop/mobile/tablet/unknown）';
COMMENT ON COLUMN sessions.device_name IS 'デバイス名';
COMMENT ON COLUMN sessions.country_code IS '国コード（ISO 3166-1 alpha-2）';
COMMENT ON COLUMN sessions.city IS '都市名';
COMMENT ON COLUMN sessions.is_active IS 'アクティブフラグ';
COMMENT ON COLUMN sessions.expires_at IS 'セッション有効期限';
COMMENT ON COLUMN sessions.last_activity_at IS '最終アクティビティ日時';
COMMENT ON COLUMN sessions.created_at IS '作成日時';
COMMENT ON COLUMN sessions.updated_at IS '更新日時';