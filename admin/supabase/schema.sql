-- ═══════════════════════════════════════════════════════════════
-- PORTFOLIO DATABASE SCHEMA — Supabase PostgreSQL
-- Run this in Supabase SQL Editor to create all tables
-- ═══════════════════════════════════════════════════════════════

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ── Profiles ────────────────────────────────────────────────
CREATE TABLE profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL DEFAULT '',
  title TEXT DEFAULT '',
  company TEXT DEFAULT '',
  company_role TEXT DEFAULT '',
  bio TEXT DEFAULT '',
  location TEXT DEFAULT '',
  email TEXT DEFAULT '',
  phone TEXT DEFAULT '',
  education TEXT DEFAULT '',
  status TEXT DEFAULT 'Available for Projects',
  status_active BOOLEAN DEFAULT true,
  profile_image TEXT DEFAULT '',
  resume_url TEXT DEFAULT '',
  typing_texts TEXT[] DEFAULT ARRAY['AI Builder', 'Full Stack Developer'],
  hero_cards TEXT[] DEFAULT ARRAY['AI Founder', 'Developer', 'Innovation', 'Projects'],
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── Skills ──────────────────────────────────────────────────
CREATE TABLE skills (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  profile_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  category TEXT DEFAULT 'Programming',
  percentage INTEGER DEFAULT 50 CHECK (percentage >= 0 AND percentage <= 100),
  icon TEXT DEFAULT '⚡',
  sort_order INTEGER DEFAULT 0,
  is_published BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── Projects ────────────────────────────────────────────────
CREATE TABLE projects (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  profile_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT DEFAULT '',
  image TEXT DEFAULT '',
  technologies TEXT[] DEFAULT '{}',
  github_url TEXT DEFAULT '',
  live_url TEXT DEFAULT '',
  category TEXT DEFAULT 'Web',
  status TEXT DEFAULT 'Active',
  sort_order INTEGER DEFAULT 0,
  is_published BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── Experience ──────────────────────────────────────────────
CREATE TABLE experience (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  profile_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  organization TEXT NOT NULL,
  position TEXT DEFAULT '',
  start_date TEXT DEFAULT '',
  end_date TEXT DEFAULT 'Present',
  description TEXT DEFAULT '',
  technologies TEXT[] DEFAULT '{}',
  location TEXT DEFAULT '',
  sort_order INTEGER DEFAULT 0,
  is_published BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── Education ───────────────────────────────────────────────
CREATE TABLE education (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  profile_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  institution TEXT NOT NULL,
  degree TEXT DEFAULT '',
  department TEXT DEFAULT '',
  start_year TEXT DEFAULT '',
  end_year TEXT DEFAULT '',
  description TEXT DEFAULT '',
  grade TEXT DEFAULT '',
  sort_order INTEGER DEFAULT 0,
  is_published BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── Certificates ────────────────────────────────────────────
CREATE TABLE certificates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  profile_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  organization TEXT DEFAULT '',
  date TEXT DEFAULT '',
  credential_id TEXT DEFAULT '',
  credential_url TEXT DEFAULT '',
  image TEXT DEFAULT '',
  sort_order INTEGER DEFAULT 0,
  is_published BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── Achievements ────────────────────────────────────────────
CREATE TABLE achievements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  profile_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT DEFAULT '',
  category TEXT DEFAULT 'Recognition',
  date TEXT DEFAULT '',
  icon TEXT DEFAULT '🏆',
  sort_order INTEGER DEFAULT 0,
  is_published BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── Social Links ────────────────────────────────────────────
CREATE TABLE social_links (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  profile_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  platform TEXT NOT NULL,
  url TEXT DEFAULT '',
  is_custom BOOLEAN DEFAULT false,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── Contact Messages ────────────────────────────────────────
CREATE TABLE contact_messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  profile_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  message TEXT NOT NULL,
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── Site Settings ───────────────────────────────────────────
CREATE TABLE site_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  profile_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  primary_color TEXT DEFAULT '#00ff88',
  secondary_color TEXT DEFAULT '#00d4ff',
  glass_opacity REAL DEFAULT 0.08,
  blur_intensity INTEGER DEFAULT 20,
  border_radius INTEGER DEFAULT 16,
  shadow_strength REAL DEFAULT 0.3,
  background_style TEXT DEFAULT 'particles',
  particle_density INTEGER DEFAULT 80,
  animation_speed REAL DEFAULT 1.0,
  font_family TEXT DEFAULT 'Inter',
  section_spacing INTEGER DEFAULT 100,
  theme TEXT DEFAULT 'dark',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── SEO Settings ────────────────────────────────────────────
CREATE TABLE seo_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  profile_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  title TEXT DEFAULT '',
  description TEXT DEFAULT '',
  keywords TEXT DEFAULT '',
  og_image TEXT DEFAULT '',
  twitter_handle TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── About Stats ─────────────────────────────────────────────
CREATE TABLE about_stats (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  profile_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  label TEXT NOT NULL,
  value INTEGER DEFAULT 0,
  icon TEXT DEFAULT 'star',
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── About Detail ────────────────────────────────────────────
CREATE TABLE about_detail (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  profile_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  introduction TEXT DEFAULT '',
  experience TEXT DEFAULT '',
  interests TEXT DEFAULT '',
  career_goals TEXT DEFAULT '',
  summary TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ══════════════════════════════════════════════════════════════
-- ROW LEVEL SECURITY
-- ══════════════════════════════════════════════════════════════

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE skills ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE experience ENABLE ROW LEVEL SECURITY;
ALTER TABLE education ENABLE ROW LEVEL SECURITY;
ALTER TABLE certificates ENABLE ROW LEVEL SECURITY;
ALTER TABLE achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE social_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE contact_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE site_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE seo_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE about_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE about_detail ENABLE ROW LEVEL SECURITY;

-- Public read (published items only)
CREATE POLICY "Public read published" ON skills FOR SELECT USING (is_published = true);
CREATE POLICY "Public read published" ON projects FOR SELECT USING (is_published = true);
CREATE POLICY "Public read published" ON experience FOR SELECT USING (is_published = true);
CREATE POLICY "Public read published" ON education FOR SELECT USING (is_published = true);
CREATE POLICY "Public read published" ON certificates FOR SELECT USING (is_published = true);
CREATE POLICY "Public read published" ON achievements FOR SELECT USING (is_published = true);
CREATE POLICY "Public read profiles" ON profiles FOR SELECT USING (true);
CREATE POLICY "Public read social" ON social_links FOR SELECT USING (true);
CREATE POLICY "Public read settings" ON site_settings FOR SELECT USING (true);
CREATE POLICY "Public read seo" ON seo_settings FOR SELECT USING (true);
CREATE POLICY "Public read stats" ON about_stats FOR SELECT USING (true);
CREATE POLICY "Public read about" ON about_detail FOR SELECT USING (true);

-- Public can insert messages
CREATE POLICY "Public insert messages" ON contact_messages FOR INSERT WITH CHECK (true);

-- Admin full access (authenticated users)
CREATE POLICY "Admin full access" ON profiles FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Admin full access" ON skills FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Admin full access" ON projects FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Admin full access" ON experience FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Admin full access" ON education FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Admin full access" ON certificates FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Admin full access" ON achievements FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Admin full access" ON social_links FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Admin full access" ON contact_messages FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Admin full access" ON site_settings FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Admin full access" ON seo_settings FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Admin full access" ON about_stats FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Admin full access" ON about_detail FOR ALL USING (auth.role() = 'authenticated');

-- ══════════════════════════════════════════════════════════════
-- INDEXES
-- ══════════════════════════════════════════════════════════════
CREATE INDEX idx_skills_profile ON skills(profile_id);
CREATE INDEX idx_projects_profile ON projects(profile_id);
CREATE INDEX idx_experience_profile ON experience(profile_id);
CREATE INDEX idx_education_profile ON education(profile_id);
CREATE INDEX idx_certificates_profile ON certificates(profile_id);
CREATE INDEX idx_achievements_profile ON achievements(profile_id);
CREATE INDEX idx_messages_profile ON contact_messages(profile_id);
CREATE INDEX idx_messages_read ON contact_messages(is_read);

-- ══════════════════════════════════════════════════════════════
-- UPDATED_AT TRIGGER
-- ══════════════════════════════════════════════════════════════
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_updated_at BEFORE UPDATE ON profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON skills FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON projects FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON experience FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON education FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON certificates FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON achievements FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON site_settings FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON seo_settings FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON about_detail FOR EACH ROW EXECUTE FUNCTION update_updated_at();
