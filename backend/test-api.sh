#!/bin/bash

echo "======================================"
echo "  Test Backend API"
echo "======================================"
echo ""

API_BASE="http://localhost:3001/api"

echo "1. Testing health check..."
curl -s "${API_BASE}/health" | python3 -m json.tool
echo ""

echo "2. Testing get history..."
curl -s "${API_BASE}/history" | python3 -m json.tool
echo ""

echo "3. Testing get favorites..."
curl -s "${API_BASE}/favorites" | python3 -m json.tool
echo ""

echo "======================================"
echo "  Test complete"
echo "======================================"
