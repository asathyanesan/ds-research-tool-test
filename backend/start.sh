#!/bin/bash

# Quick Start Script for Oracle Cloud

echo "🚀 DS Research Tool Backend - Quick Start"
echo ""

# Create logs directory
mkdir -p logs

# Check if .env exists
if [ ! -f .env ]; then
    echo "⚠️  .env file not found!"
    echo ""
    echo "Please create .env file with:"
    echo "  nano .env"
    echo ""
    echo "Then paste your environment variables (see ORACLE_CLOUD_SETUP.md Step 6)"
    exit 1
fi

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Start with PM2
echo ""
echo "🔄 Starting backend with PM2..."
pm2 start ecosystem.config.js

# Save PM2 config
pm2 save

# Setup PM2 startup (will show a command to run)
echo ""
echo "⚙️  Setting up PM2 to start on boot..."
pm2 startup

echo ""
echo "✅ Backend started successfully!"
echo ""
echo "📊 View status: pm2 status"
echo "📝 View logs: pm2 logs ds-research"
echo "📈 Monitor: pm2 monit"
echo ""
echo "🌐 Test your backend:"
echo "   curl http://localhost:3003/health"
