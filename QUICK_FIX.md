# Quick Fix Guide - Admin Portal Not Working

## The Problem
The admin portal is showing errors because either:
1. Database tables don't exist yet (schema not executed)
2. You're not logged in as admin
3. Server issues

## Step-by-Step Fix

### Step 1: Fix Git Issues (Do this first in terminal)
```bash
# Abort the problematic rebase
git rebase --abort

# Force pull latest changes
git fetch origin
git reset --hard origin/main
```

### Step 2: Install Dependencies
```bash
npm install
```

### Step 3: Run Database Schema in Supabase

**CRITICAL - Do this or nothing will work:**

1. Open https://supabase.com/dashboard/project/eapivajtriunujcyyhmc
2. Click "SQL Editor" (left sidebar)
3. Click "New query" button
4. Copy **ALL** content from `schema-complete.sql` file (445 lines)
5. Paste into SQL editor
6. Click "Run" button
7. Wait for "Success" message

### Step 4: Set Your Account as Admin

In Supabase SQL Editor, run this:

```sql
-- First, sign up through the app to create your account
-- Then find your email and update the role:

UPDATE profiles 
SET role = 'admin' 
WHERE email = 'YOUR_EMAIL_HERE@example.com';

-- Check it worked:
SELECT email, role FROM profiles;
```

### Step 5: Start Development Server
```bash
npm run dev
```

Keep the terminal open. Don't press Ctrl+C.

### Step 6: Access the Application

1. Click "PORTS" tab at bottom of VS Code
2. Find port 3000
3. Right-click → "Port Visibility" → "Public"
4. Click the globe icon 🌐 to open in browser

### Step 7: Login as Admin

1. If you don't have an account, go to `/signup` and create one
2. Go back to Supabase SQL Editor and run:
   ```sql
   UPDATE profiles SET role = 'admin' WHERE email = 'your-email@example.com';
   ```
3. Logout and login again
4. Now go to `/admin` - it should work!

## Testing the Admin Portal

### Test 1: Admin Dashboard
- Go to: `https://YOUR_CODESPACE_URL.app.github.dev/admin`
- Should see: Dashboard with stats, sessions table, quick action buttons
- If you see error: Check that you ran the schema and set role to 'admin'

### Test 2: Manage Exams
- Click "Manage Exams" button
- Should see: List of exams (at least 1 sample exam from schema)
- If empty: Schema wasn't executed properly

### Test 3: Manage Questions
- On exams page, click "Manage Questions" on any exam
- Should see: 5 sample questions + form to add new questions
- Try adding a new question
- If error: Check browser console (F12) for details

### Test 4: Grade Answers
- Click "Grade Answers" in header
- Should see: Student answers (will be empty if no student took exams yet)
- Filter tabs should work

## Common Errors & Solutions

### Error: "Failed to load"
**Cause:** Database tables don't exist
**Fix:** Run `schema-complete.sql` in Supabase SQL Editor (Step 3)

### Error: "Access denied. Admin role required"
**Cause:** Your user role is not 'admin'
**Fix:** Run UPDATE query in Step 4

### Error: "Connection refused" or blank page
**Cause:** Server not running
**Fix:** Run `npm run dev` and access via PORTS tab

### Error: "Exam Not Found"
**Cause:** Invalid exam ID in URL
**Fix:** Go to `/admin/exams` and click "Manage Questions" button (don't type URL manually)

### Error: "No exams available"
**Cause:** Schema wasn't executed or sample data missing
**Fix:** Re-run `schema-complete.sql` in Supabase

## Quick Test in Browser Console

Open browser console (F12) and run:

```javascript
// Check if Supabase is configured
console.log('Supabase URL:', process.env.NEXT_PUBLIC_SUPABASE_URL);

// Check if you're logged in
const { data: { user } } = await window.supabase.auth.getUser();
console.log('Current user:', user);

// Check your role
const { data: profile } = await window.supabase
  .from('profiles')
  .select('*')
  .eq('id', user.id)
  .single();
console.log('Profile:', profile);
```

Your role should be 'admin', not 'student' or 'user'.

## Still Not Working?

1. Open browser DevTools (F12)
2. Go to Console tab
3. Take a screenshot of any red errors
4. Check Network tab for failed requests
5. Share the error messages

The most common issue is **forgetting to run the schema** in Supabase!
