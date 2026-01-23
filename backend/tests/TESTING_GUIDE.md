# Agent Feature Testing - Quick Start Guide

## Prerequisites Setup

Before running the agent feature tests, you need to set up test credentials.

### 1. Create Admin User

Run the following command to create an admin user for testing:

```bash
npm run create-admin
```

Follow the prompts to create an admin account with:
- **Email**: `admin@test.com` (or your preferred email)
- **Password**: `Test123!@#` (or your preferred password)
- **Role**: Admin

### 2. Update Environment Variables

Add these variables to your `.env` file:

```env
# Test Configuration
TEST_EMAIL=admin@test.com
TEST_PASSWORD=Test123!@#
API_URL=http://localhost:5000

# Required for training tests
GROQ_API_KEY=your_groq_api_key_here
PINECONE_API_KEY=your_pinecone_key_here
PINECONE_ENVIRONMENT=your_pinecone_env_here
```

### 3. Start Backend Server

Make sure the backend is running:

```bash
npm run dev
```

The server should be running on `http://localhost:5000`.

## Running the Tests

### Option 1: Using npm script (Recommended)

```bash
npm run test:agent-features
```

### Option 2: Using the shell script

```bash
./tests/run-agent-tests.sh
```

### Option 3: Direct execution

```bash
npx ts-node tests/test-agent-features-integration.ts
```

## What the Tests Do

The integration tests will:

1. ✅ **Authenticate** using the test credentials
2. 📄 **Upload a test document** to the Knowledge Base
3. 📋 **List all documents** and verify the test document appears
4. 🤖 **Create a test agent** with configured provider/model
5. 🔗 **Link documents to the agent** via the training endpoint
6. 🚀 **Monitor training status** as the job progresses
7. 📊 **Fetch provider models** available in the system
8. 💬 **Test playground chat** with ephemeral overrides
9. 🧹 **Clean up** all test resources automatically

## Expected Output

```
████████████████████████████████████████████████████████████
  AGENT FEATURE INTEGRATION TESTS
████████████████████████████████████████████████████████████

============================================================
  Authentication
============================================================
✅ Authenticated as admin@test.com

============================================================
  Test 1: Document Upload to Knowledge Base
============================================================
✅ Document uploaded successfully
ℹ️  Document ID: 42

[... more test output ...]

============================================================
  All Tests Completed Successfully! 🎉
============================================================
✅ Total duration: 8.45s

✨ Test suite completed successfully!
```

## Troubleshooting

### "Authentication failed" (403 error)

**Problem**: The test credentials don't match an existing admin user.

**Solution**:
1. Run `npm run create-admin` to create the admin user
2. Make sure `TEST_EMAIL` and `TEST_PASSWORD` in `.env` match the admin credentials
3. Verify the user has admin role in the database

### "Backend might not be running"

**Problem**: Can't connect to the API.

**Solution**:
1. Start the backend: `npm run dev`
2. Verify it's running on the correct port
3. Check `API_URL` in `.env` matches your backend URL

### "Training failed"

**Problem**: Missing or invalid API keys.

**Solution**:
1. Add valid `GROQ_API_KEY` to `.env`
2. Add valid Pinecone credentials to `.env`
3. Verify the agent's provider/model configuration is valid

### "Document upload failed"

**Problem**: File permissions or storage configuration issue.

**Solution**:
1. Check write permissions in the test directory
2. Verify S3/storage configuration in `.env`
3. Check backend logs for detailed error messages

## Manual Testing Alternative

If you prefer to test manually, you can use these curl commands:

### 1. Login
```bash
curl -X POST http://localhost:5000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@test.com","password":"Test123!@#"}'
```

### 2. Upload Document
```bash
curl -X POST http://localhost:5000/documents/upload \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "file=@/path/to/test.pdf" \
  -F "name=Test Document"
```

### 3. Create Agent
```bash
curl -X POST http://localhost:5000/agents \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Agent",
    "provider": "groq",
    "model": "llama3-8b-8192",
    "api_key": "YOUR_GROQ_KEY"
  }'
```

### 4. Train with Documents
```bash
curl -X POST http://localhost:5000/agents/AGENT_ID/train \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"documentIds": [1, 2, 3]}'
```

## Next Steps

After successful tests:
1. Review the walkthrough document for implementation details
2. Check the AGENTS_FEATURE_PLAN.md for completion status
3. Begin frontend implementation of the three admin tabs
4. Test the full user flow from upload to chat

## Support

If you encounter issues not covered here:
1. Check backend logs in `backend/logs/`
2. Review the error.log file
3. Ensure all dependencies are installed: `npm install`
4. Verify database migrations are up to date
