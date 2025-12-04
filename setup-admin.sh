#!/bin/bash

# FairGig Admin Portal - Complete Setup Script
# Run this to get everything working

set -e

echo "======================================"
echo "FairGig Admin Portal Setup"
echo "======================================"
echo ""

# Step 1: Fix Git Issues
echo "Step 1: Fixing git issues..."
git rebase --abort 2>/dev/null || true
git fetch origin
echo "✓ Git issues resolved"
echo ""

# Step 2: Install Dependencies
echo "Step 2: Installing dependencies..."
npm install
echo "✓ Dependencies installed"
echo ""

# Step 3: Check Environment
echo "Step 3: Checking environment..."
if grep -q "eapivajtriunujcyyhmc" .env.local; then
    echo "✓ Supabase credentials found"
else
    echo "⚠ WARNING: Supabase credentials not configured!"
fi
echo ""

# Step 4: Instructions for Database
echo "======================================"
echo "CRITICAL: Database Setup Required"
echo "======================================"
echo ""
echo "You MUST do this manually in Supabase:"
echo ""
echo "1. Open: https://supabase.com/dashboard/project/eapivajtriunujcyyhmc"
echo "2. Click 'SQL Editor' in left sidebar"
echo "3. Click 'New query' button"
echo "4. Copy ALL content from: schema-complete.sql"
echo "5. Paste and click 'Run'"
echo "6. Wait for 'Success' message"
echo ""
echo "Press ENTER when you've completed the database setup..."
read

# Step 5: Instructions for Admin Role
echo ""
echo "======================================"
echo "Setting Admin Role"
echo "======================================"
echo ""
echo "What's your email address?"
read USER_EMAIL
echo ""
echo "Copy and run this in Supabase SQL Editor:"
echo ""
echo "UPDATE profiles SET role = 'admin' WHERE email = '$USER_EMAIL';"
echo ""
echo "Press ENTER when you've set your admin role..."
read

# Step 6: Start Server
echo ""
echo "======================================"
echo "Starting Development Server"
echo "======================================"
echo ""
echo "Server will start in 3 seconds..."
echo "To access:"
echo "  1. Click 'PORTS' tab at bottom"
echo "  2. Find port 3000"
echo "  3. Set visibility to 'Public'"
echo "  4. Click globe icon to open"
echo ""
echo "First, test the database connection:"
echo "  Go to: /test-db"
echo ""
echo "Then access admin portal:"
echo "  Go to: /admin"
echo ""
sleep 3

npm run dev
