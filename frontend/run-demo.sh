#!/bin/bash

# Quick Start Script for Playwright Demo
# This script helps you run the demo test easily

echo "🎭 cBrain Playwright Demo"
echo ""
echo "Prerequisites Check:"
echo ""

# Check if backend is running
echo "Checking if backend is running on port 8000..."
if curl -s http://localhost:8000 > /dev/null 2>&1; then
    echo "✅ Backend is running"
else
    echo "❌ Backend is NOT running"
    echo ""
    echo "Please start the backend first:"
    echo "  cd backend && npm run dev"
    echo ""
    exit 1
fi

# Check if user exists
echo ""
echo "Make sure you have a user with:"
echo "  Email: admin@cbrain.com"
echo "  Password: Admin@123"
echo ""
read -p "Press Enter to continue..."

# Ask which mode to run
echo ""
echo "How would you like to run the tests?"
echo ""
echo "1) Normal mode (headless, fast)"
echo "2) UI mode (visual, interactive) - RECOMMENDED FOR FIRST TIME"
echo "3) Debug mode (step-by-step)"
echo ""
read -p "Enter choice (1-3): " choice

case $choice in
    1)
        echo ""
        echo "Running tests in headless mode..."
        npm run test:e2e
        ;;
    2)
        echo ""
        echo "Opening Playwright UI..."
        npm run test:e2e:ui
        ;;
    3)
        echo ""
        echo "Opening debug mode..."
        npm run test:e2e:debug
        ;;
    *)
        echo "Invalid choice. Exiting."
        exit 1
        ;;
esac

echo ""
echo "✨ Done! To see the HTML report, run:"
echo "   npm run test:e2e:report"
