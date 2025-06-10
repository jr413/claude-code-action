-- Seed data for video streaming platform

-- Insert test categories
INSERT INTO categories (name, slug, description) VALUES
('Entertainment', 'entertainment', 'General entertainment content'),
('Education', 'education', 'Educational and tutorial content'),
('Music', 'music', 'Music videos and performances'),
('Gaming', 'gaming', 'Gaming content and streams'),
('Technology', 'technology', 'Tech reviews and tutorials');

-- Insert test creators
INSERT INTO creators (name, slug, bio, plan_required, is_featured, category_id) VALUES
('TechMaster', 'techmaster', 'Technology enthusiast sharing the latest tech news and reviews', 'free', true, 
  (SELECT id FROM categories WHERE slug = 'technology')),
('MusicVibes', 'musicvibes', 'Original music performances and covers', 'standard', true,
  (SELECT id FROM categories WHERE slug = 'music')),
('GamePro', 'gamepro', 'Professional gamer with tips and walkthroughs', 'premium', false,
  (SELECT id FROM categories WHERE slug = 'gaming')),
('EduExpert', 'eduexpert', 'Making education fun and accessible', 'free', false,
  (SELECT id FROM categories WHERE slug = 'education'));

-- Insert test videos
INSERT INTO videos (title, slug, description, creator_id, duration_seconds, quality, plan_required, status, published_at) VALUES
('Getting Started with React', 'getting-started-react', 'Learn the basics of React development', 
  (SELECT id FROM creators WHERE slug = 'techmaster'), 1800, '720p', 'free', 'published', NOW() - INTERVAL '5 days'),
('Advanced TypeScript Patterns', 'advanced-typescript', 'Deep dive into TypeScript patterns', 
  (SELECT id FROM creators WHERE slug = 'techmaster'), 2400, '1080p', 'standard', 'published', NOW() - INTERVAL '3 days'),
('Acoustic Guitar Session', 'acoustic-guitar-session', 'Live acoustic performance', 
  (SELECT id FROM creators WHERE slug = 'musicvibes'), 900, '1080p', 'standard', 'published', NOW() - INTERVAL '7 days'),
('Game Strategy Guide', 'game-strategy-guide', 'Master the latest gaming strategies', 
  (SELECT id FROM creators WHERE slug = 'gamepro'), 3600, '4k', 'premium', 'published', NOW() - INTERVAL '1 day'),
('Math Made Easy', 'math-made-easy', 'Simple explanations for complex math concepts', 
  (SELECT id FROM creators WHERE slug = 'eduexpert'), 1200, '720p', 'free', 'published', NOW() - INTERVAL '10 days');

-- Insert a test admin user (password: admin123)
INSERT INTO users (email, username, password_hash, full_name, role, email_verified) VALUES
('admin@example.com', 'admin', '$2a$10$YKxDqGj2rM0YeEPiYK7zNuXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX', 'Admin User', 'admin', true);

-- Note: In production, never store plain text passwords or use predictable admin credentials