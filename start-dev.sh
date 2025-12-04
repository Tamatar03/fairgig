#!/bin/bash

# FairGig Quick Start Script

echo "🚀 Starting FairGig Development Environment..."
echo ""

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo "📦 Installing Node.js dependencies..."
    npm install
    echo ""
fi

# Check if .env.local exists
if [ ! -f ".env.local" ]; then
    echo "⚙️  Creating .env.local from .env.example..."
    cp .env.example .env.local
    echo ""
    echo "⚠️  IMPORTANT: Please update .env.local with your actual Supabase credentials!"
    echo ""
fi

# Start Next.js development server
echo "🎯 Starting Next.js development server..."
echo "📍 App will be available at: http://localhost:3000"
echo ""
npm run dev
