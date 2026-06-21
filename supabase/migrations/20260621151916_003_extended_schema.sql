-- Drop and recreate trainer_profiles with extended fields
ALTER TABLE trainer_profiles
  ADD COLUMN IF NOT EXISTS trainer_type TEXT DEFAULT 'individual' CHECK (trainer_type IN ('individual', 'business')),
  ADD COLUMN IF NOT EXISTS business_name TEXT,
  ADD COLUMN IF NOT EXISTS legal_name TEXT,
  ADD COLUMN IF NOT EXISTS business_tax_id TEXT,
  ADD COLUMN IF NOT EXISTS personal_tax_id TEXT,
  ADD COLUMN IF NOT EXISTS website_url TEXT,
  ADD COLUMN IF NOT EXISTS phone TEXT,
  ADD COLUMN IF NOT EXISTS social_links JSONB DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS stripe_account_status TEXT DEFAULT 'not_started'
    CHECK (stripe_account_status IN ('not_started', 'pending', 'verified', 'restricted', 'rejected')),
  ADD COLUMN IF NOT EXISTS stripe_onboarding_completed BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS payout_enabled BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS account_capabilities JSONB DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS service_mode TEXT DEFAULT 'hybrid' CHECK (service_mode IN ('in_person', 'online', 'hybrid')),
  ADD COLUMN IF NOT EXISTS service_radius_miles INTEGER DEFAULT 20,
  ADD COLUMN IF NOT EXISTS verification_status TEXT DEFAULT 'unverified' CHECK (verification_status IN ('unverified', 'pending', 'verified', 'rejected')),
  ADD COLUMN IF NOT EXISTS onboarding_step INTEGER DEFAULT 1,
  ADD COLUMN IF NOT EXISTS profile_complete BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS active BOOLEAN DEFAULT false;

-- Update profiles table with extended fields
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS display_name TEXT,
  ADD COLUMN IF NOT EXISTS phone TEXT,
  ADD COLUMN IF NOT EXISTS location_city TEXT,
  ADD COLUMN IF NOT EXISTS location_state TEXT,
  ADD COLUMN IF NOT EXISTS location_country TEXT DEFAULT 'US',
  ADD COLUMN IF NOT EXISTS profile_photo_url TEXT;

-- Earnings ledger
CREATE TABLE IF NOT EXISTS earnings_ledger (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trainer_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  booking_id UUID REFERENCES bookings(id) ON DELETE SET NULL,
  gross_amount INTEGER NOT NULL,
  platform_fee_amount INTEGER NOT NULL,
  net_amount INTEGER NOT NULL,
  currency TEXT DEFAULT 'usd',
  payout_status TEXT DEFAULT 'pending' CHECK (payout_status IN ('pending', 'paid', 'failed', 'refunded', 'disputed')),
  stripe_balance_transaction_id TEXT,
  stripe_payout_id TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Sessions table for granular session tracking
CREATE TABLE IF NOT EXISTS sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  trainer_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  client_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  session_date DATE NOT NULL,
  session_status TEXT DEFAULT 'scheduled' CHECK (session_status IN ('scheduled', 'completed', 'cancelled', 'no_show')),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Client-trainer relationships
CREATE TABLE IF NOT EXISTS client_trainer_relationships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  trainer_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  booking_id UUID REFERENCES bookings(id) ON DELETE SET NULL,
  relationship_status TEXT DEFAULT 'active' CHECK (relationship_status IN ('active', 'inactive', 'blocked')),
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(client_id, trainer_id)
);

-- Stripe events log (idempotency)
CREATE TABLE IF NOT EXISTS stripe_webhook_events (
  id TEXT PRIMARY KEY,
  event_type TEXT NOT NULL,
  processed BOOLEAN DEFAULT false,
  payload JSONB,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Platform config (admin settings)
CREATE TABLE IF NOT EXISTS platform_config (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  description TEXT,
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Blog posts
CREATE TABLE IF NOT EXISTS blog_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  meta_title TEXT,
  meta_description TEXT,
  excerpt TEXT,
  body TEXT NOT NULL DEFAULT '',
  author_id UUID,
  category_id UUID,
  tags TEXT[],
  featured_image TEXT,
  published_at TIMESTAMPTZ,
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Blog categories
CREATE TABLE IF NOT EXISTS blog_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Blog authors
CREATE TABLE IF NOT EXISTS blog_authors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  bio TEXT,
  avatar TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Add foreign keys after tables created
ALTER TABLE blog_posts
  ADD COLUMN IF NOT EXISTS author_fk_set BOOLEAN DEFAULT false;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'blog_posts_author_fk'
  ) THEN
    ALTER TABLE blog_posts ADD CONSTRAINT blog_posts_author_fk
      FOREIGN KEY (author_id) REFERENCES blog_authors(id) ON DELETE SET NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'blog_posts_category_fk'
  ) THEN
    ALTER TABLE blog_posts ADD CONSTRAINT blog_posts_category_fk
      FOREIGN KEY (category_id) REFERENCES blog_categories(id) ON DELETE SET NULL;
  END IF;
END $$;

ALTER TABLE blog_posts DROP COLUMN IF EXISTS author_fk_set;

-- Update bookings with extended Stripe fields
ALTER TABLE bookings
  ADD COLUMN IF NOT EXISTS stripe_checkout_session_id TEXT,
  ADD COLUMN IF NOT EXISTS stripe_transfer_id TEXT,
  ADD COLUMN IF NOT EXISTS payment_status TEXT DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'failed', 'refunded', 'disputed'));

-- Seed platform config defaults
INSERT INTO platform_config (key, value, description) VALUES
  ('commission_rate', '0.15', 'Platform commission rate (0–1)'),
  ('commission_label', '15', 'Display label for commission %'),
  ('platform_name', 'P-Train', 'Platform display name'),
  ('support_email', 'support@ptrain.app', 'Support email address'),
  ('listing_types', '["single_session","monthly_coaching","recurring_package","custom"]', 'Supported listing types'),
  ('billing_intervals', '["one_time","per_session","weekly","monthly"]', 'Supported billing intervals')
ON CONFLICT (key) DO NOTHING;

-- Enable RLS on new tables
ALTER TABLE earnings_ledger ENABLE ROW LEVEL SECURITY;
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE client_trainer_relationships ENABLE ROW LEVEL SECURITY;
ALTER TABLE stripe_webhook_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE blog_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE blog_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE blog_authors ENABLE ROW LEVEL SECURITY;
ALTER TABLE platform_config ENABLE ROW LEVEL SECURITY;

-- Earnings ledger policies
CREATE POLICY "earnings_select" ON earnings_ledger FOR SELECT TO authenticated USING (auth.uid() = trainer_id);
CREATE POLICY "earnings_insert" ON earnings_ledger FOR INSERT TO authenticated WITH CHECK (auth.uid() = trainer_id);

-- Sessions policies
CREATE POLICY "sessions_select" ON sessions FOR SELECT TO authenticated USING (auth.uid() = trainer_id OR auth.uid() = client_id);
CREATE POLICY "sessions_insert" ON sessions FOR INSERT TO authenticated WITH CHECK (auth.uid() = trainer_id OR auth.uid() = client_id);
CREATE POLICY "sessions_update" ON sessions FOR UPDATE TO authenticated USING (auth.uid() = trainer_id);

-- Client-trainer relationship policies
CREATE POLICY "ctr_select" ON client_trainer_relationships FOR SELECT TO authenticated USING (auth.uid() = client_id OR auth.uid() = trainer_id);
CREATE POLICY "ctr_insert" ON client_trainer_relationships FOR INSERT TO authenticated WITH CHECK (auth.uid() = client_id OR auth.uid() = trainer_id);
CREATE POLICY "ctr_update" ON client_trainer_relationships FOR UPDATE TO authenticated USING (auth.uid() = trainer_id);

-- Blog: public read for published posts
CREATE POLICY "blog_posts_public_read" ON blog_posts FOR SELECT USING (status = 'published' OR auth.role() = 'authenticated');
CREATE POLICY "blog_categories_public_read" ON blog_categories FOR SELECT USING (true);
CREATE POLICY "blog_authors_public_read" ON blog_authors FOR SELECT USING (true);

-- Platform config: authenticated read
CREATE POLICY "platform_config_read" ON platform_config FOR SELECT TO authenticated USING (true);

-- Stripe webhook events: service role only (no public access)
CREATE POLICY "stripe_events_service" ON stripe_webhook_events FOR ALL USING (false);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_earnings_trainer ON earnings_ledger(trainer_id);
CREATE INDEX IF NOT EXISTS idx_earnings_booking ON earnings_ledger(booking_id);
CREATE INDEX IF NOT EXISTS idx_sessions_booking ON sessions(booking_id);
CREATE INDEX IF NOT EXISTS idx_sessions_trainer ON sessions(trainer_id);
CREATE INDEX IF NOT EXISTS idx_ctr_trainer ON client_trainer_relationships(trainer_id);
CREATE INDEX IF NOT EXISTS idx_ctr_client ON client_trainer_relationships(client_id);
CREATE INDEX IF NOT EXISTS idx_blog_posts_slug ON blog_posts(slug);
CREATE INDEX IF NOT EXISTS idx_blog_posts_status ON blog_posts(status);
CREATE INDEX IF NOT EXISTS idx_blog_posts_published ON blog_posts(published_at);

-- Trigger for earnings_ledger updated_at
CREATE TRIGGER earnings_updated BEFORE UPDATE ON earnings_ledger
  FOR EACH ROW EXECUTE FUNCTION update_timestamp();

-- Seed some blog content for demo
INSERT INTO blog_authors (id, name, bio, avatar) VALUES
  ('00000000-0000-0000-0000-000000000001', 'P-Train Team', 'Expert advice from the P-Train editorial team.', 'https://api.dicebear.com/7.x/shapes/svg?seed=ptrain')
ON CONFLICT DO NOTHING;

INSERT INTO blog_categories (id, slug, name, description) VALUES
  ('00000000-0000-0000-0000-000000000010', 'fitness-tips', 'Fitness Tips', 'Actionable advice for your fitness journey'),
  ('00000000-0000-0000-0000-000000000011', 'training-guides', 'Training Guides', 'In-depth training programs and guides'),
  ('00000000-0000-0000-0000-000000000012', 'nutrition', 'Nutrition', 'Fuel your workouts with the right nutrition'),
  ('00000000-0000-0000-0000-000000000013', 'trainer-spotlight', 'Trainer Spotlight', 'Meet the trainers on P-Train')
ON CONFLICT DO NOTHING;

INSERT INTO blog_posts (slug, title, meta_title, meta_description, excerpt, body, author_id, category_id, tags, status, published_at) VALUES
  ('how-to-find-the-right-personal-trainer', 'How to Find the Right Personal Trainer', 'How to Find the Right Personal Trainer | P-Train', 'Choosing a personal trainer is a big decision. Here are the key factors to evaluate when searching for your ideal fitness match.', 'Finding the right trainer can transform your fitness journey. We break down exactly what to look for.', '# How to Find the Right Personal Trainer

Finding the right personal trainer can be the difference between hitting your goals and spinning your wheels. Here''s what to look for.

## 1. Define Your Goals First

Before you search for a trainer, get clear on what you want. Weight loss, muscle gain, sports performance, or general fitness all require different expertise.

## 2. Check Credentials

Look for trainers certified by recognized organizations: NASM, ACE, CSCS, or ACSM. Specialty certifications matter too.

## 3. Consider Format

Do you want in-person sessions, online coaching, or hybrid? Online training offers flexibility; in-person offers immediate form correction.

## 4. Read Reviews

Past client reviews tell you more than any bio. Look for consistent patterns—not just one great review.

## 5. Try a Consultation

Most good trainers offer a free or low-cost consultation. Use it to assess their communication style and whether you click.

P-Train makes all of this easy with verified profiles, real reviews, and instant messaging before you book.', '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000010', ARRAY['finding a trainer', 'personal training', 'fitness tips'], 'published', NOW() - INTERVAL '7 days'),
  ('online-vs-in-person-training', 'Online vs. In-Person Personal Training: Which Is Right for You?', 'Online vs In-Person Training | P-Train', 'Comparing online and in-person personal training to help you decide which format fits your lifestyle and goals.', 'Both formats have real advantages. Here''s how to decide which is right for your lifestyle and goals.', '# Online vs. In-Person Personal Training

The debate between online and in-person training has heated up in recent years. Here''s an honest breakdown.

## In-Person Training

**Pros:**
- Immediate form correction
- Physical spotting on heavy lifts
- Stronger accountability
- Better for beginners

**Cons:**
- More expensive
- Location-dependent
- Scheduling friction

## Online Training

**Pros:**
- Train anywhere, anytime
- Often more affordable
- Access to trainers outside your city
- Flexible programming

**Cons:**
- No physical spotting
- Form feedback is delayed
- Requires self-motivation

## Hybrid Is Often Best

Many P-Train trainers offer hybrid packages—periodic in-person check-ins combined with online programming. This gives you the best of both worlds.', '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000011', ARRAY['online training', 'in-person training', 'personal training'], 'published', NOW() - INTERVAL '3 days')
ON CONFLICT (slug) DO NOTHING;