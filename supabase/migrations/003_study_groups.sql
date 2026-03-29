-- Phase 1b: Study Groups

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

-- ── RLS ───────────────────────────────────────────────────────

ALTER TABLE study_groups   ENABLE ROW LEVEL SECURITY;
ALTER TABLE group_members  ENABLE ROW LEVEL SECURITY;
ALTER TABLE group_messages ENABLE ROW LEVEL SECURITY;

-- study_groups
CREATE POLICY "Anyone can view study groups"
  ON study_groups FOR SELECT USING (true);

CREATE POLICY "Authenticated users can create groups"
  ON study_groups FOR INSERT WITH CHECK (auth.uid() = creator_id);

CREATE POLICY "Creator can update their group"
  ON study_groups FOR UPDATE USING (auth.uid() = creator_id);

CREATE POLICY "Creator can delete their group"
  ON study_groups FOR DELETE USING (auth.uid() = creator_id);

-- group_members
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

-- group_messages
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

-- ── Enable Realtime for group_messages ────────────────────────
ALTER PUBLICATION supabase_realtime ADD TABLE group_messages;
