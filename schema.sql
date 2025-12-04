-- ============================================================================
-- FairGig Proctoring System - Database Schema
-- ============================================================================

-- 1. PROFILES TABLE
-- User profile information for all actors in the system
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL UNIQUE,
  display_name TEXT,
  role TEXT NOT NULL CHECK (role IN ('student', 'admin', 'proctor', 'support')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  metadata JSONB,
  is_active BOOLEAN DEFAULT TRUE
);

CREATE INDEX idx_profiles_email ON profiles(email);
CREATE INDEX idx_profiles_role ON profiles(role);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Students can view own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Admins can view all profiles" ON profiles
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role IN ('admin', 'proctor')
    )
  );

CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

-- 2. EXAMS TABLE
-- Exam configuration and settings
CREATE TABLE exams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  duration_minutes INTEGER NOT NULL CHECK (duration_minutes > 0),
  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  settings JSONB NOT NULL DEFAULT '{"frameRate": 2, "captureWidth": 640, "captureHeight": 480, "recordingConsent": true}',
  thresholds JSONB NOT NULL DEFAULT '{"focus_threshold": 0.7, "phone_alert_level": "high"}',
  retention_days INTEGER DEFAULT 30 CHECK (retention_days >= 0),
  CHECK (end_time > start_time)
);

CREATE INDEX idx_exams_time_range ON exams(start_time, end_time);

ALTER TABLE exams ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active exams" ON exams
  FOR SELECT USING (is_active = true);

CREATE POLICY "Only admins can manage exams" ON exams
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- 3. EXAM_SESSIONS TABLE
-- Active and historical exam sessions
CREATE TABLE exam_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  exam_id UUID NOT NULL REFERENCES exams(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  started_at TIMESTAMPTZ DEFAULT NOW(),
  ended_at TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'preparing' CHECK (status IN ('preparing', 'in_progress', 'completed', 'aborted')),
  integrity_score REAL DEFAULT 1.0 CHECK (integrity_score >= 0 AND integrity_score <= 1),
  degraded BOOLEAN DEFAULT FALSE,
  device_info JSONB,
  logs JSONB
);

CREATE INDEX idx_sessions_exam ON exam_sessions(exam_id);
CREATE INDEX idx_sessions_student ON exam_sessions(student_id);
CREATE INDEX idx_sessions_status ON exam_sessions(status);
CREATE INDEX idx_sessions_started ON exam_sessions(started_at);

ALTER TABLE exam_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Students can view own sessions" ON exam_sessions
  FOR SELECT USING (auth.uid() = student_id);

CREATE POLICY "Admins can view all sessions" ON exam_sessions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role IN ('admin', 'proctor')
    )
  );

CREATE POLICY "Students can create own sessions" ON exam_sessions
  FOR INSERT WITH CHECK (auth.uid() = student_id);

CREATE POLICY "Students can update own sessions" ON exam_sessions
  FOR UPDATE USING (auth.uid() = student_id);

-- 4. CHEAT_SCORES TABLE
-- Time-series ML inference results
CREATE TABLE cheat_scores (
  id BIGSERIAL PRIMARY KEY,
  session_id UUID NOT NULL REFERENCES exam_sessions(id) ON DELETE CASCADE,
  sequence_number INTEGER NOT NULL,
  timestamp TIMESTAMPTZ NOT NULL,
  focus_score REAL NOT NULL CHECK (focus_score >= 0 AND focus_score <= 1),
  confidence REAL NOT NULL CHECK (confidence >= 0 AND confidence <= 1),
  alerts JSONB NOT NULL DEFAULT '[]',
  metrics JSONB NOT NULL DEFAULT '{}',
  server_latency_ms INTEGER
);

CREATE INDEX idx_cheat_scores_session_time ON cheat_scores(session_id, timestamp);
CREATE INDEX idx_cheat_scores_session_seq ON cheat_scores(session_id, sequence_number);

ALTER TABLE cheat_scores ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Students can view own scores" ON cheat_scores
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM exam_sessions
      WHERE id = session_id AND student_id = auth.uid()
    )
  );

CREATE POLICY "Admins can view all scores" ON cheat_scores
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role IN ('admin', 'proctor')
    )
  );

-- 5. SUSPICIOUS_SNAPSHOTS TABLE
-- Metadata for flagged snapshots
CREATE TABLE suspicious_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES exam_sessions(id) ON DELETE CASCADE,
  timestamp TIMESTAMPTZ NOT NULL,
  event_code TEXT NOT NULL,
  severity TEXT NOT NULL CHECK (severity IN ('low', 'medium', 'high')),
  storage_path TEXT,
  ml_confidence REAL NOT NULL CHECK (ml_confidence >= 0 AND ml_confidence <= 1),
  admin_review_status TEXT DEFAULT 'pending' CHECK (admin_review_status IN ('pending', 'confirmed', 'false_positive')),
  notes TEXT
);

CREATE INDEX idx_snapshots_session_time ON suspicious_snapshots(session_id, timestamp);
CREATE INDEX idx_snapshots_review_status ON suspicious_snapshots(admin_review_status);

ALTER TABLE suspicious_snapshots ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Students can view own snapshots" ON suspicious_snapshots
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM exam_sessions
      WHERE id = session_id AND student_id = auth.uid()
    )
  );

CREATE POLICY "Admins can view all snapshots" ON suspicious_snapshots
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role IN ('admin', 'proctor', 'support')
    )
  );

CREATE POLICY "Admins can update snapshots" ON suspicious_snapshots
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role IN ('admin', 'proctor')
    )
  );

-- 6. VIDEO_METADATA TABLE (Optional)
-- Full video recording metadata
CREATE TABLE video_metadata (
  session_id UUID PRIMARY KEY REFERENCES exam_sessions(id) ON DELETE CASCADE,
  recording_url TEXT NOT NULL,
  size_bytes BIGINT NOT NULL,
  duration_seconds INTEGER NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE video_metadata ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Students can view own video metadata" ON video_metadata
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM exam_sessions
      WHERE id = session_id AND student_id = auth.uid()
    )
  );

CREATE POLICY "Admins can view all video metadata" ON video_metadata
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role IN ('admin', 'proctor', 'support')
    )
  );

-- 7. AUDIT_LOGS TABLE
-- Immutable audit trail
CREATE TABLE audit_logs (
  id BIGSERIAL PRIMARY KEY,
  actor_id UUID NOT NULL REFERENCES profiles(id),
  action TEXT NOT NULL,
  resource_type TEXT,
  resource_id TEXT,
  details JSONB NOT NULL DEFAULT '{}',
  timestamp TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_audit_logs_actor ON audit_logs(actor_id);
CREATE INDEX idx_audit_logs_timestamp ON audit_logs(timestamp);

ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Only admins can view audit logs" ON audit_logs
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role IN ('admin', 'support')
    )
  );

CREATE POLICY "No updates allowed" ON audit_logs FOR UPDATE USING (false);
CREATE POLICY "No deletes allowed" ON audit_logs FOR DELETE USING (false);

-- ============================================================================
-- STORAGE BUCKETS
-- ============================================================================

-- Create snapshots bucket (run in Supabase Dashboard > Storage)
INSERT INTO storage.buckets (id, name, public)
VALUES ('snapshots', 'snapshots', false)
ON CONFLICT DO NOTHING;

-- ============================================================================
-- SEED DATA (Optional - for testing)
-- ============================================================================

-- Create a sample exam
INSERT INTO exams (id, title, description, duration_minutes, start_time, end_time, is_active)
VALUES 
  (
    gen_random_uuid(),
    'Sample Exam - Computer Science 101',
    'Introduction to Computer Science Final Exam',
    90,
    NOW(),
    NOW() + INTERVAL '7 days',
    true
  )
ON CONFLICT DO NOTHING;
