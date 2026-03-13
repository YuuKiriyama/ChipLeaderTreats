#!/bin/bash

# Get script directory
DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$DIR"

# Clear screen
clear

echo "======================================"
echo "  ChipLeaderTreats - All Services"
echo "======================================"
echo ""

# Check dependencies
echo "📦 Checking dependencies..."
if [ ! -d "frontend/node_modules" ]; then
    echo "⚠️  Installing frontend dependencies..."
    cd frontend
    npm install
    cd ..
fi

if [ ! -d "backend/node_modules" ]; then
    echo "⚠️  Installing backend dependencies..."
    cd backend
    npm install
    cd ..
fi

echo ""
echo "✅ Dependency check complete"
echo ""

# Start backend server (background)
echo "🚀 Starting backend server..."
cd backend
npm start > ../backend.log 2>&1 &
BACKEND_PID=$!
cd ..

# Wait for backend to start
sleep 2

# Start frontend server (background)
echo "🚀 Starting frontend server..."
cd frontend
npm run dev > ../frontend.log 2>&1 &
FRONTEND_PID=$!
cd ..

# Wait for frontend to start
sleep 3

echo ""
echo "======================================"
echo "  ✅ All services started successfully!"
echo "======================================"
echo ""
echo "📡 Backend API: http://localhost:3001"
echo "🌐 Frontend UI: http://localhost:3000"
echo ""
echo "📱 Mobile access:"
LOCAL_IP=$(ifconfig | grep "inet " | grep -v 127.0.0.1 | awk '{print $2}' | head -n 1)
echo "   http://${LOCAL_IP}:3000"
echo ""
echo "📝 Log files:"
echo "   Backend: backend.log"
echo "   Frontend: frontend.log"
echo ""
echo "⚠️  Press Ctrl+C to stop all services"
echo "======================================"
echo ""

# Wait for user interrupt
trap "echo ''; echo 'Stopping all services...'; kill $BACKEND_PID $FRONTEND_PID 2>/dev/null; sleep 2; kill -9 $BACKEND_PID $FRONTEND_PID 2>/dev/null; echo '✅ All services stopped'; exit" INT TERM

# Keep script running and monitor processes
while true; do
    # Check if processes are still running
    if ! kill -0 $BACKEND_PID 2>/dev/null; then
        echo "⚠️  Backend service stopped unexpectedly"
        break
    fi
    if ! kill -0 $FRONTEND_PID 2>/dev/null; then
        echo "⚠️  Frontend service stopped unexpectedly"
        break
    fi
    sleep 5
done
