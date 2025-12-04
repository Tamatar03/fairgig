# Database Schema Documentation

This document describes the complete database schema for the FairGig Proctoring System using Supabase (PostgreSQL).

## Overview

The database consists of 7 main tables with Row-Level Security (RLS) policies enforced at the database level.

---

## Tables

### 1. profiles

User profile information for all actors in the system.

**Columns:**
- `id` (uuid, PRIMARY KEY) - User ID (references auth.users)
- `email` (text, NOT NULL, UNIQUE) - User email address
- `display_name` (text) - User's display name
- `role` (text, NOT NULL) - User role: 'student', 'admin', 'proctor', 'support'
- `created_at` (timestamptz, DEFAULT now()) - Account creation timestamp
- `metadata` (jsonb) - Additional metadata (e.g., ID verification status)
- `is_active` (boolean, DEFAULT true) - Account active status

**Indexes:**
- PRIMARY KEY on `id`
- INDEX on `email`
- INDEX on `role`

**RLS Policies:**
- Students can read only their own profile
- Admins/Proctors can read all profiles
- Users can update only their own display_name and metadata
- Only admins can update role and is_active

**SQL:**
```sql
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

-- Policy: Students can read their own profile
CREATE POLICY "Students can view own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

-- Policy: Admins can read all profiles
CREATE POLICY "Admins can view all profiles" ON profiles
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role IN ('admin', 'proctor')
    )
  );

-- Policy: Users can update their own profile
CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);
```

---

### 2. exams

Exam configuration and settings.

**Columns:**
- `id` (uuid, PRIMARY KEY, DEFAULT gen_random_uuid()) - Exam ID
- `title` (text, NOT NULL) - Exam title
- `duration_minutes` (integer, NOT NULL) - Exam duration in minutes
- `start_time` (timestamptz, NOT NULL) - Exam start time
- `end_time` (timestamptz, NOT NULL) - Exam end time
- `settings` (jsonb, NOT NULL) - Exam settings (frameRate, captureWidth, captureHeight, recordingConsent)
- `thresholds` (jsonb, NOT NULL) - Detection thresholds (focus_threshold, phone_alert_level)
- `retention_days` (integer, DEFAULT 30) - Data retention period in days

**Indexes:**
- PRIMARY KEY on `id`
- INDEX on `start_time`, `end_time`

**RLS Policies:**
- All authenticated users can read exams
- Only admins can create/update/delete exams

**SQL:**
```sql
CREATE TABLE exams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  duration_minutes INTEGER NOT NULL CHECK (duration_minutes > 0),
  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ NOT NULL,
  settings JSONB NOT NULL,
  thresholds JSONB NOT NULL,
  retention_days INTEGER DEFAULT 30 CHECK (retention_days >= 0),
  CHECK (end_time > start_time)
);

CREATE INDEX idx_exams_time_range ON exams(start_time, end_time);

ALTER TABLE exams ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view exams" ON exams
  FOR SELECT USING (true);

CREATE POLICY "Only admins can manage exams" ON exams
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );
```

---

### 3. exam_sessions

Active and historical exam sessions.

**Columns:**
- `id` (uuid, PRIMARY KEY, DEFAULT gen_random_uuid()) - Session ID
- `exam_id` (uuid, NOT NULL, FOREIGN KEY -> exams.id) - Associated exam
- `student_id` (uuid, NOT NULL, FOREIGN KEY -> profiles.id) - Student taking exam
- `started_at` (timestamptz, DEFAULT now()) - Session start time
- `ended_at` (timestamptz) - Session end time
- `status` (text, NOT NULL, DEFAULT 'preparing') - Session status: 'preparing', 'in_progress', 'completed', 'aborted'
- `integrity_score` (real, CHECK 0-1) - Overall integrity score
- `degraded` (boolean, DEFAULT false) - Whether ML service was degraded
- `device_info` (jsonb) - Device information
- `logs` (jsonb) - Session event logs

**Indexes:**
- PRIMARY KEY on `id`
- INDEX on `exam_id`
- INDEX on `student_id`
- INDEX on `status`
- INDEX on `started_at`

**RLS Policies:**
- Students can read/update only their own sessions
- Admins/Proctors can read all sessions
- Only students can insert their own sessions

**SQL:**
```sql
CREATE TABLE exam_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  exam_id UUID NOT NULL REFERENCES exams(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  started_at TIMESTAMPTZ DEFAULT NOW(),
  ended_at TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'preparing' CHECK (status IN ('preparing', 'in_progress', 'completed', 'aborted')),
  integrity_score REAL CHECK (integrity_score >= 0 AND integrity_score <= 1),
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
```

---

### 4. cheat_scores

Time-series ML inference results.

**Columns:**
- `id` (bigserial, PRIMARY KEY) - Auto-incrementing ID
- `session_id` (uuid, NOT NULL, FOREIGN KEY -> exam_sessions.id) - Associated session
- `sequence_number` (integer, NOT NULL) - Frame sequence number
- `timestamp` (timestamptz, NOT NULL) - Frame timestamp
- `focus_score` (real, NOT NULL) - Focus score (0-1)
- `confidence` (real, NOT NULL) - ML confidence (0-1)
- `alerts` (jsonb, NOT NULL, DEFAULT '[]') - Array of alert objects
- `metrics` (jsonb, NOT NULL, DEFAULT '{}') - ML metrics (faces, head_pose, etc.)
- `server_latency_ms` (integer) - Server processing latency

**Indexes:**
- PRIMARY KEY on `id`
- INDEX on `session_id`, `timestamp`
- INDEX on `session_id`, `sequence_number`

**RLS Policies:**
- Students can read scores for their own sessions
- Admins/Proctors can read all scores
- Only the API service (via service role key) can insert

**SQL:**
```sql
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
```

---

### 5. suspicious_snapshots

Metadata for flagged snapshots.

**Columns:**
- `id` (uuid, PRIMARY KEY, DEFAULT gen_random_uuid()) - Snapshot ID
- `session_id` (uuid, NOT NULL, FOREIGN KEY -> exam_sessions.id) - Associated session
- `timestamp` (timestamptz, NOT NULL) - Event timestamp
- `event_code` (text, NOT NULL) - Alert code (e.g., 'PHONE_DETECTED')
- `severity` (text, NOT NULL) - Severity: 'low', 'medium', 'high'
- `storage_path` (text) - Path in Supabase Storage
- `ml_confidence` (real, NOT NULL) - ML confidence for this event
- `admin_review_status` (text, DEFAULT 'pending') - Review status: 'pending', 'confirmed', 'false_positive'
- `notes` (text) - Admin notes

**Indexes:**
- PRIMARY KEY on `id`
- INDEX on `session_id`, `timestamp`
- INDEX on `admin_review_status`

**RLS Policies:**
- Students can read snapshots for their own sessions
- Admins can read and update all snapshots
- Only service role can insert

**SQL:**
```sql
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
```

---

### 6. video_metadata (Optional)

Full video recording metadata.

**Columns:**
- `session_id` (uuid, PRIMARY KEY, FOREIGN KEY -> exam_sessions.id) - Associated session
- `recording_url` (text, NOT NULL) - URL/path to recording
- `size_bytes` (bigint, NOT NULL) - File size
- `duration_seconds` (integer, NOT NULL) - Recording duration
- `created_at` (timestamptz, DEFAULT now()) - Creation timestamp

**SQL:**
```sql
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
```

---

### 7. audit_logs

Immutable audit trail.

**Columns:**
- `id` (bigserial, PRIMARY KEY) - Auto-incrementing ID
- `actor_id` (uuid, NOT NULL, FOREIGN KEY -> profiles.id) - User who performed action
- `action` (text, NOT NULL) - Action description
- `details` (jsonb, NOT NULL, DEFAULT '{}') - Action details
- `created_at` (timestamptz, DEFAULT now()) - Action timestamp

**Indexes:**
- PRIMARY KEY on `id`
- INDEX on `actor_id`
- INDEX on `created_at`

**RLS Policies:**
- Only admins can read
- Append-only (no updates/deletes)

**SQL:**
```sql
CREATE TABLE audit_logs (
  id BIGSERIAL PRIMARY KEY,
  actor_id UUID NOT NULL REFERENCES profiles(id),
  action TEXT NOT NULL,
  details JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_audit_logs_actor ON audit_logs(actor_id);
CREATE INDEX idx_audit_logs_created ON audit_logs(created_at);

ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Only admins can view audit logs" ON audit_logs
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role IN ('admin', 'support')
    )
  );

-- Prevent updates and deletes (append-only)
CREATE POLICY "No updates allowed" ON audit_logs FOR UPDATE USING (false);
CREATE POLICY "No deletes allowed" ON audit_logs FOR DELETE USING (false);
```

---

## Storage Buckets

### snapshots

Storage bucket for suspicious event snapshots.

**Configuration:**
- Public: No
- File size limit: 5MB
- Allowed MIME types: image/jpeg, image/png

**RLS Policies:**
- Students can read snapshots from their own sessions
- Admins can read all snapshots
- Only service role can upload

**SQL:**
```sql
-- Create storage bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('snapshots', 'snapshots', false);

-- RLS policy for reading
CREATE POLICY "Students can view own snapshots" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'snapshots' AND
    EXISTS (
      SELECT 1 FROM exam_sessions
      WHERE CAST(id AS TEXT) = (storage.foldername(name))[2]
      AND student_id = auth.uid()
    )
  );

CREATE POLICY "Admins can view all snapshots" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'snapshots' AND
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role IN ('admin', 'proctor', 'support')
    )
  );
```

---

## Scheduled Jobs

### Snapshot Retention Cleanup

Scheduled job to delete expired snapshots based on exam retention_days.

**Frequency:** Daily at 2:00 AM UTC

**SQL:**
```sql
-- Delete expired snapshots
DELETE FROM suspicious_snapshots
WHERE session_id IN (
  SELECT s.id FROM exam_sessions s
  JOIN exams e ON s.exam_id = e.id
  WHERE s.ended_at IS NOT NULL
  AND s.ended_at < NOW() - INTERVAL '1 day' * e.retention_days
);

-- Delete corresponding storage objects
-- (Implement via background worker or Cloud Function)
```

---

## Initial Setup Script

Run this script to create all tables and policies:

```bash
# Connect to Supabase and run the SQL scripts above in order
psql $DATABASE_URL < schema.sql
```

---

## Migrations

Use Supabase migrations or a tool like Flyway/Liquibase for schema versioning.

**Example migration file: `001_initial_schema.sql`**

---

## Notes

1. All timestamps are in UTC (timestamptz)
2. All monetary values should use NUMERIC if added
3. Use prepared statements to prevent SQL injection
4. Regularly backup the database
5. Monitor table sizes and partition large tables if needed (cheat_scores, audit_logs)
6. Consider adding composite indexes for common query patterns
7. Use `EXPLAIN ANALYZE` to optimize slow queries
