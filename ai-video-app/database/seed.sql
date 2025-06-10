-- Seed data for AI Video Platform

-- Insert categories
INSERT INTO categories (id, name, slug, description) VALUES
    ('550e8400-e29b-41d4-a716-446655440001', 'アニメーション', 'animation', 'アニメーション動画コンテンツ'),
    ('550e8400-e29b-41d4-a716-446655440002', 'ドラマ', 'drama', 'ドラマ系動画コンテンツ'),
    ('550e8400-e29b-41d4-a716-446655440003', 'エンターテインメント', 'entertainment', 'エンターテインメント動画'),
    ('550e8400-e29b-41d4-a716-446655440004', 'ミュージック', 'music', '音楽関連動画'),
    ('550e8400-e29b-41d4-a716-446655440005', 'バーチャル', 'virtual', 'バーチャルキャラクター動画');

-- Insert creators
INSERT INTO creators (id, name, slug, bio, verified) VALUES
    ('650e8400-e29b-41d4-a716-446655440001', 'AI Studio Pro', 'ai-studio-pro', '最先端のAI動画制作スタジオ', true),
    ('650e8400-e29b-41d4-a716-446655440002', 'Virtual Dreams', 'virtual-dreams', 'バーチャルコンテンツ専門クリエイター', true),
    ('650e8400-e29b-41d4-a716-446655440003', 'Next Gen Media', 'next-gen-media', '次世代メディアコンテンツ制作', false);

-- Insert sample content
INSERT INTO content (id, title, description, category_id, creator_id, plan_required, duration) VALUES
    ('750e8400-e29b-41d4-a716-446655440001', 
     'AIアシスタント紹介動画', 
     'AI技術を使った革新的なアシスタントの紹介', 
     '550e8400-e29b-41d4-a716-446655440003', 
     '650e8400-e29b-41d4-a716-446655440001', 
     'free', 
     180),
    
    ('750e8400-e29b-41d4-a716-446655440002', 
     'バーチャルキャラクター ライブ配信', 
     '人気バーチャルキャラクターによる特別配信', 
     '550e8400-e29b-41d4-a716-446655440005', 
     '650e8400-e29b-41d4-a716-446655440002', 
     'standard', 
     600),
    
    ('750e8400-e29b-41d4-a716-446655440003', 
     'プレミアムAI映像体験', 
     '最高品質のAI生成映像をお楽しみください', 
     '550e8400-e29b-41d4-a716-446655440001', 
     '650e8400-e29b-41d4-a716-446655440001', 
     'premium', 
     480),
    
    ('750e8400-e29b-41d4-a716-446655440004', 
     'AI音楽ビデオコレクション', 
     'AI生成による革新的な音楽ビデオ集', 
     '550e8400-e29b-41d4-a716-446655440004', 
     '650e8400-e29b-41d4-a716-446655440003', 
     'free', 
     240),
    
    ('750e8400-e29b-41d4-a716-446655440005', 
     'インタラクティブドラマ体験', 
     '視聴者の選択で変わるAIドラマ', 
     '550e8400-e29b-41d4-a716-446655440002', 
     '650e8400-e29b-41d4-a716-446655440001', 
     'premium', 
     900);

-- Insert test user (password: testpassword123)
-- Note: In production, passwords should be properly hashed
INSERT INTO users (email, password_hash, username, plan_type, age_verified) VALUES
    ('test@example.com', '$2a$10$YourHashedPasswordHere', 'testuser', 'free', true);

-- Note: This is sample data for development/testing purposes only