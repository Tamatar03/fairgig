-- ============================================================================
-- Questions and Answers Extension for FairGig Proctoring System
-- ============================================================================

-- 1. QUESTIONS TABLE
-- Questions that admins create for exams
CREATE TABLE IF NOT EXISTS questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  exam_id UUID NOT NULL REFERENCES exams(id) ON DELETE CASCADE,
  question_number INTEGER NOT NULL,
  question_type TEXT NOT NULL CHECK (question_type IN ('multiple_choice', 'short_answer', 'essay', 'true_false')),
  question_text TEXT NOT NULL,
  options JSONB, -- For multiple choice: ["Option A", "Option B", "Option C", "Option D"]
  correct_answer TEXT, -- For auto-grading (optional)
  points INTEGER DEFAULT 1 CHECK (points >= 0),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(exam_id, question_number)
);

CREATE INDEX idx_questions_exam ON questions(exam_id);
CREATE INDEX idx_questions_number ON questions(exam_id, question_number);

ALTER TABLE questions ENABLE ROW LEVEL SECURITY;

-- Students can read questions for active exams they're taking
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

-- Admins can manage all questions
CREATE POLICY "Admins can manage questions" ON questions
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- 2. STUDENT_ANSWERS TABLE
-- Student answers to exam questions
CREATE TABLE IF NOT EXISTS student_answers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES exam_sessions(id) ON DELETE CASCADE,
  question_id UUID NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  answer_text TEXT NOT NULL,
  answered_at TIMESTAMPTZ DEFAULT NOW(),
  time_spent_seconds INTEGER, -- How long student spent on this question
  is_flagged BOOLEAN DEFAULT FALSE, -- Admin can flag for review
  admin_score INTEGER, -- Manual score assigned by admin
  admin_feedback TEXT, -- Feedback from admin
  UNIQUE(session_id, question_id)
);

CREATE INDEX idx_answers_session ON student_answers(session_id);
CREATE INDEX idx_answers_question ON student_answers(question_id);
CREATE INDEX idx_answers_student ON student_answers(student_id);
CREATE INDEX idx_answers_flagged ON student_answers(is_flagged);

ALTER TABLE student_answers ENABLE ROW LEVEL SECURITY;

-- Students can read and create their own answers
CREATE POLICY "Students can view own answers" ON student_answers
  FOR SELECT USING (auth.uid() = student_id);

CREATE POLICY "Students can create own answers" ON student_answers
  FOR INSERT WITH CHECK (auth.uid() = student_id);

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

-- Admins can view and grade all answers
CREATE POLICY "Admins can view all answers" ON student_answers
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role IN ('admin', 'proctor')
    )
  );

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

-- Function to calculate exam score
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
-- SEED DATA (Example questions)
-- ============================================================================

-- Insert sample questions for the first exam (if exists)
DO $$
DECLARE
  v_exam_id UUID;
BEGIN
  -- Get the first exam
  SELECT id INTO v_exam_id FROM exams LIMIT 1;
  
  IF v_exam_id IS NOT NULL THEN
    -- Insert sample questions
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
