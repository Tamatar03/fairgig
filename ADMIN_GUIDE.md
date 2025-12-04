# Admin Portal Guide

## Overview
The admin portal provides complete control over exams, questions, and student answers. All admin pages now include:
- ✅ Authentication checks (admin/proctor role required)
- ✅ Error handling with user-friendly messages
- ✅ Navigation back to admin dashboard
- ✅ Database error handling

## Access Requirements

### 1. Database Setup
First, execute the schema in Supabase SQL Editor:
1. Go to https://supabase.com/dashboard/project/eapivajtriunujcyyhmc
2. Click "SQL Editor" in left sidebar
3. Click "New Query"
4. Copy all content from `schema-complete.sql`
5. Paste and click "Run"
6. Expected: "Success. No rows returned"

### 2. Admin Account Setup
After running the schema, you need to set up an admin account:

**Option A: Update existing user**
```sql
-- In Supabase SQL Editor
UPDATE profiles 
SET role = 'admin' 
WHERE email = 'your-email@example.com';
```

**Option B: Create new admin**
1. Sign up through `/signup` page
2. Copy your user ID from Supabase Authentication
3. Run in SQL Editor:
```sql
UPDATE profiles 
SET role = 'admin' 
WHERE id = 'your-user-id-here';
```

### 3. Start Development Server
```bash
npm run dev
```
Keep the terminal running (don't press Ctrl+C).

### 4. Access via Codespaces
1. Click "PORTS" tab at bottom of VS Code
2. Find port 3000
3. Right-click → Port Visibility → Public
4. Click globe icon to open in browser

## Admin Dashboard Navigation

### Main Dashboard (`/admin`)
Entry point showing:
- **Stats Cards**: Active sessions, completed today, flagged sessions, average integrity
- **Recent Sessions Table**: Latest exam sessions with integrity scores
- **Quick Action Buttons**:
  - **Manage Exams** → `/admin/exams`
  - **Monitor Live Sessions** → `/admin/sessions?status=in_progress`
  - **Review Flagged Sessions** → `/admin/sessions?flagged=true`
  - **Grade Answers** → `/admin/answers`
  - **Audit Logs** → `/admin/audit`
  - **Settings** → `/admin/settings`

Header buttons:
- **All Sessions** → `/admin/sessions`
- **Grade Answers** → `/admin/answers`
- **Settings** → `/admin/settings`
- **Logout** → Signs out and redirects to login

## Page Details

### 1. Manage Exams (`/admin/exams`)
**Purpose**: View all exams and navigate to question management

**Features**:
- Lists all exams in card layout
- Shows exam details: title, description, duration, passing score, question count
- Status badges (Active/Inactive)
- **Manage Questions** button → `/admin/exam/[examId]/questions`
- **Activate/Deactivate** toggle for exam availability

**Access**: Click "Manage Exams" on admin dashboard

### 2. Manage Questions (`/admin/exam/[examId]/questions`)
**Purpose**: Add, view, and delete questions for a specific exam

**URL Format**: `/admin/exam/[EXAM_ID]/questions`

**How to Get Exam ID**:
1. Go to `/admin/exams`
2. Click "Manage Questions" on any exam card
3. Or manually: In Supabase → Table Editor → exams → copy ID column

**Features**:
- **Existing Questions List**:
  - Shows question number, type, text, options, points
  - Delete button for each question
  
- **Add Question Form**:
  - Question Number (auto-incremented)
  - Question Type dropdown:
    - Multiple Choice (shows 4 option inputs)
    - True/False (auto options: "True", "False")
    - Short Answer (text input for students)
    - Essay (textarea for students)
  - Question Text (textarea)
  - Options (for multiple choice - 4 text inputs)
  - Correct Answer (for auto-grading)
  - Points (default: 5)

**Sample Data**: The schema includes 5 sample questions for the sample exam.

**Access**: 
- From `/admin/exams` → Click "Manage Questions"
- Direct: `/admin/exam/[EXAM_ID]/questions`

### 3. Grade Answers (`/admin/answers`)
**Purpose**: Review and grade student exam answers

**Features**:
- **Filter Tabs**:
  - All Answers
  - Ungraded Only
  - Flagged Only

- **Answer Table**:
  - Student name and email
  - Exam title
  - Question number and text
  - Student's answer
  - Correct answer (if available)
  - Current score
  - Flag status
  - Actions: Grade, Flag/Unflag

- **Grading Modal**:
  - Score input (0 to max points)
  - Feedback textarea
  - Save button

**Auto-Grading**: For multiple choice and true/false, compare student answer to correct_answer. For short answer and essay, manual grading required.

**Access**: Click "Grade Answers" in header or dashboard

### 4. All Sessions (`/admin/sessions`)
**Purpose**: View all exam sessions with filtering

**Features**:
- Session list with student, exam, status, integrity score
- Filter by status (in_progress, completed, flagged)
- Click session to view details

**Access**: Click "All Sessions" in header

### 5. Session Details (`/admin/session/[sessionId]`)
**Purpose**: Detailed view of single exam session

**Features**:
- Student info
- Exam details
- Integrity score timeline
- Alert history
- Video recordings
- Suspicious snapshots

**Access**: Click "View Details" on any session in tables

## Common Issues & Solutions

### "Failed to load" Error
**Cause**: Not authenticated or not admin role

**Solution**:
1. Make sure you're logged in
2. Check your role in Supabase:
   ```sql
   SELECT email, role FROM profiles WHERE email = 'your-email@example.com';
   ```
3. If role is not 'admin' or 'proctor', update it:
   ```sql
   UPDATE profiles SET role = 'admin' WHERE email = 'your-email@example.com';
   ```

### "Exam Not Found" Error
**Cause**: Invalid exam ID in URL

**Solution**:
1. Go to `/admin/exams` to see all exams
2. Click "Manage Questions" button (don't manually type URLs)
3. Or verify exam exists in Supabase Table Editor → exams table

### "Access denied" Error
**Cause**: User role is 'student' or 'user'

**Solution**: Update role to 'admin' or 'proctor' in Supabase profiles table

### Database Errors
**Cause**: Schema not executed or tables don't exist

**Solution**:
1. Run `schema-complete.sql` in Supabase SQL Editor
2. Verify tables exist: profiles, exams, questions, student_answers, exam_sessions
3. Check RLS policies are enabled

## Complete Workflow Example

### 1. Setup (First Time)
```bash
# 1. Execute database schema in Supabase SQL Editor
# (Copy schema-complete.sql content and run)

# 2. Set admin role for your account
UPDATE profiles SET role = 'admin' WHERE email = 'your-email@example.com';

# 3. Start dev server
npm run dev

# 4. Access via Codespaces PORTS tab → port 3000 → Public → globe icon
```

### 2. Create Questions
1. Login as admin
2. Navigate to `/admin`
3. Click "Manage Exams"
4. Click "Manage Questions" on an exam
5. Fill out form and click "Add Question"
6. Repeat for all questions

### 3. Student Takes Exam
1. Student signs up and logs in
2. Student navigates to exam
3. Answers questions (auto-saved)
4. Webcam preview shows at top
5. Completes exam

### 4. Grade Answers
1. Admin goes to `/admin/answers`
2. Click "Ungraded" filter
3. Click "Grade" button on answer
4. Enter score and feedback
5. Save
6. Score visible to student

### 5. Review Sessions
1. Admin goes to `/admin/sessions`
2. Filter by flagged sessions
3. Click "View Details" on session
4. Review integrity score, alerts, snapshots
5. Make determination about exam validity

## API Integration

All admin pages use:
- **Authentication**: `getCurrentUser()` and `getUserProfile()`
- **Database**: Supabase client with RLS policies
- **Error Handling**: Try-catch with user-friendly messages
- **Loading States**: Spinner while fetching data

## Security

- ✅ All admin pages check for admin/proctor role
- ✅ Row-level security policies on all tables
- ✅ Student data isolated by user ID
- ✅ Admin actions logged in audit_logs table
- ✅ Redirect to login if not authenticated

## Next Steps

1. **Execute schema**: Run `schema-complete.sql` in Supabase
2. **Set admin role**: Update your user profile role to 'admin'
3. **Start server**: Run `npm run dev`
4. **Test workflow**: Login → Manage Exams → Add Questions → Grade Answers
