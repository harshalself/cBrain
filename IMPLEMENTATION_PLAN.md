# 🚀 Implementation Plan - Company Brain
**Phase-Wise Development Roadmap**

**Project Type:** College Project  
**Timeline:** 8-12 weeks  
**Team Size:** 1-3 developers  
**Last Updated:** January 17, 2026  
**Current Phase:** Phase 0 Complete → Phase 1 Starting

---

## 📋 Table of Contents

1. [Overview](#overview)
2. [Phase 0: Setup & Foundation](#phase-0-setup--foundation)
3. [Phase 1: Core MVP](#phase-1-core-mvp)
4. [Phase 2: Document Management](#phase-2-document-management)
5. [Phase 3: Analytics & Onboarding](#phase-3-analytics--onboarding)
6. [Phase 4: Polish & Testing](#phase-4-polish--testing)
7. [Development Best Practices](#development-best-practices)
8. [Timeline Summary](#timeline-summary)

---

## Overview

### Implementation Strategy

This plan follows a **bottom-up, incremental approach**:
- Start with the simplest working version
- Add features incrementally
- Test continuously
- Each phase delivers working functionality

### Total Timeline: 8-12 Weeks

```
Phase 0: Week 1        (Setup)
Phase 1: Weeks 2-4     (Core MVP)
Phase 2: Weeks 5-7     (Documents + RAG)
Phase 3: Weeks 8-10    (Analytics + Onboarding)
Phase 4: Weeks 11-12   (Polish + Testing)
```

### Success Criteria Per Phase

Each phase has clear **deliverables** and **demo-able features**.

---

## Phase 0: Setup & Foundation ✅ **COMPLETE**
**Duration:** 1 week  
**Status:** ✅ **100% Complete** (Completed January 17, 2026)  
**Goal:** Set up development environment and project structure

### 🎉 Completion Summary

**What Was Completed:**
- ✅ All database schemas created (12/10 planned tables - exceeded requirements)
- ✅ Backend and frontend projects running
- ✅ Environment variables configured
- ✅ Database connections tested (Supabase, Redis, Groq)
- ✅ Route structure exists for users and chat
- ✅ All admin/employee pages scaffolded
- ✅ UI component library (shadcn/ui) integrated
- ✅ Middleware framework in place

**See:** `PHASE_0_VERIFICATION.md` for complete verification report

---

### 📊 Current Implementation Status (Post-Phase 0)

**Backend Status: 40% Complete**
- ✅ Route structure (user, chat)
- ✅ Controller structure 
- ✅ Middleware framework
- ✅ Database schemas
- ❌ JWT token generation/refresh
- ❌ Password hashing
- ❌ RAG query implementation
- ❌ Groq API integration with context

**Frontend Status: 50% Complete**
- ✅ All pages scaffolded (admin + employee)
- ✅ Routing configured
- ✅ UI components library
- ✅ SignIn/SignUp forms (UI only)
- ❌ Auth context/provider
- ❌ Protected route wrapper
- ❌ API service layer
- ❌ Backend integration

**Files Inventory:**
```
Backend:
  /backend/src/features/user/
    ✅ user.route.ts (routes defined)
    ✅ user.controller.ts (structure exists)
    ✅ user.service.ts (basic CRUD)
    ❌ JWT logic (needs implementation)
    
  /backend/src/features/chat/
    ✅ chat.route.ts (routes defined)
    ✅ chat.controller.ts (structure exists)
    ❌ RAG integration (needs implementation)
    
Frontend:
  /frontend/src/pages/
    ✅ SignIn.tsx, SignUp.tsx (UI only)
    ✅ admin/* (4 pages scaffolded)
    ✅ employee/* (4 pages scaffolded)
    ❌ Auth context (NOT FOUND)
    ❌ API services (NOT FOUND)
```

**Next Steps:** → Proceed directly to **Phase 1: Core MVP**

---

### Original Phase 0 Checklist (For Reference)

### Checklist

#### 0.1 Backend Setup

- [ ] **Clone existing backend** (from previous chatbot project)
  ```bash
  # Review existing backend structure
  # Identify reusable components (auth, RAG, embeddings)
  ```

- [ ] **Install dependencies**
  ```bash
  cd backend
  npm install
  # or yarn install
  ```

- [ ] **Set up environment variables** (`.env`)
  ```env
  # Database
  SUPABASE_URL=your_supabase_url
  SUPABASE_KEY=your_supabase_key
  SUPABASE_DB_URL=postgresql://...
  
  # Vector Database
  PINECONE_API_KEY=your_pinecone_key
  PINECONE_ENVIRONMENT=your_env
  PINECONE_INDEX=company-brain
  
  # AI Services
  GROQ_API_KEY=your_groq_key
  HUGGINGFACE_API_KEY=your_hf_key (if needed)
  
  # Redis
  REDIS_URL=redis://localhost:6379
  
  # Auth
  JWT_SECRET=your_secret_key
  JWT_EXPIRES_IN=7d
  
  # App
  PORT=5000
  NODE_ENV=development
  ```

- [ ] **Test database connections**
  - Connect to Supabase PostgreSQL
  - Verify Supabase Storage access
  - Test Pinecone connection
  - Test Redis connection

- [ ] **Review existing code**
  - Document processing pipeline
  - Embedding generation
  - RAG query logic
  - Identify what needs modification

---

#### 0.2 Frontend Setup

- [ ] **Clone/Create React app**
  ```bash
  # If starting fresh
  npm create vite@latest frontend -- --template react
  cd frontend
  npm install
  
  # Install Tailwind CSS
  npm install -D tailwindcss postcss autoprefixer
  npx tailwindcss init -p
  ```

- [ ] **Install key dependencies**
  ```bash
  npm install react-router-dom axios
  # For icons
  npm install lucide-react
  # For markdown rendering (chat responses)
  npm install react-markdown
  ```

- [ ] **Configure Tailwind** (`tailwind.config.js`)
  ```javascript
  export default {
    content: [
      "./index.html",
      "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
      extend: {},
    },
    plugins: [],
  }
  ```

- [ ] **Set up project structure**
  ```
  frontend/
  ├── src/
  │   ├── components/     # Reusable components
  │   ├── pages/          # Page components
  │   ├── contexts/       # React contexts
  │   ├── services/       # API calls
  │   ├── utils/          # Helper functions
  │   ├── App.jsx
  │   └── main.jsx
  ├── public/
  └── index.html
  ```

---

#### 0.3 Database Schema Setup

- [ ] **Create Supabase tables** (run SQL in Supabase dashboard)

**Users Table:**
```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  full_name VARCHAR(255) NOT NULL,
  role VARCHAR(20) CHECK (role IN ('employee', 'admin')),
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'pending')),
  onboarding_completed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW(),
  last_login TIMESTAMP
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
```

**Folders Table:**
```sql
CREATE TABLE folders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  parent_id UUID REFERENCES folders(id) ON DELETE CASCADE,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_folders_parent ON folders(parent_id);
```

**Documents Table:**
```sql
CREATE TABLE documents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  original_name VARCHAR(255) NOT NULL,
  folder_id UUID REFERENCES folders(id) ON DELETE SET NULL,
  file_type VARCHAR(10) CHECK (file_type IN ('pdf', 'docx', 'md', 'txt')),
  file_size INTEGER,
  file_path TEXT NOT NULL,
  uploaded_by UUID REFERENCES users(id),
  upload_date TIMESTAMP DEFAULT NOW(),
  last_updated TIMESTAMP DEFAULT NOW(),
  status VARCHAR(20) DEFAULT 'processing' CHECK (status IN ('processing', 'ready', 'failed')),
  version INTEGER DEFAULT 1,
  chunk_count INTEGER DEFAULT 0,
  metadata JSONB DEFAULT '{}'
);

CREATE INDEX idx_documents_folder ON documents(folder_id);
CREATE INDEX idx_documents_status ON documents(status);
```

**Conversations Table:**
```sql
CREATE TABLE conversations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  title VARCHAR(255),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_conversations_user ON conversations(user_id);
```

**Messages Table:**
```sql
CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE,
  role VARCHAR(20) CHECK (role IN ('user', 'assistant')),
  content TEXT NOT NULL,
  sources JSONB DEFAULT '[]',
  rating VARCHAR(10) CHECK (rating IN ('up', 'down') OR rating IS NULL),
  timestamp TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_messages_conversation ON messages(conversation_id);
CREATE INDEX idx_messages_rating ON messages(rating);
```

- [ ] **Create Supabase Storage buckets**
  - Create bucket: `documents` (private)
  - Set storage policies

- [ ] **Initialize Pinecone index**
  ```bash
  # In Pinecone dashboard:
  # - Create index: company-brain
  # - Dimensions: 384 (for all-MiniLM-L6-v2)
  # - Metric: cosine
  ```

- [ ] **Set up Redis** (local or cloud)
  ```bash
  # Local
  brew install redis  # Mac
  redis-server
  
  # Or use Redis Cloud (free tier)
  ```

---

#### 0.4 Testing Connections

- [ ] **Create test script** (`backend/test-connections.js`)
  ```javascript
  const { createClient } = require('@supabase/supabase-js');
  const { Pinecone } = require('@pinecone-database/pinecone');
  const redis = require('redis');
  
  async function testConnections() {
    // Test Supabase
    const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);
    const { data, error } = await supabase.from('users').select('count');
    console.log('Supabase:', error ? '❌' : '✅');
    
    // Test Pinecone
    const pinecone = new Pinecone({ apiKey: process.env.PINECONE_API_KEY });
    const index = pinecone.index('company-brain');
    console.log('Pinecone:', '✅');
    
    // Test Redis
    const redisClient = redis.createClient({ url: process.env.REDIS_URL });
    await redisClient.connect();
    await redisClient.ping();
    console.log('Redis:', '✅');
    
    process.exit(0);
  }
  
  testConnections();
  ```

- [ ] Run test: `node test-connections.js`

---

### Phase 0 Deliverables

✅ Backend and frontend projects set up  
✅ All services (Supabase, Pinecone, Redis) connected  
✅ Database schema created  
✅ Environment variables configured  
✅ Dependencies installed  
✅ Test connections successful  

---

## Phase 1: Core MVP
**Duration:** 3 weeks (Weeks 2-4)  
**Goal:** Basic authentication and chat interface working

### Week 2: Authentication

#### 1.1 Backend - Auth API

- [ ] **Create auth routes** (`backend/routes/auth.js`)
  ```javascript
  POST /api/auth/register  // For invited users to complete signup
  POST /api/auth/login     // Login
  POST /api/auth/refresh   // Refresh token
  GET  /api/auth/me        // Get current user
  ```

- [ ] **Implement JWT auth middleware** (`backend/middleware/auth.js`)
  ```javascript
  // Verify JWT token
  // Attach user to req.user
  // Handle token expiration
  ```

- [ ] **User registration logic**
  - Validate invitation token
  - Hash password (bcrypt)
  - Create user in database
  - Generate JWT tokens

- [ ] **Login logic**
  - Validate credentials
  - Compare password hash
  - Generate JWT tokens
  - Update last_login

- [ ] **Test with Postman/Insomnia**
  - Register user
  - Login
  - Get current user with token

---

#### 1.2 Frontend - Auth Pages

- [ ] **Create auth context** (`src/contexts/AuthContext.jsx`)
  ```javascript
  // Store user, token
  // Login, logout, register functions
  // Check auth status
  ```

- [ ] **Login page** (`src/pages/Login.jsx`)
  - Email + password form
  - Form validation
  - Error handling
  - Redirect to dashboard on success

- [ ] **Register page** (`src/pages/Register.jsx`)
  - For completing signup via invitation
  - Name, password fields
  - Validate token from URL

- [ ] **Protected route wrapper** (`src/components/ProtectedRoute.jsx`)
  ```javascript
  // Redirect to login if not authenticated
  // Check user role for admin routes
  ```

- [ ] **Test auth flow**
  - Login → Dashboard
  - Logout → Login
  - Protected routes redirect

---

### Week 3: Basic Chat Interface

#### 1.3 Backend - Chat API (Simplified)

- [ ] **Create chat routes** (`backend/routes/chat.js`)
  ```javascript
  GET  /api/chat/conversations              // Get user's conversations
  POST /api/chat/conversations              // Create new conversation
  GET  /api/chat/conversations/:id/messages // Get conversation messages
  POST /api/chat/message                    // Send message, get AI response
  ```

- [ ] **Simple RAG query endpoint** (use existing backend logic)
  ```javascript
  // POST /api/chat/message
  // 1. Save user message
  // 2. Generate embedding for question
  // 3. Query Pinecone (top 5 chunks)
  // 4. Construct prompt with context
  // 5. Call Groq API (via Vercel AI SDK)
  // 6. Save assistant response
  // 7. Return response
  ```

- [ ] **Test RAG endpoint**
  - Upload 1-2 test documents manually (no UI yet)
  - Process them (run processing script)
  - Test query via Postman

---

#### 1.4 Frontend - Chat Interface

- [ ] **Create chat layout** (`src/pages/Chat.jsx`)
  ```
  +----------------------------------+
  | Sidebar    |   Chat Area        |
  | (convos)   |   (messages)       |
  |            |                    |
  |            |   [Input box]      |
  +----------------------------------+
  ```

- [ ] **Conversation list** (`src/components/ConversationList.jsx`)
  - List conversations
  - Create new conversation
  - Select conversation

- [ ] **Message display** (`src/components/MessageList.jsx`)
  - User messages (right aligned)
  - AI messages (left aligned)
  - Loading state
  - Source citations (basic)

- [ ] **Message input** (`src/components/MessageInput.jsx`)
  - Textarea with auto-resize
  - Send button
  - Enter to send
  - Disable while loading

- [ ] **API service** (`src/services/chatService.js`)
  ```javascript
  export const getConversations = async () => {...}
  export const getMessages = async (conversationId) => {...}
  export const sendMessage = async (conversationId, content) => {...}
  ```

- [ ] **Test chat flow**
  - Create conversation
  - Send message
  - Receive AI response
  - Display sources

---

### Week 4: Conversation History & Context

#### 1.5 Backend - Conversation Context

- [ ] **Modify chat endpoint to include context**
  ```javascript
  // When processing query:
  // 1. Get last 5 messages from conversation
  // 2. Include in prompt to Groq
  // 3. Maintain context for follow-up questions
  ```

- [ ] **Add conversation title auto-generation**
  ```javascript
  // After first message, generate title using LLM
  // Update conversation title
  ```

---

#### 1.6 Frontend - History & Context

- [ ] **Resume conversations**
  - Click on old conversation → load messages
  - Scroll to load older messages (pagination)

- [ ] **UI improvements**
  - Conversation titles
  - Timestamps
  - Delete conversation
  - Rename conversation (optional)

- [ ] **Test multi-turn conversations**
  - Ask: "What's our leave policy?"
  - Follow-up: "How do I apply?" (should understand context)

---

### Phase 1 Deliverables

✅ User can register and login  
✅ JWT authentication working  
✅ Basic chat interface functional  
✅ AI responds using RAG (with manually uploaded docs)  
✅ Conversation history saved and resumable  
✅ Multi-turn context working  

### Phase 1 Demo

- Show login/signup
- Show chat interface
- Ask questions and get answers
- Show conversation history

---

## Phase 2: Document Management
**Duration:** 3 weeks (Weeks 5-7)  
**Goal:** Admin can upload and manage documents with full RAG pipeline

### Week 5: Document Upload

#### 2.1 Backend - Upload & Processing

- [ ] **Create document routes** (`backend/routes/documents.js`)
  ```javascript
  POST   /api/documents/upload    // Upload document(s)
  GET    /api/documents           // List all documents
  GET    /api/documents/:id       // Get document details
  DELETE /api/documents/:id       // Delete document
  ```

- [ ] **File upload handler** (use multer)
  ```bash
  npm install multer
  ```
  ```javascript
  // Configure multer for file uploads
  // Validate file type (pdf, docx, md, txt)
  // Validate file size (max 50MB)
  // Upload to Supabase Storage
  // Save metadata to database
  ```

- [ ] **Document processing queue** (Bull)
  ```bash
  npm install bull
  ```
  ```javascript
  // Add job to queue when document uploaded
  // Worker processes documents:
  //   1. Download from Supabase Storage
  //   2. Extract text
  //   3. Chunk text
  //   4. Generate embeddings
  //   5. Store in Pinecone
  //   6. Update status in database
  ```

- [ ] **Text extraction** (review existing backend code)
  - PDF: `pdf-parse`
  - DOCX: `mammoth`
  - MD/TXT: `fs.readFile`

- [ ] **Test document processing**
  - Upload via Postman
  - Check queue job execution
  - Verify embeddings in Pinecone
  - Check database status

---

#### 2.2 Frontend - Upload Interface (Admin Only)

- [ ] **Create admin check** (middleware/component)
  ```javascript
  // Redirect non-admins
  // Or hide admin-only UI
  ```

- [ ] **Documents page** (`src/pages/Documents.jsx`)
  - Document list (table or grid)
  - Upload button
  - Search/filter
  - Folder navigation

- [ ] **Upload component** (`src/components/DocumentUpload.jsx`)
  - Drag-and-drop area
  - File browser
  - Multiple file upload
  - Progress bar
  - Success/error messages

- [ ] **Document list** (`src/components/DocumentList.jsx`)
  - Name, type, size, upload date
  - Status indicator (processing/ready/failed)
  - Actions (view, download, delete)

- [ ] **Test upload flow**
  - Upload PDF
  - Upload DOCX
  - Upload Markdown
  - Check processing status
  - Verify can query uploaded docs

---

### Week 6: Folder Organization

#### 2.3 Backend - Folders

- [ ] **Create folder routes** (`backend/routes/folders.js`)
  ```javascript
  GET    /api/folders           // List all folders
  POST   /api/folders           // Create folder
  PUT    /api/folders/:id       // Rename folder
  DELETE /api/folders/:id       // Delete folder
  ```

- [ ] **Move document to folder**
  ```javascript
  PUT /api/documents/:id/move
  // Update folder_id in database
  ```

---

#### 2.4 Frontend - Folder UI

- [ ] **Folder tree** (`src/components/FolderTree.jsx`)
  - Show folder hierarchy
  - Click to navigate
  - Create new folder
  - Rename/delete folder

- [ ] **Organize documents**
  - Drag document to folder (optional)
  - Or dropdown to select folder
  - Breadcrumb navigation

---

### Week 7: Document Versioning & Deletion

#### 2.5 Backend - Versioning

- [ ] **Handle duplicate document names**
  ```javascript
  // On upload with same name:
  //   1. Increment version number
  //   2. Delete old embeddings from Pinecone
  //   3. Process new version
  //   4. Keep old file in storage (optional)
  ```

- [ ] **Version history endpoint**
  ```javascript
  GET /api/documents/:id/versions
  // Return list of versions
  ```

---

#### 2.6 Backend - Deletion

- [ ] **Delete document**
  ```javascript
  // 1. Delete embeddings from Pinecone
  // 2. Delete file from Supabase Storage
  // 3. Delete/soft-delete from database
  ```

---

#### 2.7 Frontend - Versioning & Deletion

- [ ] **Show version info**
  - Display version number
  - Version history modal (list versions)

- [ ] **Delete confirmation**
  - Modal: "Are you sure?"
  - Delete button

- [ ] **Test complete document lifecycle**
  - Upload → Process → Query → Update → Delete

---

### Phase 2 Deliverables

✅ Admin can upload documents (PDF, DOCX, MD, TXT)  
✅ Documents processed and indexed automatically  
✅ Folder organization working  
✅ Document versioning implemented  
✅ Document deletion working (removes embeddings)  
✅ Employees can query all uploaded documents  

### Phase 2 Demo

- Admin uploads multiple documents
- Show folder organization
- Update a document (new version)
- Employee asks questions about docs
- Delete a document

---

## Phase 3: Analytics & Onboarding
**Duration:** 3 weeks (Weeks 8-10)  
**Goal:** Analytics dashboard and onboarding system

### Week 8: Basic Analytics

#### 3.1 Backend - Analytics Endpoints

- [ ] **Analytics routes** (`backend/routes/analytics.js`)
  ```javascript
  GET /api/analytics/employee/:id   // Employee's own stats
  GET /api/analytics/admin          // Company-wide stats
  GET /api/analytics/questions/top  // Most asked questions
  ```

- [ ] **Calculate metrics**
  ```javascript
  // Total questions (all time, this week, this month)
  // Total conversations
  // Average rating (thumbs up %)
  // Most asked questions
  // Most used documents (from sources)
  ```

- [ ] **Implement message rating**
  ```javascript
  PUT /api/chat/message/:id/rating
  // { rating: 'up' | 'down' }
  ```

---

#### 3.2 Frontend - Analytics Dashboard

- [ ] **Employee analytics** (`src/pages/MyAnalytics.jsx`)
  - Stats cards (questions asked, conversations, rating)
  - Activity chart (simple bar chart)
  - Most used documents

- [ ] **Admin analytics** (`src/pages/AdminAnalytics.jsx`)
  - Overview cards
  - Questions over time (line chart)
  - Top 10 questions (list)
  - Document popularity

- [ ] **Charts component** (simple with CSS/SVG)
  - Or use lightweight library: `recharts` or `chart.js`

- [ ] **Rating buttons** (add to MessageList)
  - 👍 and 👎 buttons on AI messages
  - Highlight when rated
  - Update count on click

---

### Week 9: User Management

#### 3.3 Backend - User Invitation

- [ ] **Invitation endpoints**
  ```javascript
  POST /api/admin/invite           // Send invitation
  GET  /api/admin/invitations      // List pending invitations
  GET  /api/admin/users            // List all users
  ```

- [ ] **Generate invitation token**
  ```javascript
  // Create unique token
  // Save to database (or encode in JWT)
  // Send email (or just return link for now)
  ```

- [ ] **Email service** (optional, or manual for now)
  - Use nodemailer or SendGrid
  - Or just generate link and copy manually

---

#### 3.4 Frontend - User Management

- [ ] **Users page** (`src/pages/Users.jsx` - Admin only)
  - List all users (table)
  - Invite button
  - User status
  - Deactivate user

- [ ] **Invite modal** (`src/components/InviteUserModal.jsx`)
  - Email input
  - Role selection (employee/admin)
  - Send invitation
  - Show invitation link (if no email)

- [ ] **Test invitation flow**
  - Admin invites user
  - New user registers via link
  - Login and access system

---

### Week 10: Onboarding System

#### 3.5 Backend - Onboarding

- [ ] **Onboarding table schema** (add to database)
  ```sql
  CREATE TABLE onboarding_templates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(255),
    sections JSONB,
    created_at TIMESTAMP DEFAULT NOW()
  );
  
  CREATE TABLE onboarding_progress (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id),
    section_index INTEGER,
    completed BOOLEAN DEFAULT FALSE,
    completed_at TIMESTAMP
  );
  ```

- [ ] **Onboarding routes**
  ```javascript
  GET  /api/onboarding/template         // Get template
  PUT  /api/onboarding/template         // Update template (admin)
  GET  /api/onboarding/progress/:userId // Get progress
  POST /api/onboarding/complete         // Mark section complete
  ```

- [ ] **Create default template** (seed data)
  ```json
  {
    "title": "Employee Onboarding",
    "sections": [
      {
        "day": 1,
        "title": "Welcome & Company Overview",
        "description": "Learn about our mission...",
        "documents": [doc_id_1, doc_id_2]
      },
      {
        "day": 2,
        "title": "Policies & Procedures",
        "documents": [doc_id_3, doc_id_4]
      }
    ]
  }
  ```

---

#### 3.6 Frontend - Onboarding Flow

- [ ] **Onboarding page** (`src/pages/Onboarding.jsx`)
  - Progress bar
  - Current section display
  - Document links
  - Embedded chat (reuse chat component)
  - "Mark complete" button
  - "Next" button

- [ ] **Check onboarding status on login**
  ```javascript
  // If user.onboarding_completed === false
  // Redirect to /onboarding
  ```

- [ ] **Admin: Onboarding template editor** (`src/pages/OnboardingEditor.jsx`)
  - Add/edit sections
  - Attach documents
  - Reorder sections
  - Save template

- [ ] **Test onboarding**
  - New user logs in
  - Goes through onboarding
  - Completes all sections
  - Redirected to dashboard

---

### Phase 3 Deliverables

✅ Basic analytics for employees and admins  
✅ Message rating (👍/👎) implemented  
✅ User management and invitations working  
✅ Onboarding system functional  
✅ Admin can create/edit onboarding template  

### Phase 3 Demo

- Show employee analytics
- Show admin analytics with charts
- Invite new user
- Complete onboarding as new employee
- Admin edits onboarding template

---

## Phase 4: Polish & Testing
**Duration:** 2 weeks (Weeks 11-12)  
**Goal:** UI polish, notifications, testing, and deployment

### Week 11: Notifications & UI Polish

#### 4.1 Backend - Notifications

- [ ] **Notifications table**
  ```sql
  CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id),
    type VARCHAR(50),
    message TEXT,
    metadata JSONB,
    read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT NOW()
  );
  ```

- [ ] **Notification routes**
  ```javascript
  GET    /api/notifications        // Get user's notifications
  PUT    /api/notifications/:id    // Mark as read
  DELETE /api/notifications/:id    // Delete notification
  ```

- [ ] **Create notifications on document upload/update**
  ```javascript
  // When admin uploads document:
  // Create notification for all users
  // "New document uploaded: [Doc Name]"
  ```

---

#### 4.2 Frontend - Notifications

- [ ] **Notification bell** (in header)
  - Badge with unread count
  - Dropdown with recent notifications
  - Mark as read
  - Click to navigate (if applicable)

- [ ] **Notification component** (`src/components/NotificationBell.jsx`)

---

#### 4.3 UI/UX Improvements

- [ ] **Responsive design**
  - Test on mobile, tablet, desktop
  - Adjust layouts for small screens
  - Collapsible sidebar on mobile

- [ ] **Loading states**
  - Skeleton loaders
  - Spinners where appropriate
  - Disable buttons during actions

- [ ] **Error handling**
  - Toast notifications for errors
  - Retry buttons
  - Clear error messages

- [ ] **Accessibility**
  - Keyboard navigation
  - ARIA labels
  - Focus indicators

- [ ] **Visual polish**
  - Consistent spacing
  - Nice color scheme
  - Smooth transitions
  - Icons (lucide-react)

---

### Week 12: Testing & Deployment

#### 4.4 Testing

- [ ] **Manual testing checklist**
  - [ ] Register/login as employee
  - [ ] Register/login as admin
  - [ ] Send messages and get responses
  - [ ] Test multi-turn conversations
  - [ ] Upload documents (all formats)
  - [ ] Create folders
  - [ ] Update/delete documents
  - [ ] View analytics
  - [ ] Complete onboarding
  - [ ] Invite users
  - [ ] Test on mobile device
  - [ ] Test with poor network (slow 3G)

- [ ] **Bug fixes**
  - Document all bugs
  - Prioritize critical bugs
  - Fix and retest

- [ ] **Performance testing**
  - Test with 50+ documents
  - Test with long conversations
  - Check response times
  - Optimize if needed

---

#### 4.5 AI Configuration

- [ ] **AI settings page** (`src/pages/AISettings.jsx` - Admin)
  - Model selection dropdown
  - Temperature slider
  - Top K chunks slider
  - Save configuration

- [ ] **Backend: Config storage**
  ```javascript
  // Store in database or config file
  // GET /api/config/ai
  // PUT /api/config/ai
  ```

---

#### 4.6 Documentation

- [ ] **README.md** (project root)
  - Project description
  - Setup instructions
  - Environment variables
  - How to run locally

- [ ] **API documentation** (optional)
  - Postman collection
  - Or Swagger docs

- [ ] **User guide** (optional)
  - How to use the system
  - Screenshots/videos

---

#### 4.7 Deployment (Optional)

- [ ] **Backend deployment**
  - Heroku (free tier)
  - Railway
  - Render
  - Or DigitalOcean

- [ ] **Frontend deployment**
  - Vercel (recommended)
  - Netlify
  - GitHub Pages

- [ ] **Environment setup**
  - Production environment variables
  - Database migrations
  - Test deployment

---

### Phase 4 Deliverables

✅ Notifications working  
✅ UI polished and responsive  
✅ All features tested  
✅ Bugs fixed  
✅ AI configuration page  
✅ Documentation complete  
✅ (Optional) Deployed to production  

### Phase 4 Demo

- Full walkthrough of the system
- Show all features
- Demonstrate smooth UX
- Show mobile experience

---

## Development Best Practices

### Version Control

```bash
# Use Git from day one
git init
git add .
git commit -m "Initial commit"

# Create feature branches
git checkout -b feature/auth
git checkout -b feature/chat
git checkout -b feature/documents

# Commit frequently with clear messages
git commit -m "Add user login functionality"
git commit -m "Fix: Handle empty chat messages"
```

### Code Organization

**Backend:**
```
backend/
├── routes/           # API routes
├── controllers/      # Business logic
├── models/           # Database models
├── middleware/       # Auth, error handling
├── services/         # External services (Groq, Pinecone)
├── utils/            # Helper functions
├── workers/          # Queue workers
├── config/           # Configuration
└── server.js         # Entry point
```

**Frontend:**
```
frontend/
├── components/       # Reusable UI components
├── pages/            # Page components
├── contexts/         # Global state
├── services/         # API calls
├── utils/            # Helpers
├── hooks/            # Custom React hooks
└── App.jsx           # Main app component
```

### Testing Strategy

1. **Manual testing** after each feature
2. **Integration testing** at end of each phase
3. **User testing** with real users (friends/classmates)
4. **Test with different data** (small, medium, large documents)

### Environment Management

```bash
# Never commit .env files
echo ".env" >> .gitignore

# Use .env.example as template
cp .env.example .env
# Then fill in actual values
```

### Error Handling

**Backend:**
```javascript
// Wrap async routes
app.post('/api/chat', async (req, res, next) => {
  try {
    // ... logic
  } catch (error) {
    next(error); // Pass to error handler
  }
});

// Global error handler
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: err.message });
});
```

**Frontend:**
```javascript
// Use try-catch for API calls
try {
  const response = await api.sendMessage(content);
  setMessages([...messages, response]);
} catch (error) {
  showToast('Failed to send message', 'error');
  console.error(error);
}
```

### Performance Tips

1. **Backend:**
   - Cache common queries (Redis)
   - Use database indexes
   - Paginate large lists
   - Process documents asynchronously

2. **Frontend:**
   - Lazy load components
   - Debounce search inputs
   - Virtualize long lists
   - Optimize images

---

## Timeline Summary

| Phase | Duration | Key Deliverables | Cumulative |
|-------|----------|------------------|------------|
| **Phase 0** | Week 1 | Setup complete | Week 1 |
| **Phase 1** | Weeks 2-4 | Auth + Chat working | Week 4 |
| **Phase 2** | Weeks 5-7 | Document management + RAG | Week 7 |
| **Phase 3** | Weeks 8-10 | Analytics + Onboarding | Week 10 |
| **Phase 4** | Weeks 11-12 | Polish + Testing | Week 12 |

### Minimum Viable Version

If short on time, focus on:
- ✅ Phase 0 (Setup)
- ✅ Phase 1 (Auth + Chat)
- ✅ Phase 2 (Documents + RAG)
- ✅ Basic analytics from Phase 3
- ✅ Basic testing from Phase 4

This gives you a **working RAG chatbot** in ~7-8 weeks.

### Full Version

Include all phases for a **complete, polished product** in 12 weeks.

---

## Weekly Progress Checkpoints

**Week 1:** Can connect to all services (Supabase, Pinecone, Redis)  
**Week 2:** Can login and see dashboard  
**Week 3:** Can ask questions and get AI responses  
**Week 4:** Multi-turn conversations work  
**Week 5:** Can upload and process documents  
**Week 6:** Folder organization works  
**Week 7:** Full document lifecycle (upload, update, delete)  
**Week 8:** Analytics dashboard showing data  
**Week 9:** User management and invitations work  
**Week 10:** Onboarding system complete  
**Week 11:** Notifications working, UI polished  
**Week 12:** All bugs fixed, ready to demo  

---

## Success Criteria

At the end of implementation, you should be able to:

1. ✅ **Login** as employee and admin
2. ✅ **Upload** company documents (admin)
3. ✅ **Ask questions** and get accurate answers with sources
4. ✅ **Have multi-turn conversations** with context
5. ✅ **View conversation history** and resume
6. ✅ **Organize documents** in folders
7. ✅ **View analytics** (personal and company-wide)
8. ✅ **Invite new users** (admin)
9. ✅ **Complete onboarding** (new users)
10. ✅ **Rate answers** (👍/👎)
11. ✅ **Receive notifications** for document updates
12. ✅ **Use on mobile** (responsive design)

---

## Tips for Success

1. **Start simple, iterate:** Don't try to build everything at once
2. **Test frequently:** Test after each feature
3. **Use existing code:** Leverage your existing chatbot backend
4. **Ask for help:** Use documentation, ChatGPT, Stack Overflow
5. **Track progress:** Check off items as you complete them
6. **Take breaks:** Avoid burnout, pace yourself
7. **Demo early:** Show progress to friends/advisors
8. **Document as you go:** Write README and comments
9. **Save often:** Commit to Git frequently
10. **Have fun!** This is a learning opportunity

---

## Resources

### Documentation
- [React Docs](https://react.dev)
- [Tailwind CSS](https://tailwindcss.com)
- [Supabase Docs](https://supabase.com/docs)
- [Pinecone Docs](https://docs.pinecone.io)
- [Groq API Docs](https://console.groq.com/docs)
- [Vercel AI SDK](https://sdk.vercel.ai)

### Tools
- [Postman](https://www.postman.com) - API testing
- [TablePlus](https://tableplus.com) - Database GUI
- [Excalidraw](https://excalidraw.com) - Diagrams

---

**Good luck with your implementation! 🚀**
