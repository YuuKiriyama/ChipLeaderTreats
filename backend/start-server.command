#!/bin/bash

# Get script directory
DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$DIR"

# Clear screen
clear

echo "======================================"
echo "  ChipLeaderTreats - Backend Server"
echo "======================================"
echo ""
echo "Starting backend server..."
echo ""

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo "⚠️  First run - installing dependencies..."
    npm install
    echo ""
fi

# Start backend server
npm start
