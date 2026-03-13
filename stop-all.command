#!/bin/bash

# Get script directory
DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$DIR"

# Clear screen
clear

echo "======================================"
echo "  ChipLeaderTreats - Stop Services"
echo "======================================"
echo ""

echo "🔍 Checking running services..."

# Check and stop backend service
BACKEND_PIDS=$(ps aux | grep "node server.js" | grep -v grep | awk '{print $2}')
if [ ! -z "$BACKEND_PIDS" ]; then
    echo "🛑 Stopping backend service (PID: $BACKEND_PIDS)..."
    kill $BACKEND_PIDS 2>/dev/null
    sleep 1
    # Force kill if still running
    kill -9 $BACKEND_PIDS 2>/dev/null
    echo "✅ Backend service stopped"
else
    echo "ℹ️  Backend service is not running"
fi

# Check and stop frontend service
FRONTEND_PIDS=$(ps aux | grep "vite" | grep -v grep | awk '{print $2}')
if [ ! -z "$FRONTEND_PIDS" ]; then
    echo "🛑 Stopping frontend service (PID: $FRONTEND_PIDS)..."
    kill $FRONTEND_PIDS 2>/dev/null
    sleep 1
    # Force kill if still running
    kill -9 $FRONTEND_PIDS 2>/dev/null
    echo "✅ Frontend service stopped"
else
    echo "ℹ️  Frontend service is not running"
fi

# Check and stop npm processes
NPM_PIDS=$(ps aux | grep "npm" | grep -E "(start|dev)" | grep -v grep | awk '{print $2}')
if [ ! -z "$NPM_PIDS" ]; then
    echo "🛑 Stopping npm processes (PID: $NPM_PIDS)..."
    kill $NPM_PIDS 2>/dev/null
    sleep 1
    kill -9 $NPM_PIDS 2>/dev/null
    echo "✅ npm processes stopped"
fi

echo ""
echo "🔍 Final check..."

# Final check
REMAINING=$(ps aux | grep -E "(node server.js|vite|npm.*dev|npm.*start)" | grep -v grep | grep CrisCL)
if [ -z "$REMAINING" ]; then
    echo "✅ All services stopped successfully!"
else
    echo "⚠️  Some processes are still running:"
    echo "$REMAINING"
fi

echo ""
echo "======================================"
echo "  Service stop complete"
echo "======================================"
echo ""
echo "💡 Tips:"
echo "  - If services are still running, manually run:"
echo "    pkill -f 'node server.js'"
echo "    pkill -f 'vite'"
echo "  - Or use Activity Monitor to view processes"
echo ""

# Wait for user keypress
read -p "Press any key to exit..."
