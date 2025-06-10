-- AI動画アプリ データベーススキーマ
-- PostgreSQL 14+

-- 拡張機能
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ユーザーテーブル
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  plan_type VARCHAR(50) DEFAULT 'free' CHECK (plan_type IN ('free', 'standard', 'premium')),
  usage_count INTEGER DEFAULT 0 CHECK (usage_count >= 0),
  usage_limit INTEGER DEFAULT 0 CHECK (usage_limit >= 0),
  age_verified BOOLEAN DEFAULT FALSE,
  age_verified_at TIMESTAMP,
  stripe_customer_id VARCHAR(255),
  email_verified BOOLEAN DEFAULT FALSE,
  email_verification_token VARCHAR(255),
  password_reset_token VARCHAR(255),
  password_reset_expires TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  deleted_at TIMESTAMP
);

-- ユーザーインデックス
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_stripe_customer_id ON users(stripe_customer_id);
CREATE INDEX idx_users_plan_type ON users(plan_type);

-- キャラクターテーブル
CREATE TABLE characters (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(100) NOT NULL,
  display_name VARCHAR(100) NOT NULL,
  thumbnail_url VARCHAR(500),
  avatar_url VARCHAR(500),
  plan_required VARCHAR(50) NOT NULL CHECK (plan_required IN ('free', 'standard', 'premium')),
  description TEXT,
  personality TEXT,
  voice_actor VARCHAR(100),
  is_active BOOLEAN DEFAULT TRUE,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- キャラクターインデックス
CREATE INDEX idx_characters_plan_required ON characters(plan_required);
CREATE INDEX idx_characters_is_active ON characters(is_active);
CREATE INDEX idx_characters_sort_order ON characters(sort_order);

-- シナリオテーブル
CREATE TABLE scenarios (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  character_id UUID REFERENCES characters(id) ON DELETE CASCADE,
  title VARCHAR(200) NOT NULL,
  description TEXT,
  audio_script TEXT NOT NULL,
  video_prompt TEXT NOT NULL,
  duration INTEGER NOT NULL CHECK (duration > 0), -- 秒数
  intensity_level INTEGER DEFAULT 1 CHECK (intensity_level >= 1 AND intensity_level <= 5),
  tags TEXT[], -- タグ配列
  is_active BOOLEAN DEFAULT TRUE,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- シナリオインデックス
CREATE INDEX idx_scenarios_character_id ON scenarios(character_id);
CREATE INDEX idx_scenarios_is_active ON scenarios(is_active);
CREATE INDEX idx_scenarios_sort_order ON scenarios(sort_order);
CREATE INDEX idx_scenarios_tags ON scenarios USING GIN(tags);

-- ユーザーセッションテーブル
CREATE TABLE user_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  character_id UUID REFERENCES characters(id),
  scenario_id UUID REFERENCES scenarios(id),
  video_url VARCHAR(500),
  audio_url VARCHAR(500),
  video_generation_status VARCHAR(50) DEFAULT 'pending' 
    CHECK (video_generation_status IN ('pending', 'processing', 'completed', 'failed')),
  ai_provider VARCHAR(50) CHECK (ai_provider IN ('runway_gen3', 'veo3')),
  generation_cost DECIMAL(10, 2),
  error_message TEXT,
  started_at TIMESTAMP DEFAULT NOW(),
  completed_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

-- セッションインデックス
CREATE INDEX idx_user_sessions_user_id ON user_sessions(user_id);
CREATE INDEX idx_user_sessions_status ON user_sessions(video_generation_status);
CREATE INDEX idx_user_sessions_created_at ON user_sessions(created_at DESC);

-- 支払い履歴テーブル
CREATE TABLE payment_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  stripe_payment_intent_id VARCHAR(255) UNIQUE,
  stripe_subscription_id VARCHAR(255),
  amount DECIMAL(10, 2) NOT NULL,
  currency VARCHAR(3) DEFAULT 'JPY',
  plan_type VARCHAR(50) NOT NULL,
  payment_status VARCHAR(50) DEFAULT 'pending',
  payment_method VARCHAR(50),
  description TEXT,
  metadata JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);

-- 支払い履歴インデックス
CREATE INDEX idx_payment_history_user_id ON payment_history(user_id);
CREATE INDEX idx_payment_history_stripe_payment_intent_id ON payment_history(stripe_payment_intent_id);
CREATE INDEX idx_payment_history_created_at ON payment_history(created_at DESC);

-- プラン設定テーブル
CREATE TABLE plan_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  plan_type VARCHAR(50) UNIQUE NOT NULL,
  name VARCHAR(100) NOT NULL,
  price DECIMAL(10, 2) NOT NULL,
  currency VARCHAR(3) DEFAULT 'JPY',
  monthly_limit INTEGER NOT NULL,
  features JSONB,
  ai_provider VARCHAR(50),
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- 監査ログテーブル
CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id),
  action VARCHAR(100) NOT NULL,
  resource_type VARCHAR(50),
  resource_id UUID,
  ip_address INET,
  user_agent TEXT,
  metadata JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);

-- 監査ログインデックス
CREATE INDEX idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_action ON audit_logs(action);
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at DESC);

-- リフレッシュトークンテーブル
CREATE TABLE refresh_tokens (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  token_hash VARCHAR(255) UNIQUE NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- リフレッシュトークンインデックス
CREATE INDEX idx_refresh_tokens_user_id ON refresh_tokens(user_id);
CREATE INDEX idx_refresh_tokens_token_hash ON refresh_tokens(token_hash);
CREATE INDEX idx_refresh_tokens_expires_at ON refresh_tokens(expires_at);

-- 更新日時自動更新トリガー
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 各テーブルにトリガーを適用
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_characters_updated_at BEFORE UPDATE ON characters
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_scenarios_updated_at BEFORE UPDATE ON scenarios
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_plan_settings_updated_at BEFORE UPDATE ON plan_settings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ビュー：アクティブなキャラクターとシナリオ
CREATE VIEW active_characters_with_scenarios AS
SELECT 
    c.id,
    c.name,
    c.display_name,
    c.thumbnail_url,
    c.plan_required,
    c.description,
    COUNT(s.id) as scenario_count
FROM characters c
LEFT JOIN scenarios s ON c.id = s.character_id AND s.is_active = TRUE
WHERE c.is_active = TRUE
GROUP BY c.id
ORDER BY c.sort_order, c.created_at;

-- ビュー：ユーザー利用統計
CREATE VIEW user_usage_stats AS
SELECT 
    u.id,
    u.email,
    u.plan_type,
    u.usage_count,
    u.usage_limit,
    COUNT(DISTINCT us.id) as total_sessions,
    COUNT(DISTINCT us.id) FILTER (WHERE us.created_at >= DATE_TRUNC('month', CURRENT_DATE)) as monthly_sessions,
    MAX(us.created_at) as last_session_at
FROM users u
LEFT JOIN user_sessions us ON u.id = us.user_id
GROUP BY u.id;