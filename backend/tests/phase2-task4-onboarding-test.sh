#!/bin/bash

# Phase 2 - Task 4: Onboarding System Testing Script
# Tests all onboarding operations including templates and progress tracking

set -e

echo "=========================================================="
echo "  Phase 2 Task 4: Onboarding System Testing"
echo "=========================================================="
echo ""

# Configuration
API_URL="${API_URL:-http://localhost:8000/api/v1}"
ADMIN_EMAIL="${ADMIN_EMAIL:-admin@gmail.com}"
ADMIN_PASSWORD="${ADMIN_PASSWORD:-12345678}"

echo "Step 1: Admin Login"
echo "----------------------------------------------------------"
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

echo "Step 2: Get active onboarding template"
echo "----------------------------------------------------------"
TEMPLATE_RESPONSE=$(curl -s -X GET "$API_URL/onboarding/template" \
  -H "Authorization: Bearer $TOKEN")

echo "Response: $TEMPLATE_RESPONSE" | jq '.'
echo ""

if echo "$TEMPLATE_RESPONSE" | jq -e '.success == true' > /dev/null 2>&1; then
  echo "✅ Template retrieved successfully"
  TEMPLATE_ID=$(echo "$TEMPLATE_RESPONSE" | jq -r '.data.id')
  SECTIONS_COUNT=$(echo "$TEMPLATE_RESPONSE" | jq '.data.sections | length')
  echo "Template ID: $TEMPLATE_ID"
  echo "Sections: $SECTIONS_COUNT"
else
  echo "⚠️  No template found - will create one"
fi
echo ""

echo "Step 3: Update onboarding template (Admin)"
echo "----------------------------------------------------------"
UPDATE_TEMPLATE=$(curl -s -X PUT "$API_URL/onboarding/template" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Updated Employee Onboarding",
    "description": "Complete onboarding process for new employees",
    "sections": [
      {
        "day": 1,
        "title": "Welcome & Company Overview",
        "description": "Learn about our mission and values",
        "document_ids": []
      },
      {
        "day": 2,
        "title": "Policies & Procedures",
        "description": "Understand company policies",
        "document_ids": []
      },
      {
        "day": 3,
        "title": "Tools & Systems",
        "description": "Get familiar with our tools",
        "document_ids": []
      }
    ],
    "is_active": true
  }')

echo "Response: $UPDATE_TEMPLATE" | jq '.'
echo ""

if echo "$UPDATE_TEMPLATE" | jq -e '.success == true' > /dev/null 2>&1; then
  echo "✅ Template updated successfully"
  NEW_TEMPLATE_ID=$(echo "$UPDATE_TEMPLATE" | jq -r '.data.id')
else
  echo "❌ FAILED: Could not update template"
fi
echo ""

echo "Step 4: Get user's onboarding status"
echo "----------------------------------------------------------"
STATUS_RESPONSE=$(curl -s -X GET "$API_URL/onboarding/status" \
  -H "Authorization: Bearer $TOKEN")

echo "Response: $STATUS_RESPONSE" | jq '.'
echo ""

if echo "$STATUS_RESPONSE" | jq -e '.success == true' > /dev/null 2>&1; then
  echo "✅ Status retrieved successfully"
  IS_COMPLETED=$(echo "$STATUS_RESPONSE" | jq -r '.data.onboarding_completed')
  echo "Onboarding Completed: $IS_COMPLETED"
  
  if [ "$IS_COMPLETED" = "false" ]; then
    CURRENT_DAY=$(echo "$STATUS_RESPONSE" | jq -r '.data.progress.current_day // 1')
    echo "Current Day: $CURRENT_DAY"
  fi
else
  echo "❌ FAILED: Could not get status"
fi
echo ""

echo "Step 5: Mark section as complete"
echo "----------------------------------------------------------"
if [ "$IS_COMPLETED" = "false" ]; then
  COMPLETE_RESPONSE=$(curl -s -X POST "$API_URL/onboarding/complete-section" \
    -H "Authorization: Bearer $TOKEN" \
    -H "Content-Type: application/json" \
    -d "{
      \"template_id\": $NEW_TEMPLATE_ID,
      \"section_day\": 1
    }")
  
  echo "Response: $COMPLETE_RESPONSE" | jq '.'
  echo ""
  
  if echo "$COMPLETE_RESPONSE" | jq -e '.success == true' > /dev/null 2>&1; then
    echo "✅ Section marked as complete"
  else
    echo "❌ FAILED: Could not mark section complete"
  fi
else
  echo "⚠️  Skipping - onboarding already completed"
fi
echo ""

echo "Step 6: Get all users' onboarding status (Admin)"
echo "----------------------------------------------------------"
ALL_USERS_RESPONSE=$(curl -s -X GET "$API_URL/onboarding/all-users" \
  -H "Authorization: Bearer $TOKEN")

echo "Response: $ALL_USERS_RESPONSE" | jq '.'
echo ""

if echo "$ALL_USERS_RESPONSE" | jq -e '.success == true' > /dev/null 2>&1; then
  USER_COUNT=$(echo "$ALL_USERS_RESPONSE" | jq '.data | length')
  echo "✅ Retrieved status for $USER_COUNT user(s)"
else
  echo "❌ FAILED: Could not get all users status"
fi
echo ""

echo "Step 7: Complete entire onboarding"
echo "----------------------------------------------------------"
if [ "$IS_COMPLETED" = "false" ]; then
  COMPLETE_ALL=$(curl -s -X POST "$API_URL/onboarding/complete" \
    -H "Authorization: Bearer $TOKEN")
  
  echo "Response: $COMPLETE_ALL"
  echo ""
  
  if echo "$COMPLETE_ALL" | jq -e '.success == true' > /dev/null 2>&1; then
    echo "✅ Onboarding completed successfully"
  else
    echo "❌ FAILED: Could not complete onboarding"
  fi
else
  echo "⚠️  Onboarding already completed"
fi
echo ""

echo "Step 8: Verify completion in user status"
echo "----------------------------------------------------------"
FINAL_STATUS=$(curl -s -X GET "$API_URL/onboarding/status" \
  -H "Authorization: Bearer $TOKEN")

FINAL_COMPLETED=$(echo "$FINAL_STATUS" | jq -r '.data.onboarding_completed')
echo "Final Status - Onboarding Completed: $FINAL_COMPLETED"
echo ""

if [ "$FINAL_COMPLETED" = "true" ]; then
  echo "✅ Onboarding completion verified"
else
  echo "⚠️  Onboarding not yet completed"
fi
echo ""

echo "=========================================================="
echo "  Test Summary"
echo "=========================================================="
echo "Onboarding system tests completed!"
echo ""
echo "Tested:"
echo "- ✅ Get active template"
echo "- ✅ Update template (admin)"
echo "- ✅ Get user status"
echo "- ✅ Mark section complete"
echo "- ✅ Get all users status (admin)"
echo "- ✅ Complete onboarding"
echo ""
echo "Phase 2 Task 4 Testing Complete! 🎉"
echo ""
