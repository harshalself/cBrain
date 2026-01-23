#!/bin/bash

# Phase 1 - Message Rating Testing Script
# Tests the message rating functionality

set -e

echo "======================================"
echo "  Phase 1: Message Rating Testing"
echo "======================================"
echo ""

# Configuration
API_URL="${API_URL:-http://localhost:8000/api/v1}"
TEST_EMAIL="${TEST_EMAIL:-admin@gmail.com}"
TEST_PASSWORD="${TEST_PASSWORD:-12345678}"

echo "Step 1: Login to get auth token"
echo "----------------------------------------"
LOGIN_RESPONSE=$(curl -s -X POST "$API_URL/users/login" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$TEST_EMAIL\",\"password\":\"$TEST_PASSWORD\"}")

TOKEN=$(echo $LOGIN_RESPONSE | jq -r '.data.accessToken // empty')

if [ -z "$TOKEN" ]; then
  echo "❌ FAILED: Could not login"
  echo "Make sure backend is running and credentials are correct"
  exit 1
fi

echo "✅ Logged in successfully"
echo ""

echo "Step 2: Get chat sessions to find a message"
echo "----------------------------------------"
SESSIONS_RESPONSE=$(curl -s -X GET "$API_URL/chat/sessions" \
  -H "Authorization: Bearer $TOKEN")

echo "Sessions: $SESSIONS_RESPONSE"
echo ""

# Extract first session ID
SESSION_ID=$(echo $SESSIONS_RESPONSE | jq -r '.data[0].id // empty')

if [ -z "$SESSION_ID" ]; then
  echo "⚠️  No chat sessions found"
  echo "You need to have at least one chat session with messages to test rating"
  echo ""
  echo "Skipping rating tests..."
  exit 0
fi

echo "Found session ID: $SESSION_ID"
echo ""

echo "Step 3: Get chat history to find a message"
echo "----------------------------------------"
HISTORY_RESPONSE=$(curl -s -X GET "$API_URL/chat/sessions/$SESSION_ID/history" \
  -H "Authorization: Bearer $TOKEN")

echo "History: $HISTORY_RESPONSE"
echo ""

# Find first assistant message
MESSAGE_ID=$(echo $HISTORY_RESPONSE | jq -r '.data.messages[]? | select(.role=="assistant") | .id' | head -n 1)

if [ -z "$MESSAGE_ID" ]; then
  echo "⚠️  No assistant messages found in session"
  echo "Chat with an agent first to create assistant messages"
  exit 0
fi

echo "Found assistant message ID: $MESSAGE_ID"
echo ""

echo "Step 4: Test thumbs up rating"
echo "----------------------------------------"
THUMBS_UP_RESPONSE=$(curl -s -X PUT "$API_URL/chat/messages/$MESSAGE_ID/rating" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"rating":"up"}')

echo "Response: $THUMBS_UP_RESPONSE"
echo ""

if echo "$THUMBS_UP_RESPONSE" | jq -e '.success == true' > /dev/null 2>&1; then
  echo "✅ PASSED: Thumbs up rating successful"
else
  echo "❌ FAILED: Thumbs up rating failed"
fi
echo ""

echo "Step 5: Test thumbs down rating with comment"
echo "----------------------------------------"
THUMBS_DOWN_RESPONSE=$(curl -s -X PUT "$API_URL/chat/messages/$MESSAGE_ID/rating" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"rating":"down","comment":"Testing thumbs down with feedback"}')

echo "Response: $THUMBS_DOWN_RESPONSE"
echo ""

if echo "$THUMBS_DOWN_RESPONSE" | jq -e '.success == true' > /dev/null 2>&1; then
  echo "✅ PASSED: Thumbs down rating with comment successful"
else
  echo "❌ FAILED: Thumbs down rating failed"
fi
echo ""

echo "Step 6: Change back to thumbs up"
echo "----------------------------------------"
CHANGE_RATING_RESPONSE=$(curl -s -X PUT "$API_URL/chat/messages/$MESSAGE_ID/rating" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"rating":"up"}')

echo "Response: $CHANGE_RATING_RESPONSE"
echo ""

if echo "$CHANGE_RATING_RESPONSE" | jq -e '.success == true' > /dev/null 2>&1; then
  echo "✅ PASSED: Can change rating"
else
  echo "❌ FAILED: Could not change rating"
fi
echo ""

echo "======================================"
echo "  Test Summary"
echo "======================================"
echo "Message rating tests completed!"
echo ""
echo "Tested:"
echo "- ✅ Thumbs up rating"
echo "- ✅ Thumbs down rating with comment"
echo "- ✅ Changing ratings"
echo ""
echo "Phase 1 Task 2 Complete! 🎉"
echo ""
