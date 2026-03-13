#!/bin/bash

# Get script directory
DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$DIR"

# Clear screen
clear

echo "======================================"
echo "  ChipLeaderTreats - Process Check"
echo "======================================"
echo ""

echo "🔍 Checking running services..."
echo ""

# Check backend service
echo "📡 Backend service status:"
BACKEND_PROCESSES=$(ps aux | grep "node server.js" | grep -v grep)
if [ ! -z "$BACKEND_PROCESSES" ]; then
    echo "✅ Backend service is running:"
    echo "$BACKEND_PROCESSES" | while read line; do
        PID=$(echo $line | awk '{print $2}')
        CPU=$(echo $line | awk '{print $3}')
        MEM=$(echo $line | awk '{print $4}')
        TIME=$(echo $line | awk '{print $10}')
        echo "   PID: $PID | CPU: $CPU% | Memory: $MEM% | Runtime: $TIME"
    done
else
    echo "❌ Backend service is not running"
fi

echo ""

# Check frontend service
echo "🌐 Frontend service status:"
FRONTEND_PROCESSES=$(ps aux | grep "vite" | grep -v grep)
if [ ! -z "$FRONTEND_PROCESSES" ]; then
    echo "✅ Frontend service is running:"
    echo "$FRONTEND_PROCESSES" | while read line; do
        PID=$(echo $line | awk '{print $2}')
        CPU=$(echo $line | awk '{print $3}')
        MEM=$(echo $line | awk '{print $4}')
        TIME=$(echo $line | awk '{print $10}')
        echo "   PID: $PID | CPU: $CPU% | Memory: $MEM% | Runtime: $TIME"
    done
else
    echo "❌ Frontend service is not running"
fi

echo ""

# Check port usage
echo "🔌 Port usage:"
echo "   3001 (backend): $(lsof -i :3001 2>/dev/null | wc -l | xargs -I {} echo {} connections)"
echo "   3000 (frontend): $(lsof -i :3000 2>/dev/null | wc -l | xargs -I {} echo {} connections)"
echo "   5173 (Vite): $(lsof -i :5173 2>/dev/null | wc -l | xargs -I {} echo {} connections)"

echo ""

# Check log files
echo "📝 Log file status:"
if [ -f "backend.log" ]; then
    BACKEND_LOG_SIZE=$(ls -lh backend.log | awk '{print $5}')
    echo "   Backend log: backend.log ($BACKEND_LOG_SIZE)"
else
    echo "   Backend log: Does not exist"
fi

if [ -f "frontend.log" ]; then
    FRONTEND_LOG_SIZE=$(ls -lh frontend.log | awk '{print $5}')
    echo "   Frontend log: frontend.log ($FRONTEND_LOG_SIZE)"
else
    echo "   Frontend log: Does not exist"
fi

echo ""
echo "======================================"
echo "  Process check complete"
echo "======================================"
echo ""
echo "💡 Quick actions:"
echo "  - Start services: ./start-all.command"
echo "  - Stop services: ./stop-all.command"
echo "  - View logs: tail -f backend.log frontend.log"
echo ""

# Wait for user keypress
read -p "Press any key to exit..."
