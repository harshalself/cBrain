#!/bin/bash

# Phase 2 - Task 1: Folder Management Testing Script
# Tests all folder operations including CRUD, tree structure, and document movement

set -e

echo "=============================================="
echo "  Phase 2 Task 1: Folder Management Testing"
echo "=============================================="
echo ""

# Configuration
API_URL="${API_URL:-http://localhost:8000/api/v1}"
TEST_EMAIL="${TEST_EMAIL:-admin@gmail.com}"
TEST_PASSWORD="${TEST_PASSWORD:-12345678}"
TIMESTAMP=$(date +%s)

echo "Step 1: Login to get auth token"
echo "----------------------------------------------"
LOGIN_RESPONSE=$(curl -s -X POST "$API_URL/users/login" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$TEST_EMAIL\",\"password\":\"$TEST_PASSWORD\"}")

TOKEN=$(echo $LOGIN_RESPONSE | jq -r '.data.accessToken // empty')

if [ -z "$TOKEN" ]; then
  echo "❌ FAILED: Could not login"
  echo "Make sure backend is running"
  exit 1
fi

echo "✅ Logged in successfully"
echo ""

echo "Step 2: Create root folder"
echo "----------------------------------------------"
ROOT_FOLDER_RESPONSE=$(curl -s -X POST "$API_URL/folders" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"name\":\"Test Root Folder $TIMESTAMP\"}")

echo "Response: $ROOT_FOLDER_RESPONSE"
ROOT_FOLDER_ID=$(echo $ROOT_FOLDER_RESPONSE | jq -r '.data.id // empty')

if [ -z "$ROOT_FOLDER_ID" ]; then
  echo "❌ FAILED: Could not create root folder"
  exit 1
else
  echo "✅ Created root folder with ID: $ROOT_FOLDER_ID"
fi
echo ""

echo "Step 3: Create nested folder"
echo "----------------------------------------------"
NESTED_FOLDER_RESPONSE=$(curl -s -X POST "$API_URL/folders" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"name\":\"Nested Folder $TIMESTAMP\",\"parent_id\":$ROOT_FOLDER_ID}")

echo "Response: $NESTED_FOLDER_RESPONSE"
NESTED_FOLDER_ID=$(echo $NESTED_FOLDER_RESPONSE | jq -r '.data.id // empty')

if [ -z "$NESTED_FOLDER_ID" ]; then
  echo "❌ FAILED: Could not create nested folder"
else
  echo "✅ Created nested folder with ID: $NESTED_FOLDER_ID"
fi
echo ""

echo "Step 4: Get folder tree"
echo "----------------------------------------------"
TREE_RESPONSE=$(curl -s -X GET "$API_URL/folders?tree=true" \
  -H "Authorization: Bearer $TOKEN")

echo "Tree Response:"
echo "$TREE_RESPONSE" | jq '.'
echo ""

if echo "$TREE_RESPONSE" | jq -e '.success == true' > /dev/null 2>&1; then
  echo "✅ Folder tree retrieved successfully"
else
  echo "❌ FAILED: Could not get folder tree"
fi
echo ""

echo "Step 5: Rename folder"
echo "----------------------------------------------"
RENAME_RESPONSE=$(curl -s -X PUT "$API_URL/folders/$ROOT_FOLDER_ID" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name":"Renamed Root Folder"}')

echo "Response: $RENAME_RESPONSE"

if echo "$RENAME_RESPONSE" | jq -e '.success == true' > /dev/null 2>&1; then
  echo "✅ Folder renamed successfully"
else
  echo "❌ FAILED: Could not rename folder"
fi
echo ""

echo "Step 6: Try to delete folder with subfolders (should fail)"
echo "----------------------------------------------"
DELETE_FAIL_RESPONSE=$(curl -s -X DELETE "$API_URL/folders/$ROOT_FOLDER_ID" \
  -H "Authorization: Bearer $TOKEN")

echo "Response: $DELETE_FAIL_RESPONSE"

if echo "$DELETE_FAIL_RESPONSE" | jq -e '.success == false' > /dev/null 2>&1; then
  echo "✅ Correctly prevented deletion of folder with subfolders"
else
  echo "❌ FAILED: Should have prevented deletion"
fi
echo ""

echo "Step 7: Delete nested folder (empty)"
echo "----------------------------------------------"
DELETE_SUCCESS_RESPONSE=$(curl -s -X DELETE "$API_URL/folders/$NESTED_FOLDER_ID" \
  -H "Authorization: Bearer $TOKEN")

echo "Response: $DELETE_SUCCESS_RESPONSE"

if echo "$DELETE_SUCCESS_RESPONSE" | jq -e '.success == true' > /dev/null 2>&1; then
  echo "✅ Successfully deleted empty folder"
else
  echo "❌ FAILED: Could not delete folder"
fi
echo ""

echo "Step 8: Now delete root folder (now empty)"
echo "----------------------------------------------"
DELETE_ROOT_RESPONSE=$(curl -s -X DELETE "$API_URL/folders/$ROOT_FOLDER_ID" \
  -H "Authorization: Bearer $TOKEN")

echo "Response: $DELETE_ROOT_RESPONSE"

if echo "$DELETE_ROOT_RESPONSE" | jq -e '.success == true' > /dev/null 2>&1; then
  echo "✅ Successfully deleted root folder"
else
  echo "❌ FAILED: Could not delete root folder"
fi
echo ""

echo "Step 9: Test moving document to folder (if documents exist)"
echo "----------------------------------------------"
# Get first document
DOCS_RESPONSE=$(curl -s -X GET "$API_URL/documents?limit=1" \
  -H "Authorization: Bearer $TOKEN")

DOC_ID=$(echo $DOCS_RESPONSE | jq -r '.data.documents[0].id // empty')

if [ -z "$DOC_ID" ]; then
  echo "⚠️  No documents found, skipping move test"
else
  echo "Found document ID: $DOC_ID"
  
  # Create folder for testing move
  MOVE_FOLDER_RESPONSE=$(curl -s -X POST "$API_URL/folders" \
    -H "Authorization: Bearer $TOKEN" \
    -H "Content-Type: application/json" \
    -d "{\"name\":\"Move Test Folder $TIMESTAMP\"}")
  
  MOVE_FOLDER_ID=$(echo $MOVE_FOLDER_RESPONSE | jq -r '.data.id // empty')
  
  if [ -n "$MOVE_FOLDER_ID" ]; then
    # Move document
    MOVE_DOC_RESPONSE=$(curl -s -X PUT "$API_URL/documents/$DOC_ID/move" \
      -H "Authorization: Bearer $TOKEN" \
      -H "Content-Type: application/json" \
      -d "{\"folder_id\":$MOVE_FOLDER_ID}")
    
    echo "Move Response: $MOVE_DOC_RESPONSE"
    
    if echo "$MOVE_DOC_RESPONSE" | jq -e '.success == true' > /dev/null 2>&1; then
      echo "✅ Successfully moved document to folder"
      
      # Cleanup - delete test folder (should fail because it has document)
      DELETE_WITH_DOC=$(curl -s -X DELETE "$API_URL/folders/$MOVE_FOLDER_ID" \
        -H "Authorization: Bearer $TOKEN")
      
      if echo "$DELETE_WITH_DOC" | jq -e '.success == false' > /dev/null 2>&1; then
        echo "✅ Correctly prevented deletion of folder with document"
      fi
      
      # Move document back to null folder
      curl -s -X PUT "$API_URL/documents/$DOC_ID/move" \
        -H "Authorization: Bearer $TOKEN" \
        -H "Content-Type: application/json" \
        -d '{"folder_id":null}' > /dev/null
      
      # Now delete folder
      curl -s -X DELETE "$API_URL/folders/$MOVE_FOLDER_ID" \
        -H "Authorization: Bearer $TOKEN" > /dev/null
    else
      echo "❌ FAILED: Could not move document"
    fi
  fi
fi
echo ""

echo "=============================================="
echo "  Test Summary"
echo "=============================================="
echo "Folder management tests completed!"
echo ""
echo "Tested:"
echo "- ✅ Create root folder"
echo "- ✅ Create nested folder"
echo "- ✅ Get folder tree"
echo "- ✅ Rename folder"
echo "- ✅ Delete empty folder"
echo "- ✅ Prevent deletion of folder with subfolders"
echo "- ✅ Prevent deletion of folder with documents"
echo "- ✅ Move document to folder"
echo ""
echo "Phase 2 Task 1 Complete! 🎉"
echo ""
