#!/bin/bash

# DS Research Tool Backend - Deployment Script for Oracle Cloud
# Run this script after git pull to update your backend

set -e  # Exit on error

echo "🚀 Starting deployment..."

# Navigate to backend directory
cd "$(dirname "$0")"

# Pull latest code
echo "📥 Pulling latest code from GitHub..."
git pull origin main

# Install dependencies
echo "📦 Installing dependencies..."
npm install --production

# Create logs directory if it doesn't exist
mkdir -p logs

# Restart PM2 process
echo "🔄 Restarting backend with PM2..."
pm2 restart ecosystem.config.js

# Save PM2 configuration
pm2 save

# Show status
echo "✅ Deployment complete!"
echo ""
pm2 status

echo ""
echo "📊 View logs with: pm2 logs ds-research"
echo "📈 Monitor with: pm2 monit"
