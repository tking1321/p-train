-- Users table (extends Supabase auth.users)
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  name TEXT NOT NULL,
  avatar TEXT,
  role TEXT NOT NULL CHECK (role IN ('client', 'trainer')),
  bio TEXT,
  location TEXT,
  years_experience INTEGER,
  certifications TEXT[],
  specialty TEXT[],
  verified BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Programs table
CREATE TABLE programs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trainer_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  price INTEGER NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('one-time', 'monthly')),
  included TEXT[],
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Purchases table
CREATE TABLE purchases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  trainer_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  program_id UUID NOT NULL REFERENCES programs(id) ON DELETE CASCADE,
  program_name TEXT NOT NULL,
  trainer_name TEXT NOT NULL,
  type TEXT NOT NULL,
  price INTEGER NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Messages table
CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  receiver_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  text TEXT NOT NULL,
  read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Reviews table
CREATE TABLE reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trainer_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  client_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  client_name TEXT NOT NULL,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  text TEXT NOT NULL,
  reply TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE programs ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchases ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "profiles_select" ON profiles FOR SELECT
  TO authenticated USING (true);

CREATE POLICY "profiles_insert" ON profiles FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = id);

CREATE POLICY "profiles_update" ON profiles FOR UPDATE
  TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

-- Programs policies (public read, trainer manages own)
CREATE POLICY "programs_select" ON programs FOR SELECT
  TO authenticated USING (true);

CREATE POLICY "programs_insert" ON programs FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = trainer_id);

CREATE POLICY "programs_update" ON programs FOR UPDATE
  TO authenticated USING (auth.uid() = trainer_id) WITH CHECK (auth.uid() = trainer_id);

CREATE POLICY "programs_delete" ON programs FOR DELETE
  TO authenticated USING (auth.uid() = trainer_id);

-- Purchases policies
CREATE POLICY "purchases_select" ON purchases FOR SELECT
  TO authenticated USING (auth.uid() = client_id OR auth.uid() = trainer_id);

CREATE POLICY "purchases_insert" ON purchases FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = client_id);

-- Messages policies
CREATE POLICY "messages_select" ON messages FOR SELECT
  TO authenticated USING (auth.uid() = sender_id OR auth.uid() = receiver_id);

CREATE POLICY "messages_insert" ON messages FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = sender_id);

-- Reviews policies
CREATE POLICY "reviews_select" ON reviews FOR SELECT
  TO authenticated USING (true);

CREATE POLICY "reviews_insert" ON reviews FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = client_id);

CREATE POLICY "reviews_update_reply" ON reviews FOR UPDATE
  TO authenticated USING (auth.uid() = trainer_id);

-- Indexes for performance
CREATE INDEX idx_programs_trainer_id ON programs(trainer_id);
CREATE INDEX idx_purchases_client_id ON purchases(client_id);
CREATE INDEX idx_purchases_trainer_id ON purchases(trainer_id);
CREATE INDEX idx_messages_sender_id ON messages(sender_id);
CREATE INDEX idx_messages_receiver_id ON messages(receiver_id);
CREATE INDEX idx_reviews_trainer_id ON reviews(trainer_id);