-- Extended profiles with location
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS latitude FLOAT8;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS longitude FLOAT8;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS headline TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS hourly_rate INTEGER;

-- Trainer profiles extended info
CREATE TABLE trainer_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  headline TEXT,
  certifications TEXT[],
  specialties TEXT[],
  service_radius_km INTEGER DEFAULT 25,
  is_online BOOLEAN DEFAULT true,
  is_in_person BOOLEAN DEFAULT true,
  accepts_new_clients BOOLEAN DEFAULT true,
  stripe_account_id TEXT,
  stripe_onboarding_complete BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id)
);

-- Listings/Offers
CREATE TABLE listings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trainer_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  listing_type TEXT NOT NULL CHECK (listing_type IN ('single_session', 'monthly_coaching', 'recurring_package', 'custom')),
  price INTEGER NOT NULL,
  billing_interval TEXT CHECK (billing_interval IN ('one_time', 'weekly', 'monthly', 'per_session')),
  duration_minutes INTEGER DEFAULT 60,
  location_type TEXT NOT NULL CHECK (location_type IN ('in_person', 'online', 'hybrid')),
  max_participants INTEGER DEFAULT 1,
  includes TEXT[],
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Availability schedule
CREATE TABLE availability (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trainer_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  day_of_week INTEGER NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6),
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  is_available BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Blocked dates (time off)
CREATE TABLE blocked_dates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trainer_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  blocked_date DATE NOT NULL,
  reason TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Bookings
CREATE TABLE bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  trainer_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  listing_id UUID REFERENCES listings(id) ON DELETE SET NULL,
  scheduled_date DATE NOT NULL,
  scheduled_time TIME NOT NULL,
  end_time TIME,
  duration_minutes INTEGER DEFAULT 60,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'completed', 'cancelled', 'no_show')),
  location_type TEXT CHECK (location_type IN ('in_person', 'online', 'hybrid')),
  session_notes TEXT,
  total_price INTEGER NOT NULL,
  platform_fee INTEGER NOT NULL DEFAULT 0,
  trainer_payout INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Conversations
CREATE TABLE conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  trainer_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  booking_id UUID REFERENCES bookings(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(client_id, trainer_id)
);

-- Messages (updated to use conversations)
ALTER TABLE messages ADD COLUMN IF NOT EXISTS conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE;

-- Payments
CREATE TABLE payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  client_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  trainer_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  stripe_payment_intent_id TEXT UNIQUE,
  stripe_charge_id TEXT,
  amount INTEGER NOT NULL,
  platform_fee INTEGER NOT NULL,
  trainer_payout INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'succeeded', 'failed', 'refunded')),
  payout_status TEXT DEFAULT 'pending' CHECK (payout_status IN ('pending', 'paid', 'failed')),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Saved trainers
CREATE TABLE saved_trainers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  trainer_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(client_id, trainer_id)
);

-- Enable RLS on new tables
ALTER TABLE trainer_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE listings ENABLE ROW LEVEL SECURITY;
ALTER TABLE availability ENABLE ROW LEVEL SECURITY;
ALTER TABLE blocked_dates ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE saved_trainers ENABLE ROW LEVEL SECURITY;

-- Trainer profiles policies
CREATE POLICY "trainer_profiles_select" ON trainer_profiles FOR SELECT TO authenticated USING (true);
CREATE POLICY "trainer_profiles_insert" ON trainer_profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "trainer_profiles_update" ON trainer_profiles FOR UPDATE TO authenticated USING (auth.uid() = user_id);

-- Listings policies
CREATE POLICY "listings_select" ON listings FOR SELECT TO authenticated USING (is_active = true OR auth.uid() = trainer_id);
CREATE POLICY "listings_insert" ON listings FOR INSERT TO authenticated WITH CHECK (auth.uid() = trainer_id);
CREATE POLICY "listings_update" ON listings FOR UPDATE TO authenticated USING (auth.uid() = trainer_id);
CREATE POLICY "listings_delete" ON listings FOR DELETE TO authenticated USING (auth.uid() = trainer_id);

-- Availability policies
CREATE POLICY "availability_select" ON availability FOR SELECT TO authenticated USING (true);
CREATE POLICY "availability_insert" ON availability FOR INSERT TO authenticated WITH CHECK (auth.uid() = trainer_id);
CREATE POLICY "availability_update" ON availability FOR UPDATE TO authenticated USING (auth.uid() = trainer_id);
CREATE POLICY "availability_delete" ON availability FOR DELETE TO authenticated USING (auth.uid() = trainer_id);

-- Blocked dates policies
CREATE POLICY "blocked_dates_select" ON blocked_dates FOR SELECT TO authenticated USING (true);
CREATE POLICY "blocked_dates_insert" ON blocked_dates FOR INSERT TO authenticated WITH CHECK (auth.uid() = trainer_id);
CREATE POLICY "blocked_dates_delete" ON blocked_dates FOR DELETE TO authenticated USING (auth.uid() = trainer_id);

-- Bookings policies
CREATE POLICY "bookings_select" ON bookings FOR SELECT TO authenticated USING (auth.uid() = client_id OR auth.uid() = trainer_id);
CREATE POLICY "bookings_insert" ON bookings FOR INSERT TO authenticated WITH CHECK (auth.uid() = client_id);
CREATE POLICY "bookings_update" ON bookings FOR UPDATE TO authenticated USING (auth.uid() = client_id OR auth.uid() = trainer_id);

-- Conversations policies
CREATE POLICY "conversations_select" ON conversations FOR SELECT TO authenticated USING (auth.uid() = client_id OR auth.uid() = trainer_id);
CREATE POLICY "conversations_insert" ON conversations FOR INSERT TO authenticated WITH CHECK (auth.uid() = client_id OR auth.uid() = trainer_id);

-- Messages policies (update existing)
CREATE POLICY "messages_update" ON messages FOR UPDATE TO authenticated USING (auth.uid() = sender_id OR auth.uid() = receiver_id);

-- Payments policies
CREATE POLICY "payments_select" ON payments FOR SELECT TO authenticated USING (auth.uid() = client_id OR auth.uid() = trainer_id);

-- Saved trainers policies
CREATE POLICY "saved_trainers_select" ON saved_trainers FOR SELECT TO authenticated USING (auth.uid() = client_id);
CREATE POLICY "saved_trainers_insert" ON saved_trainers FOR INSERT TO authenticated WITH CHECK (auth.uid() = client_id);
CREATE POLICY "saved_trainers_delete" ON saved_trainers FOR DELETE TO authenticated USING (auth.uid() = client_id);

-- Indexes for performance
CREATE INDEX idx_listings_trainer ON listings(trainer_id);
CREATE INDEX idx_listings_active ON listings(is_active) WHERE is_active = true;
CREATE INDEX idx_availability_trainer ON availability(trainer_id);
CREATE INDEX idx_blocked_dates_trainer ON blocked_dates(trainer_id);
CREATE INDEX idx_bookings_client ON bookings(client_id);
CREATE INDEX idx_bookings_trainer ON bookings(trainer_id);
CREATE INDEX idx_bookings_date ON bookings(scheduled_date);
CREATE INDEX idx_conversations_client ON conversations(client_id);
CREATE INDEX idx_conversations_trainer ON conversations(trainer_id);
CREATE INDEX idx_messages_conversation ON messages(conversation_id);
CREATE INDEX idx_payments_booking ON payments(booking_id);
CREATE INDEX idx_saved_trainers_client ON saved_trainers(client_id);

-- Function to calculate platform fee (15% commission)
CREATE OR REPLACE FUNCTION calculate_platform_fee(base_price INTEGER)
RETURNS INTEGER AS $$
BEGIN
  RETURN ROUND(base_price * 0.15);
END;
$$ LANGUAGE plpgsql;

-- Function to update timestamps
CREATE OR REPLACE FUNCTION update_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
CREATE TRIGGER trainer_profiles_updated BEFORE UPDATE ON trainer_profiles
  FOR EACH ROW EXECUTE FUNCTION update_timestamp();

CREATE TRIGGER listings_updated BEFORE UPDATE ON listings
  FOR EACH ROW EXECUTE FUNCTION update_timestamp();

CREATE TRIGGER bookings_updated BEFORE UPDATE ON bookings
  FOR EACH ROW EXECUTE FUNCTION update_timestamp();

CREATE TRIGGER conversations_updated BEFORE UPDATE ON conversations
  FOR EACH ROW EXECUTE FUNCTION update_timestamp();

CREATE TRIGGER payments_updated BEFORE UPDATE ON payments
  FOR EACH ROW EXECUTE FUNCTION update_timestamp();