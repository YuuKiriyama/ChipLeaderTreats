#!/bin/bash

# Get script directory (frontend directory)
DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$DIR"

# Get local IP address
LOCAL_IP=$(ifconfig | grep "inet " | grep -v 127.0.0.1 | awk '{print $2}' | head -n 1)

# Clear screen
clear

echo "======================================"
echo "  ChipLeaderTreats - Dev Server"
echo "======================================"
echo ""
echo "Starting Vite dev server..."
echo ""

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo "⚠️  First run - installing dependencies..."
    npm install
    echo ""
fi

echo "✅ Server started successfully!"
echo ""
echo "📱 Mobile access URL:"
echo "   http://${LOCAL_IP}:3000"
echo ""
echo "💻 Local access URL:"
echo "   http://localhost:3000"
echo ""
echo "Tips:"
echo "  - Mobile device must be on the same WiFi network as your computer"
echo "  - Code changes will hot-reload automatically"
echo "  - Press Ctrl+C to stop the server"
echo ""
echo "======================================"
echo ""

# Start dev server
npm run dev
