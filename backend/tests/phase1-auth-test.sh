#!/bin/bash

# Phase 1 - Authentication Testing Script
# Tests all authentication endpoints

set -e  # Exit on error

echo "======================================"
echo "  Phase 1: Authentication Testing"
echo "======================================"
echo ""

# Configuration
API_URL="${API_URL:-http://localhost:8000/api/v1}"
TEST_EMAIL="${TEST_EMAIL:-admin@gmail.com}"
TEST_PASSWORD="${TEST_PASSWORD:-12345678}"

echo "Configuration:"
echo "  API URL: $API_URL"
echo "  Test Email: $TEST_EMAIL"
echo ""

# Test 1: Login
echo "Test 1: Login"
echo "----------------------------------------"
LOGIN_RESPONSE=$(curl -s -X POST "$API_URL/users/login" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$TEST_EMAIL\",\"password\":\"$TEST_PASSWORD\"}")

echo "Response: $LOGIN_RESPONSE"
echo ""

# Extract tokens
ACCESS_TOKEN=$(echo $LOGIN_RESPONSE | jq -r '.data.accessToken // empty')
REFRESH_TOKEN=$(echo $LOGIN_RESPONSE | jq -r '.data.refreshToken // empty')

if [ -z "$ACCESS_TOKEN" ]; then
  echo "❌ FAILED: No access token received"
  echo "Response was: $LOGIN_RESPONSE"
  exit 1
else
  echo "✅ PASSED: Login successful"
  echo "Access Token: ${ACCESS_TOKEN:0:50}..."
  echo "Refresh Token: ${REFRESH_TOKEN:0:50}..."
fi
echo ""

# Test 2: Get Current User
echo "Test 2: Get Current User (/users/me)"
echo "----------------------------------------"
ME_RESPONSE=$(curl -s -X GET "$API_URL/users/me" \
  -H "Authorization: Bearer $ACCESS_TOKEN")

echo "Response: $ME_RESPONSE"
echo ""

USER_ID=$(echo $ME_RESPONSE | jq -r '.data.id // empty')
if [ -z "$USER_ID" ]; then
  echo "❌ FAILED: Could not get current user"
else
  echo "✅ PASSED: Current user retrieved"
  echo "User ID: $USER_ID"
  echo "Email: $(echo $ME_RESPONSE | jq -r '.data.email')"
  echo "Role: $(echo $ME_RESPONSE | jq -r '.data.role')"
fi
echo ""

# Test 3: Protected Route Without Token
echo "Test 3: Protected Route Without Token"
echo "----------------------------------------"
UNAUTHORIZED_RESPONSE=$(curl -s -X GET "$API_URL/users/me")

echo "Response: $UNAUTHORIZED_RESPONSE"
echo ""

if echo "$UNAUTHORIZED_RESPONSE" | jq -e '.success == false' > /dev/null 2>&1; then
  echo "✅ PASSED: Correctly rejected unauthorized request"
else
  echo "❌ FAILED: Should have rejected request without token"
fi
echo ""

# Test 4: Token Refresh
echo "Test 4: Token Refresh"
echo "----------------------------------------"
REFRESH_RESPONSE=$(curl -s -X POST "$API_URL/users/refresh" \
  -H "Content-Type: application/json" \
  -d "{\"refreshToken\":\"$REFRESH_TOKEN\"}")

echo "Response: $REFRESH_RESPONSE"
echo ""

NEW_ACCESS_TOKEN=$(echo $REFRESH_RESPONSE | jq -r '.data.accessToken // empty')
if [ -z "$NEW_ACCESS_TOKEN" ]; then
  echo "❌ FAILED: Token refresh failed"
else
  echo "✅ PASSED: Token refreshed successfully"
  echo "New Access Token: ${NEW_ACCESS_TOKEN:0:50}..."
fi
echo ""

# Test 5: Use New Token
echo "Test 5: Verify New Token Works"
echo "----------------------------------------"
NEW_TOKEN_RESPONSE=$(curl -s -X GET "$API_URL/users/me" \
  -H "Authorization: Bearer $NEW_ACCESS_TOKEN")

echo "Response: $NEW_TOKEN_RESPONSE"
echo ""

if echo "$NEW_TOKEN_RESPONSE" | jq -e '.data.id' > /dev/null 2>&1; then
  echo "✅ PASSED: New token works correctly"
else
  echo "❌ FAILED: New token does not work"
fi
echo ""

# Summary
echo "======================================"
echo "  Test Summary"
echo "======================================"
echo "All authentication tests completed!"
echo ""
echo "Next Steps:"
echo "1. Verify all tests passed (look for ✅)"
echo "2. Proceed to Task 2: Message Rating Implementation"
echo ""
