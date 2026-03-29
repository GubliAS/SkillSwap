-- ════════════════════════════════════════════════════════════
-- Run this ENTIRE script in Supabase SQL Editor (one shot)
-- Combines migrations 002, 003, 004, 005
-- ════════════════════════════════════════════════════════════

-- ── 002: Add student_level and course codes to profiles ─────
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS student_level INTEGER CHECK (student_level IN (100, 200, 300, 400)),
  ADD COLUMN IF NOT EXISTS courses_to_teach JSONB NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS courses_to_learn JSONB NOT NULL DEFAULT '[]'::jsonb;

CREATE INDEX IF NOT EXISTS idx_profiles_courses_to_teach ON profiles USING GIN (courses_to_teach);
CREATE INDEX IF NOT EXISTS idx_profiles_courses_to_learn ON profiles USING GIN (courses_to_learn);

-- ── 003: Study Groups ───────────────────────────────────────
CREATE TABLE IF NOT EXISTS study_groups (
  id            UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name          TEXT NOT NULL,
  course_code   TEXT DEFAULT '',
  department    TEXT DEFAULT '',
  creator_id    UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  description   TEXT DEFAULT '',
  max_members   INTEGER DEFAULT 10 CHECK (max_members BETWEEN 3 AND 15),
  schedule_days TEXT[] DEFAULT '{}',
  schedule_time TEXT DEFAULT '',
  location      TEXT DEFAULT '',
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS group_members (
  id         UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  group_id   UUID REFERENCES study_groups(id) ON DELETE CASCADE NOT NULL,
  user_id    UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  role       TEXT DEFAULT 'member' CHECK (role IN ('coordinator', 'member')),
  status     TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved')),
  joined_at  TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (group_id, user_id)
);

CREATE TABLE IF NOT EXISTS group_messages (
  id         UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  group_id   UUID REFERENCES study_groups(id) ON DELETE CASCADE NOT NULL,
  sender_id  UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  content    TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE study_groups   ENABLE ROW LEVEL SECURITY;
ALTER TABLE group_members  ENABLE ROW LEVEL SECURITY;
ALTER TABLE group_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view study groups"
  ON study_groups FOR SELECT USING (true);
CREATE POLICY "Authenticated users can create groups"
  ON study_groups FOR INSERT WITH CHECK (auth.uid() = creator_id);
CREATE POLICY "Creator can update their group"
  ON study_groups FOR UPDATE USING (auth.uid() = creator_id);
CREATE POLICY "Creator can delete their group"
  ON study_groups FOR DELETE USING (auth.uid() = creator_id);

CREATE POLICY "Anyone can view group members"
  ON group_members FOR SELECT USING (true);
CREATE POLICY "Users can request to join groups"
  ON group_members FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Coordinators can approve or remove members"
  ON group_members FOR ALL USING (
    auth.uid() = user_id
    OR EXISTS (
      SELECT 1 FROM group_members gm
      WHERE gm.group_id = group_members.group_id
        AND gm.user_id  = auth.uid()
        AND gm.role     = 'coordinator'
        AND gm.status   = 'approved'
    )
  );

CREATE POLICY "Approved members can read messages"
  ON group_messages FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM group_members gm
      WHERE gm.group_id = group_messages.group_id
        AND gm.user_id  = auth.uid()
        AND gm.status   = 'approved'
    )
  );
CREATE POLICY "Approved members can send messages"
  ON group_messages FOR INSERT WITH CHECK (
    auth.uid() = sender_id
    AND EXISTS (
      SELECT 1 FROM group_members gm
      WHERE gm.group_id = group_messages.group_id
        AND gm.user_id  = auth.uid()
        AND gm.status   = 'approved'
    )
  );

ALTER PUBLICATION supabase_realtime ADD TABLE group_messages;

-- ── 004: Profile extra fields (Phase 3) ─────────────────────
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS whatsapp TEXT DEFAULT '',
  ADD COLUMN IF NOT EXISTS session_duration_pref INTEGER DEFAULT 60,
  ADD COLUMN IF NOT EXISTS learning_goals JSONB DEFAULT '{}'::jsonb;

ALTER TABLE profiles
  ADD CONSTRAINT valid_session_duration CHECK (session_duration_pref IN (30, 60, 120));

-- ── 005: Trust & Safety (Phase 4) ───────────────────────────
CREATE TABLE IF NOT EXISTS reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  reported_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  reported_message_id UUID,
  reason TEXT NOT NULL CHECK (reason IN ('harassment', 'spam', 'inappropriate', 'other')),
  details TEXT DEFAULT '',
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'reviewed', 'dismissed')),
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE reports ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can create reports" ON reports FOR INSERT WITH CHECK (auth.uid() = reporter_id);
CREATE POLICY "Users can view own reports" ON reports FOR SELECT USING (auth.uid() = reporter_id);

CREATE TABLE IF NOT EXISTS blocked_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  blocker_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  blocked_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(blocker_id, blocked_id)
);

ALTER TABLE blocked_users ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own blocks" ON blocked_users FOR ALL USING (auth.uid() = blocker_id);

CREATE TABLE IF NOT EXISTS review_helpful_votes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  voter_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(session_id, voter_id)
);

ALTER TABLE review_helpful_votes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own helpful votes" ON review_helpful_votes FOR ALL USING (auth.uid() = voter_id);

CREATE TABLE IF NOT EXISTS review_replies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  teacher_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(session_id)
);

ALTER TABLE review_replies ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read review replies" ON review_replies FOR SELECT USING (true);
CREATE POLICY "Teachers can reply to their reviews" ON review_replies FOR INSERT WITH CHECK (auth.uid() = teacher_id);
CREATE POLICY "Teachers can update their replies" ON review_replies FOR UPDATE USING (auth.uid() = teacher_id);

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS profile_visibility TEXT DEFAULT 'public',
  ADD COLUMN IF NOT EXISTS response_rate REAL DEFAULT 0;

ALTER TABLE profiles
  ADD CONSTRAINT valid_visibility CHECK (profile_visibility IN ('public', 'department'));
