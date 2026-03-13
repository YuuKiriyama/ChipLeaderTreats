#!/bin/bash

echo "======================================"
echo "  Test New Backend Storage Structure"
echo "======================================"
echo ""

API_BASE="http://localhost:3001/api"

echo "1. Testing health check..."
curl -s "${API_BASE}/health" | python3 -m json.tool
echo ""

echo "2. Testing get player list..."
curl -s "${API_BASE}/players" | python3 -m json.tool
echo ""

echo "3. Testing get game list..."
curl -s "${API_BASE}/games" | python3 -m json.tool
echo ""

echo "4. Testing add player..."
PLAYER_DATA='{"name":"Test Player","nickname":"TestNick","phone":"13800138000","email":"test@example.com","notes":"This is a test player","isFavorite":true}'
curl -s -X POST "${API_BASE}/players" \
  -H "Content-Type: application/json" \
  -d "$PLAYER_DATA" | python3 -m json.tool
echo ""

echo "5. Testing add game..."
GAME_DATA='{"gameName":"Test Game","smallBlind":1,"bigBlind":2,"chipValue":10,"buyInChips":100,"sessionMinutes":120}'
curl -s -X POST "${API_BASE}/games" \
  -H "Content-Type: application/json" \
  -d "$GAME_DATA" | python3 -m json.tool
echo ""

echo "6. Testing get game player records..."
curl -s "${API_BASE}/game-players" | python3 -m json.tool
echo ""

echo "7. Testing compatibility endpoint - get history..."
curl -s "${API_BASE}/history" | python3 -m json.tool
echo ""

echo "8. Testing compatibility endpoint - get favorites..."
curl -s "${API_BASE}/favorites" | python3 -m json.tool
echo ""

echo "======================================"
echo "  Test complete"
echo "======================================"
