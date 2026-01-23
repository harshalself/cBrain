#!/bin/bash

# Phase 2 - Complete Test Suite Runner
# Runs all Phase 2 tests in sequence

set -e

echo "================================================================"
echo "  Phase 2: Complete Test Suite"
echo "================================================================"
echo ""
echo "This script will run all Phase 2 feature tests:"
echo "  1. Folder Management"
echo "  2. Notification System"
echo "  3. User Invitations"
echo "  4. Onboarding System"
echo ""
echo "Prerequisites:"
echo "  - Backend server running on http://localhost:5000"
echo "  - Admin user exists (admin@gmail.com / 12345678)"
echo "  - Database is seeded and ready"
echo ""
read -p "Press Enter to continue or Ctrl+C to cancel..."
echo ""

# Track failures
FAILED_TESTS=()

# Test 1: Folder Management
echo "================================================================"
echo "TEST 1: Folder Management"
echo "================================================================"
if ./tests/phase2-task1-folders-test.sh; then
  echo "✅ Folder Management tests PASSED"
else
  echo "❌ Folder Management tests FAILED"
  FAILED_TESTS+=("Folder Management")
fi
echo ""
sleep 2

# Test 2: Notification System
echo "================================================================"
echo "TEST 2: Notification System"
echo "================================================================"
if ./tests/phase2-task2-notifications-test.sh; then
  echo "✅ Notification System tests PASSED"
else
  echo "❌ Notification System tests FAILED"
  FAILED_TESTS+=("Notification System")
fi
echo ""
sleep 2

# Test 3: User Invitations
echo "================================================================"
echo "TEST 3: User Invitations"
echo "================================================================"
if ./tests/phase2-task3-invitations-test.sh; then
  echo "✅ User Invitations tests PASSED"
else
  echo "❌ User Invitations tests FAILED"
  FAILED_TESTS+=("User Invitations")
fi
echo ""
sleep 2

# Test 4: Onboarding System
echo "================================================================"
echo "TEST 4: Onboarding System"
echo "================================================================"
if ./tests/phase2-task4-onboarding-test.sh; then
  echo "✅ Onboarding System tests PASSED"
else
  echo "❌ Onboarding System tests FAILED"
  FAILED_TESTS+=("Onboarding System")
fi
echo ""

# Summary
echo "================================================================"
echo "  FINAL SUMMARY"
echo "================================================================"
echo ""

TOTAL_TESTS=4
PASSED_TESTS=$((TOTAL_TESTS - ${#FAILED_TESTS[@]}))

echo "Total Tests: $TOTAL_TESTS"
echo "Passed: $PASSED_TESTS"
echo "Failed: ${#FAILED_TESTS[@]}"
echo ""

if [ ${#FAILED_TESTS[@]} -eq 0 ]; then
  echo "🎉 ALL TESTS PASSED! 🎉"
  echo ""
  echo "Phase 2 implementation is verified and working correctly!"
  exit 0
else
  echo "❌ SOME TESTS FAILED"
  echo ""
  echo "Failed tests:"
  for test in "${FAILED_TESTS[@]}"; do
    echo "  - $test"
  done
  echo ""
  echo "Please review the output above and fix any issues."
  exit 1
fi
