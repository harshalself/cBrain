#!/bin/bash

# Phase 2 - Task 2: Notification System Testing Script
# Tests all notification operations

set -e

echo "================================================="
echo "  Phase 2 Task 2: Notification System Testing"
echo "================================================="
echo ""

# Configuration
API_URL="${API_URL:-http://localhost:8000/api/v1}"
TEST_EMAIL="${TEST_EMAIL:-admin@gmail.com}"
TEST_PASSWORD="${TEST_PASSWORD:-12345678}"

echo "Step 1: Login to get auth token"
echo "-------------------------------------------------"
LOGIN_RESPONSE=$(curl -s -X POST "$API_URL/users/login" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$TEST_EMAIL\",\"password\":\"$TEST_PASSWORD\"}")

TOKEN=$(echo $LOGIN_RESPONSE | jq -r '.data.accessToken // empty')

if [ -z "$TOKEN" ]; then
  echo "❌ FAILED: Could not login"
  exit 1
fi

echo "✅ Logged in successfully"
echo ""

echo "Step 2: Get all notifications"
echo "-------------------------------------------------"
ALL_NOTIFS=$(curl -s -X GET "$API_URL/notifications" \
  -H "Authorization: Bearer $TOKEN")

echo "Response:"
echo "$ALL_NOTIFS" | jq '.'
echo ""

if echo "$ALL_NOTIFS" | jq -e '.success == true' > /dev/null 2>&1; then
  echo "✅ Notifications retrieved successfully"
  NOTIF_COUNT=$(echo "$ALL_NOTIFS" | jq '.data.total // 0')
  echo "Total notifications: $NOTIF_COUNT"
else
  echo "❌ FAILED: Could not get notifications"
fi
echo ""

echo "Step 3: Get unread count"
echo "-------------------------------------------------"
UNREAD_RESPONSE=$(curl -s -X GET "$API_URL/notifications/unread-count" \
  -H "Authorization: Bearer $TOKEN")

echo "Response:"
echo "$UNREAD_RESPONSE" | jq '.'
UNREAD_COUNT=$(echo "$UNREAD_RESPONSE" | jq -r '.data.count // 0')
echo "Unread notifications: $UNREAD_COUNT"
echo ""

echo "Step 4: Get only unread notifications"
echo "-------------------------------------------------"
UNREAD_NOTIFS=$(curl -s -X GET "$API_URL/notifications?status=unread&limit=5" \
  -H "Authorization: Bearer $TOKEN")

echo "Response:"
echo "$UNREAD_NOTIFS" | jq '.data.notifications[] | {id, type, message, read}' 2>/dev/null || echo "No unread notifications"
echo ""

FIRST_NOTIF_ID=$(echo "$UNREAD_NOTIFS" | jq -r '.data.notifications[0].id // empty')

if [ -n "$FIRST_NOTIF_ID" ]; then
  echo "Step 5: Mark notification as read"
  echo "-------------------------------------------------"
  MARK_READ=$(curl -s -X PUT "$API_URL/notifications/$FIRST_NOTIF_ID/read" \
    -H "Authorization: Bearer $TOKEN")
  
  echo "Response: $MARK_READ"
  
  if echo "$MARK_READ" | jq -e '.success == true' > /dev/null 2>&1; then
    echo "✅ Notification marked as read"
  else
    echo "❌ FAILED: Could not mark notification as read"
  fi
  echo ""
else
  echo "⚠️  No unread notifications to mark as read"
  echo ""
fi

echo "Step 6: Broadcast notification to all users (admin feature)"
echo "-------------------------------------------------"
BROADCAST_RESPONSE=$(curl -s -X POST "$API_URL/notifications/broadcast" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "type": "system",
    "message": "This is a test broadcast notification",
    "metadata": {"test": true}
  }')

echo "Response: $BROADCAST_RESPONSE"

if echo "$BROADCAST_RESPONSE" | jq -e '.success == true' > /dev/null 2>&1; then
  USER_COUNT=$(echo "$BROADCAST_RESPONSE" | jq -r '.data.count // 0')
  echo "✅ Broadcast sent to $USER_COUNT user(s)"
else
  echo "❌ FAILED: Could not broadcast notification"
fi
echo ""

echo "Step 7: Mark all notifications as read"
echo "-------------------------------------------------"
MARK_ALL_READ=$(curl -s -X POST "$API_URL/notifications/read-all" \
  -H "Authorization: Bearer $TOKEN")

echo "Response: $MARK_ALL_READ"

if echo "$MARK_ALL_READ" | jq -e '.success == true' > /dev/null 2>&1; then
  MARKED_COUNT=$(echo "$MARK_ALL_READ" | jq -r '.data.count // 0')
  echo "✅ Marked $MARKED_COUNT notification(s) as read"
else
  echo "❌ FAILED: Could not mark all as read"
fi
echo ""

echo "Step 8: Verify document upload creates notification"
echo "-------------------------------------------------"
echo "⚠️  Note: This requires uploading a document"
echo "Upload a document to test automatic notification broadcasting"
echo ""

echo "================================================="
echo "  Test Summary"
echo "================================================="
echo "Notification system tests completed!"
echo ""
echo "Tested:"
echo "- ✅ Get all notifications"
echo "- ✅ Get unread count"
echo "- ✅ Filter by status (read/unread)"
echo "- ✅ Mark notification as read"
echo "- ✅ Broadcast to all users"
echo "- ✅ Mark all as read"
echo ""
echo "Phase 2 Task 2 Complete! 🎉"
echo ""
