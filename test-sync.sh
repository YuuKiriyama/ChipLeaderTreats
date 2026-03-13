#!/bin/bash

echo "======================================"
echo "  Test Multi-Device Data Sync"
echo "======================================"
echo ""

API_BASE="http://localhost:3001/api"

echo "1. Checking server status..."
curl -s "${API_BASE}/health" | python3 -m json.tool
echo ""

echo "2. Getting current history..."
curl -s "${API_BASE}/history" | python3 -m json.tool
echo ""

echo "3. Adding test game record..."
TEST_GAME='{
  "id": 9999999999999,
  "gameName": "Test Sync Game",
  "date": "'$(date -u +%Y-%m-%dT%H:%M:%S.%3NZ)'",
  "smallBlind": 1,
  "bigBlind": 2,
  "chipValue": 10,
  "buyInChips": 100,
  "sessionMinutes": 60,
  "startTime": "'$(date -u +%Y-%m-%dT%H:%M:%S.%3NZ)'",
  "endTime": "'$(date -u +%Y-%m-%dT%H:%M:%S.%3NZ)'",
  "players": [
    {
      "id": 9999999999998,
      "name": "Test Player A",
      "buyIns": 1,
      "endChips": 150,
      "profit": 50,
      "position": 1,
      "notes": "Test data"
    },
    {
      "id": 9999999999997,
      "name": "Test Player B", 
      "buyIns": 1,
      "endChips": 50,
      "profit": -50,
      "position": 2,
      "notes": "Test data"
    }
  ]
}'

echo "Adding test game..."
curl -s -X POST "${API_BASE}/history" \
  -H "Content-Type: application/json" \
  -d "$TEST_GAME" | python3 -m json.tool
echo ""

echo "4. Verifying data was saved..."
curl -s "${API_BASE}/history" | python3 -m json.tool
echo ""

echo "5. Testing new API endpoints..."
echo "Get player list:"
curl -s "${API_BASE}/players" | python3 -m json.tool
echo ""

echo "Get game list:"
curl -s "${API_BASE}/games" | python3 -m json.tool
echo ""

echo "======================================"
echo "  Test complete"
echo "======================================"
