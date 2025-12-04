-- ============================================================================
-- FairGig Proctoring System - Complete Database Schema
-- Run this entire file in Supabase SQL Editor
-- ============================================================================

-- 1. PROFILES TABLE
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL UNIQUE,
  display_name TEXT,
  role TEXT NOT NULL CHECK (role IN ('student', 'admin', 'proctor', 'support')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  metadata JSONB,
  is_active BOOLEAN DEFAULT TRUE
);

CREATE INDEX IF NOT EXISTS idx_profiles_email ON profiles(email);
CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Students can view own profile" ON profiles;
CREATE POLICY "Students can view own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

DROP POLICY IF EXISTS "Admins can view all profiles" ON profiles;
CREATE POLICY "Admins can view all profiles" ON profiles
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role IN ('admin', 'proctor')
    )
  );

DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

-- 2. EXAMS TABLE
CREATE TABLE IF NOT EXISTS exams (
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

CREATE INDEX IF NOT EXISTS idx_exams_time_range ON exams(start_time, end_time);

ALTER TABLE exams ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view active exams" ON exams;
CREATE POLICY "Anyone can view active exams" ON exams
  FOR SELECT USING (is_active = true);

DROP POLICY IF EXISTS "Only admins can manage exams" ON exams;
CREATE POLICY "Only admins can manage exams" ON exams
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- 3. EXAM_SESSIONS TABLE
CREATE TABLE IF NOT EXISTS exam_sessions (
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

CREATE INDEX IF NOT EXISTS idx_sessions_exam ON exam_sessions(exam_id);
CREATE INDEX IF NOT EXISTS idx_sessions_student ON exam_sessions(student_id);
CREATE INDEX IF NOT EXISTS idx_sessions_status ON exam_sessions(status);
CREATE INDEX IF NOT EXISTS idx_sessions_started ON exam_sessions(started_at);

ALTER TABLE exam_sessions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Students can view own sessions" ON exam_sessions;
CREATE POLICY "Students can view own sessions" ON exam_sessions
  FOR SELECT USING (auth.uid() = student_id);

DROP POLICY IF EXISTS "Admins can view all sessions" ON exam_sessions;
CREATE POLICY "Admins can view all sessions" ON exam_sessions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role IN ('admin', 'proctor')
    )
  );

DROP POLICY IF EXISTS "Students can create own sessions" ON exam_sessions;
CREATE POLICY "Students can create own sessions" ON exam_sessions
  FOR INSERT WITH CHECK (auth.uid() = student_id);

DROP POLICY IF EXISTS "Students can update own sessions" ON exam_sessions;
CREATE POLICY "Students can update own sessions" ON exam_sessions
  FOR UPDATE USING (auth.uid() = student_id);

-- 4. CHEAT_SCORES TABLE
CREATE TABLE IF NOT EXISTS cheat_scores (
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

CREATE INDEX IF NOT EXISTS idx_cheat_scores_session_time ON cheat_scores(session_id, timestamp);
CREATE INDEX IF NOT EXISTS idx_cheat_scores_session_seq ON cheat_scores(session_id, sequence_number);

ALTER TABLE cheat_scores ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Students can view own scores" ON cheat_scores;
CREATE POLICY "Students can view own scores" ON cheat_scores
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM exam_sessions
      WHERE id = session_id AND student_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Admins can view all scores" ON cheat_scores;
CREATE POLICY "Admins can view all scores" ON cheat_scores
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role IN ('admin', 'proctor')
    )
  );

-- 5. SUSPICIOUS_SNAPSHOTS TABLE
CREATE TABLE IF NOT EXISTS suspicious_snapshots (
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

CREATE INDEX IF NOT EXISTS idx_snapshots_session_time ON suspicious_snapshots(session_id, timestamp);
CREATE INDEX IF NOT EXISTS idx_snapshots_review_status ON suspicious_snapshots(admin_review_status);

ALTER TABLE suspicious_snapshots ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Students can view own snapshots" ON suspicious_snapshots;
CREATE POLICY "Students can view own snapshots" ON suspicious_snapshots
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM exam_sessions
      WHERE id = session_id AND student_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Admins can view all snapshots" ON suspicious_snapshots;
CREATE POLICY "Admins can view all snapshots" ON suspicious_snapshots
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role IN ('admin', 'proctor', 'support')
    )
  );

DROP POLICY IF EXISTS "Admins can update snapshots" ON suspicious_snapshots;
CREATE POLICY "Admins can update snapshots" ON suspicious_snapshots
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role IN ('admin', 'proctor')
    )
  );

-- 6. VIDEO_METADATA TABLE
CREATE TABLE IF NOT EXISTS video_metadata (
  session_id UUID PRIMARY KEY REFERENCES exam_sessions(id) ON DELETE CASCADE,
  recording_url TEXT NOT NULL,
  size_bytes BIGINT NOT NULL,
  duration_seconds INTEGER NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE video_metadata ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Students can view own video metadata" ON video_metadata;
CREATE POLICY "Students can view own video metadata" ON video_metadata
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM exam_sessions
      WHERE id = session_id AND student_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Admins can view all video metadata" ON video_metadata;
CREATE POLICY "Admins can view all video metadata" ON video_metadata
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role IN ('admin', 'proctor', 'support')
    )
  );

-- 7. AUDIT_LOGS TABLE
CREATE TABLE IF NOT EXISTS audit_logs (
  id BIGSERIAL PRIMARY KEY,
  actor_id UUID NOT NULL REFERENCES profiles(id),
  action TEXT NOT NULL,
  resource_type TEXT,
  resource_id TEXT,
  details JSONB NOT NULL DEFAULT '{}',
  timestamp TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_audit_logs_actor ON audit_logs(actor_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_timestamp ON audit_logs(timestamp);

ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Only admins can view audit logs" ON audit_logs;
CREATE POLICY "Only admins can view audit logs" ON audit_logs
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role IN ('admin', 'support')
    )
  );

DROP POLICY IF EXISTS "No updates allowed" ON audit_logs;
CREATE POLICY "No updates allowed" ON audit_logs FOR UPDATE USING (false);

DROP POLICY IF EXISTS "No deletes allowed" ON audit_logs;
CREATE POLICY "No deletes allowed" ON audit_logs FOR DELETE USING (false);

-- ============================================================================
-- QUESTIONS AND ANSWERS TABLES
-- ============================================================================

-- 8. QUESTIONS TABLE
CREATE TABLE IF NOT EXISTS questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  exam_id UUID NOT NULL REFERENCES exams(id) ON DELETE CASCADE,
  question_number INTEGER NOT NULL,
  question_type TEXT NOT NULL CHECK (question_type IN ('multiple_choice', 'short_answer', 'essay', 'true_false')),
  question_text TEXT NOT NULL,
  options JSONB,
  correct_answer TEXT,
  points INTEGER DEFAULT 1 CHECK (points >= 0),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(exam_id, question_number)
);

CREATE INDEX IF NOT EXISTS idx_questions_exam ON questions(exam_id);
CREATE INDEX IF NOT EXISTS idx_questions_number ON questions(exam_id, question_number);

ALTER TABLE questions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Students can view exam questions" ON questions;
CREATE POLICY "Students can view exam questions" ON questions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM exams
      WHERE exams.id = exam_id 
      AND exams.is_active = true
      AND NOW() >= exams.start_time
      AND NOW() <= exams.end_time
    )
  );

DROP POLICY IF EXISTS "Admins can manage questions" ON questions;
CREATE POLICY "Admins can manage questions" ON questions
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- 9. STUDENT_ANSWERS TABLE
CREATE TABLE IF NOT EXISTS student_answers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES exam_sessions(id) ON DELETE CASCADE,
  question_id UUID NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  answer_text TEXT NOT NULL,
  answered_at TIMESTAMPTZ DEFAULT NOW(),
  time_spent_seconds INTEGER,
  is_flagged BOOLEAN DEFAULT FALSE,
  admin_score INTEGER,
  admin_feedback TEXT,
  UNIQUE(session_id, question_id)
);

CREATE INDEX IF NOT EXISTS idx_answers_session ON student_answers(session_id);
CREATE INDEX IF NOT EXISTS idx_answers_question ON student_answers(question_id);
CREATE INDEX IF NOT EXISTS idx_answers_student ON student_answers(student_id);
CREATE INDEX IF NOT EXISTS idx_answers_flagged ON student_answers(is_flagged);

ALTER TABLE student_answers ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Students can view own answers" ON student_answers;
CREATE POLICY "Students can view own answers" ON student_answers
  FOR SELECT USING (auth.uid() = student_id);

DROP POLICY IF EXISTS "Students can create own answers" ON student_answers;
CREATE POLICY "Students can create own answers" ON student_answers
  FOR INSERT WITH CHECK (auth.uid() = student_id);

DROP POLICY IF EXISTS "Students can update own answers during exam" ON student_answers;
CREATE POLICY "Students can update own answers during exam" ON student_answers
  FOR UPDATE USING (
    auth.uid() = student_id AND
    EXISTS (
      SELECT 1 FROM exam_sessions es
      JOIN exams e ON es.exam_id = e.id
      WHERE es.id = session_id
      AND es.status = 'in_progress'
      AND NOW() <= e.end_time
    )
  );

DROP POLICY IF EXISTS "Admins can view all answers" ON student_answers;
CREATE POLICY "Admins can view all answers" ON student_answers
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role IN ('admin', 'proctor')
    )
  );

DROP POLICY IF EXISTS "Admins can update answers for grading" ON student_answers;
CREATE POLICY "Admins can update answers for grading" ON student_answers
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role IN ('admin', 'proctor')
    )
  );

-- ============================================================================
-- HELPER FUNCTIONS
-- ============================================================================

CREATE OR REPLACE FUNCTION calculate_exam_score(p_session_id UUID)
RETURNS TABLE(
  total_points INTEGER,
  earned_points INTEGER,
  percentage NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    COALESCE(SUM(q.points), 0)::INTEGER as total_points,
    COALESCE(SUM(
      CASE 
        WHEN sa.admin_score IS NOT NULL THEN sa.admin_score
        WHEN q.correct_answer IS NOT NULL AND sa.answer_text = q.correct_answer THEN q.points
        ELSE 0
      END
    ), 0)::INTEGER as earned_points,
    CASE 
      WHEN COALESCE(SUM(q.points), 0) > 0 
      THEN ROUND((COALESCE(SUM(
        CASE 
          WHEN sa.admin_score IS NOT NULL THEN sa.admin_score
          WHEN q.correct_answer IS NOT NULL AND sa.answer_text = q.correct_answer THEN q.points
          ELSE 0
        END
      ), 0) * 100.0 / SUM(q.points)), 2)
      ELSE 0
    END as percentage
  FROM exam_sessions es
  JOIN exams e ON es.exam_id = e.id
  JOIN questions q ON q.exam_id = e.id
  LEFT JOIN student_answers sa ON sa.session_id = es.id AND sa.question_id = q.id
  WHERE es.id = p_session_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- SEED DATA
-- ============================================================================

-- Create sample exam
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

-- Insert sample questions for the first exam
DO $$
DECLARE
  v_exam_id UUID;
BEGIN
  SELECT id INTO v_exam_id FROM exams LIMIT 1;
  
  IF v_exam_id IS NOT NULL THEN
    INSERT INTO questions (exam_id, question_number, question_type, question_text, options, correct_answer, points)
    VALUES
      (v_exam_id, 1, 'multiple_choice', 'What is the time complexity of binary search?', 
       '["O(n)", "O(log n)", "O(n^2)", "O(1)"]'::jsonb, 'O(log n)', 5),
      
      (v_exam_id, 2, 'multiple_choice', 'Which data structure uses LIFO principle?', 
       '["Queue", "Stack", "Array", "Tree"]'::jsonb, 'Stack', 5),
      
      (v_exam_id, 3, 'true_false', 'JavaScript is a statically typed language.', 
       '["True", "False"]'::jsonb, 'False', 3),
      
      (v_exam_id, 4, 'short_answer', 'What does HTML stand for?', 
       NULL, 'HyperText Markup Language', 7),
      
      (v_exam_id, 5, 'essay', 'Explain the difference between == and === in JavaScript.', 
       NULL, NULL, 10)
    ON CONFLICT DO NOTHING;
  END IF;
END $$;
