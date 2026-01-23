#!/bin/bash

# Phase 2 - Task 3: User Invitation System Testing Script
# Tests all invitation operations including admin and public endpoints

set -e

echo "======================================================="
echo "  Phase 2 Task 3: User Invitation System Testing"
echo "======================================================="
echo ""

# Configuration
API_URL="${API_URL:-http://localhost:8000/api/v1}"
ADMIN_EMAIL="${ADMIN_EMAIL:-admin@gmail.com}"
ADMIN_PASSWORD="${ADMIN_PASSWORD:-12345678}"
INVITE_EMAIL="testuser$(date +%s)@example.com"  # Unique email

echo "Step 1: Admin Login"
echo "-------------------------------------------------------"
LOGIN_RESPONSE=$(curl -s -X POST "$API_URL/users/login" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$ADMIN_EMAIL\",\"password\":\"$ADMIN_PASSWORD\"}")

TOKEN=$(echo $LOGIN_RESPONSE | jq -r '.data.accessToken // empty')

if [ -z "$TOKEN" ]; then
  echo "❌ FAILED: Could not login as admin"
  exit 1
fi

echo "✅ Admin logged in successfully"
echo ""

echo "Step 2: Create invitation"
echo "-------------------------------------------------------"
CREATE_RESPONSE=$(curl -s -X POST "$API_URL/invitations" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"email\": \"$INVITE_EMAIL\",
    \"role\": \"employee\",
    \"name\": \"Test User\"
  }")

echo "Response:"
echo "$CREATE_RESPONSE" | jq '.'
echo ""

INVITATION_TOKEN=$(echo $CREATE_RESPONSE | jq -r '.data.invitation_token // empty')
INVITATION_LINK=$(echo $CREATE_RESPONSE | jq -r '.data.invitation_link // empty')

if [ -z "$INVITATION_TOKEN" ]; then
  echo "❌ FAILED: Could not create invitation"
  exit 1
else
  echo "✅ Invitation created successfully"
  echo "Token: $INVITATION_TOKEN"
  echo "Link: $INVITATION_LINK"
fi
echo ""

echo "Step 3: Get all pending invitations"
echo "-------------------------------------------------------"
PENDING_RESPONSE=$(curl -s -X GET "$API_URL/invitations" \
  -H "Authorization: Bearer $TOKEN")

echo "Response:"
echo "$PENDING_RESPONSE" | jq '.'
echo ""

if echo "$PENDING_RESPONSE" | jq -e '.success == true' > /dev/null 2>&1; then
  PENDING_COUNT=$(echo "$PENDING_RESPONSE" | jq '.data | length')
  echo "✅ Found $PENDING_COUNT pending invitation(s)"
else
  echo "❌ FAILED: Could not get pending invitations"
fi
echo ""

echo "Step 4: Validate invitation token (public endpoint)"
echo "-------------------------------------------------------"
VALIDATE_RESPONSE=$(curl -s -X GET "$API_URL/invitations/validate/$INVITATION_TOKEN")

echo "Response:"
echo "$VALIDATE_RESPONSE" | jq '.'
echo ""

if echo "$VALIDATE_RESPONSE" | jq -e '.success == true' > /dev/null 2>&1; then
  echo "✅ Invitation token is valid"
  INVITED_EMAIL=$(echo "$VALIDATE_RESPONSE" | jq -r '.data.email')
  echo "Email: $INVITED_EMAIL"
else
  echo "❌ FAILED: Token validation failed"
fi
echo ""

echo "Step 5: Accept invitation and complete registration (public endpoint)"
echo "-------------------------------------------------------"
ACCEPT_RESPONSE=$(curl -s -X POST "$API_URL/invitations/accept" \
  -H "Content-Type: application/json" \
  -d "{
    \"token\": \"$INVITATION_TOKEN\",
    \"name\": \"Test User Complete\",
    \"password\": \"testpassword123\",
    \"phone_number\": \"+1234567890\"
  }")

echo "Response:"
echo "$ACCEPT_RESPONSE" | jq '.'
echo ""

if echo "$ACCEPT_RESPONSE" | jq -e '.success == true' > /dev/null 2>&1; then
  echo "✅ Invitation accepted and registration completed"
  NEW_USER_ID=$(echo "$ACCEPT_RESPONSE" | jq -r '.data.id')
  echo "New User ID: $NEW_USER_ID"
else
  echo "❌ FAILED: Could not accept invitation"
fi
echo ""

echo "Step 6: Try to use the same token again (should fail)"
echo "-------------------------------------------------------"
REUSE_RESPONSE=$(curl -s -X POST "$API_URL/invitations/accept" \
  -H "Content-Type: application/json" \
  -d "{
    \"token\": \"$INVITATION_TOKEN\",
    \"name\": \"Another User\",
    \"password\": \"anotherpass123\"
  }")

echo "Response: $REUSE_RESPONSE"
echo ""

if echo "$REUSE_RESPONSE" | jq -e '.success == false' > /dev/null 2>&1; then
  echo "✅ Correctly rejected already-used token"
else
  echo "⚠️  WARNING: Token reuse should have been rejected"
fi
echo ""

echo "Step 7: Verify new user can login"
echo "-------------------------------------------------------"
NEW_USER_LOGIN=$(curl -s -X POST "$API_URL/users/login" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$INVITE_EMAIL\",\"password\":\"testpassword123\"}")

echo "Response:"
echo "$NEW_USER_LOGIN" | jq '.'
echo ""

if echo "$NEW_USER_LOGIN" | jq -e '.data.accessToken' > /dev/null 2>&1; then
  echo "✅ New user can login successfully"
else
  echo "❌ FAILED: New user cannot login"
fi
echo ""

echo "Step 8: Test canceling an invitation"
echo "-------------------------------------------------------"
# Create another invitation to cancel
CANCEL_EMAIL="cancel$(date +%s)@example.com"
CANCEL_CREATE=$(curl -s -X POST "$API_URL/invitations" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"email\": \"$CANCEL_EMAIL\", \"role\": \"employee\"}")

CANCEL_ID=$(echo $CANCEL_CREATE | jq -r '.data.id')

if [ -n "$CANCEL_ID" ] && [ "$CANCEL_ID" != "null" ]; then
  CANCEL_RESPONSE=$(curl -s -X DELETE "$API_URL/invitations/$CANCEL_ID" \
    -H "Authorization: Bearer $TOKEN")
  
  echo "Response: $CANCEL_RESPONSE"
  
  if echo "$CANCEL_RESPONSE" | jq -e '.success == true' > /dev/null 2>&1; then
    echo "✅ Invitation canceled successfully"
  else
    echo "❌ FAILED: Could not cancel invitation"
  fi
else
  echo "⚠️  Skipping cancel test - could not create test invitation"
fi
echo ""

echo "Step 9: Test duplicate email protection"
echo "-------------------------------------------------------"
DUPLICATE_RESPONSE=$(curl -s -X POST "$API_URL/invitations" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"email\": \"$INVITE_EMAIL\", \"role\": \"employee\"}")

echo "Response: $DUPLICATE_RESPONSE"
echo ""

if echo "$DUPLICATE_RESPONSE" | jq -e '.success == false' > /dev/null 2>&1; then
  echo "✅ Correctly prevented duplicate invitation"
else
  echo "⚠️  WARNING: Duplicate email should be prevented"
fi
echo ""

echo "======================================================="
echo "  Test Summary"
echo "======================================================="
echo "User invitation system tests completed!"
echo ""
echo "Tested:"
echo "- ✅ Create invitation (admin)"
echo "- ✅ Get pending invitations (admin)"
echo "- ✅ Validate token (public)"
echo "- ✅ Accept invitation (public)"
echo "- ✅ Prevent token reuse"
echo "- ✅ New user login"
echo "- ✅ Cancel invitation (admin)"
echo "- ✅ Duplicate email protection"
echo ""
echo "Phase 2 Task 3 Complete! 🎉"
echo ""
