-- AI動画アプリ 初期データ
-- 開発・テスト用のシードデータ

-- プラン設定
INSERT INTO plan_settings (plan_type, name, price, monthly_limit, ai_provider, features) VALUES
('free', 'フリープラン', 0, 0, NULL, '{"preview_only": true, "watermark": true}'),
('standard', 'スタンダード', 2980, 20, 'runway_gen3', '{"resolution": "720p", "duration": 30, "priority": "normal"}'),
('premium', 'プレミアム', 8980, 15, 'veo3', '{"resolution": "4K", "duration": 60, "priority": "high", "exclusive_content": true}');

-- サンプルキャラクター
INSERT INTO characters (name, display_name, plan_required, description, personality, voice_actor, sort_order) VALUES
('sakura', '桜', 'standard', '清楚系の女子大生。優しく包み込むような性格。', '優しく、少し恥ずかしがり屋', '声優A', 1),
('yui', 'ゆい', 'premium', 'ギャル系の専門学生。明るく積極的な性格。', '明るく、積極的でフレンドリー', '声優B', 2);

-- サンプルシナリオ（桜）
INSERT INTO scenarios (character_id, title, description, audio_script, video_prompt, duration, intensity_level, tags, sort_order)
SELECT 
    id,
    'はじめての出会い',
    '偶然の出会いから始まる甘い時間',
    '「あ、こんにちは...また会えて嬉しいです」',
    'Young woman in casual clothes, shy smile, coffee shop setting, soft lighting',
    30,
    1,
    ARRAY['初心者向け', 'ソフト', 'デート'],
    1
FROM characters WHERE name = 'sakura';

INSERT INTO scenarios (character_id, title, description, audio_script, video_prompt, duration, intensity_level, tags, sort_order)
SELECT 
    id,
    'デートの約束',
    '二人きりの特別な時間',
    '「今日は...二人きりで過ごせて嬉しい」',
    'Young woman in dress, intimate setting, warm atmosphere',
    45,
    2,
    ARRAY['デート', 'ロマンチック'],
    2
FROM characters WHERE name = 'sakura';

INSERT INTO scenarios (character_id, title, description, audio_script, video_prompt, duration, intensity_level, tags, sort_order)
SELECT 
    id,
    '特別な夜',
    '忘れられない一夜',
    '「今夜は...ずっと一緒にいて」',
    'Romantic evening setting, soft focus, intimate atmosphere',
    60,
    3,
    ARRAY['ロマンチック', 'インティメート'],
    3
FROM characters WHERE name = 'sakura';

-- サンプルシナリオ（ゆい）
INSERT INTO scenarios (character_id, title, description, audio_script, video_prompt, duration, intensity_level, tags, sort_order)
SELECT 
    id,
    'パーティーでの出会い',
    '賑やかなパーティーでの運命的な出会い',
    '「ねぇ、一緒に踊らない？楽しもうよ！」',
    'Young woman at party, energetic, colorful lights, dancing',
    30,
    2,
    ARRAY['パーティー', 'アクティブ', '明るい'],
    1
FROM characters WHERE name = 'yui';

INSERT INTO scenarios (character_id, title, description, audio_script, video_prompt, duration, intensity_level, tags, sort_order)
SELECT 
    id,
    'ビーチデート',
    '夏の海での開放的なデート',
    '「海って最高！一緒に泳ごう！」',
    'Beach setting, summer vibes, playful atmosphere',
    45,
    3,
    ARRAY['ビーチ', '夏', 'アクティブ'],
    2
FROM characters WHERE name = 'yui';

INSERT INTO scenarios (character_id, title, description, audio_script, video_prompt, duration, intensity_level, tags, sort_order)
SELECT 
    id,
    'ナイトクラブ',
    '夜の街での刺激的な時間',
    '「今夜は朝まで一緒にいよう」',
    'Nightclub setting, neon lights, energetic atmosphere',
    60,
    4,
    ARRAY['ナイトライフ', 'エキサイティング'],
    3
FROM characters WHERE name = 'yui';

-- テストユーザー（パスワード: 'password123'）
-- 注意: 本番環境では使用しないこと
INSERT INTO users (email, password_hash, plan_type, usage_count, usage_limit, age_verified, age_verified_at, email_verified) VALUES
('test@example.com', '$2b$10$YourHashedPasswordHere', 'free', 0, 0, true, NOW(), true),
('standard@example.com', '$2b$10$YourHashedPasswordHere', 'standard', 5, 20, true, NOW(), true),
('premium@example.com', '$2b$10$YourHashedPasswordHere', 'premium', 3, 15, true, NOW(), true);