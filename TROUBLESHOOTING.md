# Browser Error Troubleshooting Guide

## Common Issues & Solutions

### 1. **"Module not found" or Import Errors**

**Solution:**
```bash
# Clean install dependencies
rm -rf node_modules package-lock.json .next
npm install
```

### 2. **TypeScript Compilation Errors**

All TypeScript errors have been fixed. If you still see errors:

```bash
# Run type check
npm run type-check

# If errors persist, restart VS Code TypeScript server:
# CMD/CTRL + Shift + P -> "TypeScript: Restart TS Server"
```

### 3. **"Cannot find module '@heroicons/react'"**

This dependency was removed and replaced with inline SVG icons. No action needed.

### 4. **Supabase Connection Errors**

**Solution:**
1. Copy `.env.example` to `.env.local`:
   ```bash
   cp .env.example .env.local
   ```

2. Update `.env.local` with your actual Supabase credentials:
   ```bash
   NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
   SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
   ```

3. Get these values from: https://app.supabase.com/project/YOUR_PROJECT/settings/api

### 5. **Port 3000 Already in Use**

**Solution:**
```bash
# Kill existing process
lsof -ti:3000 | xargs kill -9

# Or use a different port
PORT=3001 npm run dev
```

### 6. **Database Schema Not Set Up**

**Solution:**
1. Go to your Supabase project: https://app.supabase.com
2. Navigate to SQL Editor
3. Copy the schema from `docs/database-schema.md`
4. Execute the SQL to create tables

### 7. **ML Service Not Running**

For full functionality, you need to run the Python ML service:

```bash
# Navigate to ml-service directory
cd ml-service

# Create virtual environment
python3 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Run ML service
python main.py
```

The ML service will run on http://localhost:8000

### 8. **Blank Page or White Screen**

**Check browser console:**
1. Open DevTools (F12)
2. Look for error messages in Console tab
3. Check Network tab for failed requests

**Common causes:**
- Missing environment variables
- Supabase not configured
- JavaScript errors (check console)

**Solution:**
```bash
# Clear Next.js cache
rm -rf .next

# Restart dev server
npm run dev
```

### 9. **Authentication Not Working**

**Verify Supabase setup:**
1. Check Supabase Auth is enabled
2. Verify email provider is configured
3. Check RLS policies are set up (see `docs/database-schema.md`)

**Test connection:**
```bash
# Check if env vars are loaded
node -e "console.log(process.env.NEXT_PUBLIC_SUPABASE_URL)"
```

### 10. **Build Errors**

**Solution:**
```bash
# Clean build
rm -rf .next out
npm run build

# If build succeeds, start production server
npm start
```

## Step-by-Step Startup Checklist

✅ **1. Install Dependencies**
```bash
npm install
```

✅ **2. Configure Environment**
```bash
cp .env.example .env.local
# Edit .env.local with your values
```

✅ **3. Set Up Database**
- Create Supabase project
- Run SQL from `docs/database-schema.md`
- Enable Row Level Security

✅ **4. Start Development Server**
```bash
npm run dev
```

✅ **5. Access Application**
- Open browser to http://localhost:3000
- Check console for errors

## Quick Start (One Command)

```bash
# Make start script executable
chmod +x start-dev.sh

# Run it
./start-dev.sh
```

## Getting Help

If none of these solutions work:

1. **Check the logs:**
   - Browser console (F12)
   - Terminal where `npm run dev` is running

2. **Verify versions:**
   ```bash
   node --version  # Should be 18.x or higher
   npm --version   # Should be 9.x or higher
   ```

3. **Check common files exist:**
   ```bash
   ls -la .env.local
   ls -la node_modules/next
   ```

## Current Error You're Seeing

**Please provide:**
1. The exact error message from browser console
2. The URL you're trying to access
3. Any error messages in terminal

**Most likely issue:** Supabase environment variables not configured

**Quick fix:**
```bash
# 1. Copy env file
cp .env.example .env.local

# 2. Edit it (use nano, vim, or VS Code)
nano .env.local

# 3. Add your Supabase credentials
# 4. Save and restart server
npm run dev
```
