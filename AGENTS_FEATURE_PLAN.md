# Admin Dashboard - Agents Feature (Backend Implementation Plan)

## Project Context

### Current Backend Architecture Analysis

**Existing Tables:**
- `documents` - Has schema but **NO API/Controller** (currently unused)
- `sources` - Links to agents (`agent_id` FK), has types: file, text, website, database, qa
- `file_sources` - Join table for file-based sources (`source_id` FK → `sources.id`)
- `agents` - Agent configuration (provider, model, temperature, system_prompt, api_key)
- `provider_models` - Seeded with available models (currently only Groq models)

**Current Flow (Agent-First):**
1. User creates agent → stored in `agents` table
2. User uploads files → creates `sources` entry (linked to `agent_id`) + `file_sources` entry
3. User clicks "Train" → Training service processes all `sources` for that agent
4. Vectors are embedded in Pinecone with namespace `user_{userId}_agent_{agentId}`

---

## New Requirements (Knowledge-Base-First)

### Desired Flow:
1. **Knowledge Base (Independent)**: Admin uploads documents → stored globally (not agent-specific)
2. **Agent Creation**: Admin creates agent, selects documents from Knowledge Base
3. **Training**: Selected documents are linked to agent, then training begins
4. **Playground**: Admin tests agent with configurable settings

---

## Finalized Design Decisions ✅

### Decision 1: Document Storage Architecture
**APPROVED: Option C** - Keep both `documents` and `sources` tables
- `documents` = Global Knowledge Base (independent)
- `sources` = Agent-specific training instances
- Link via `document_id` column in `sources` table
- Benefits: Clean separation, different training states per agent, minimal refactoring

### Decision 2: Document Selection & Training
**APPROVED: Option B** - Replace/Sync approach
- Selected documents in UI = complete training dataset
- When admin clicks "Train" with document selection, it syncs the full set
- Cleaner UX, no confusion about "what's currently trained"

### Decision 3: API Key Management  
**APPROVED: Option A** - Per-agent API keys (current implementation)
- Each agent stores its own encrypted API key
- User inputs API key during agent creation
- Flexibility for different providers per agent

### Decision 4: Document Upload in Knowledge Base
**APPROVED: Option C** - Metadata only, extraction during training
- Upload stores file + metadata in `documents` table
- Text extraction happens when document is linked to agent and trained
- Reuses existing `source-extractor.service.ts` logic


---

## Proposed Backend Implementation Plan

### Phase 1: Knowledge Base API Layer

#### 1.1 Create Document Management API
**New Files:**
- `backend/src/features/documents/document.controller.ts`
- `backend/src/features/documents/document.route.ts`
- `backend/src/features/documents/document.dto.ts`
- `backend/src/features/documents/services/document.service.ts`

**API Endpoints:**
```typescript
POST   /documents/upload          - Upload document to Knowledge Base
GET    /documents                 - List all documents (with pagination, filters)
GET    /documents/:id             - Get single document details
DELETE /documents/:id             - Delete document
PUT    /documents/:id             - Update document metadata
```

**Document Upload Flow:**
1. Multer receives file
2. Store file in S3 or local storage
3. Create entry in `documents` table with metadata
4. Return document record

#### 1.2 Modify `documents` Schema (if needed)
**Current fields** (from schema):
- `id`, `name`, `original_name`, `folder_id`, `file_type`, `file_size`, `file_path`
- `uploaded_by`, `upload_date`, `last_updated`, `status`, `version`, `chunk_count`
- `tags`, `metadata`, `created_at`, `updated_at`

**Proposed changes**: None needed - schema is already comprehensive!

---

### Phase 2: Link Documents to Agents

#### 2.1 Modify `sources` Schema
**Add column:**
```sql
ALTER TABLE sources ADD COLUMN document_id INTEGER NULL REFERENCES documents(id) ON DELETE SET NULL;
```

**Why nullable?**: Existing sources (text, website, qa, database types) don't link to documents.

#### 2.2 Create Agent-Document Linking Service
**New File:** `backend/src/features/agent/services/agent-document-link.service.ts`

**Key Function:**
```typescript
async syncDocumentsToAgent(agentId: number, documentIds: number[], userId: number) {
  // 1. Validate agent ownership
  // 2. Validate all documentIds exist
  // 3. Get existing sources for this agent where document_id IS NOT NULL
  // 4. Determine which to add, which to remove
  //    - Add: create SOURCE + FILE_SOURCE entries
  //    - Remove: soft-delete SOURCE entries
  // 5. Return updated source list
}
```

---

### Phase 3: Modify Training API

#### 3.1 Update `TrainAgentDto`
```typescript
// backend/src/features/train/agent-training.dto.ts
export class TrainAgentDto {
  @IsArray()
  @IsOptional()
  @IsInt({ each: true })
  documentIds?: number[];  // NEW: Document IDs to train on

  @IsBoolean()
  @IsOptional()
  forceRetrain?: boolean;

  @IsBoolean()
  @IsOptional()
  cleanupExisting?: boolean;
}
```

#### 3.2 Update `POST /agents/:agentId/train`
**Modified Flow:**
```typescript
async trainAgent(req: RequestWithUser, res: Response) {
  const { documentIds, forceRetrain, cleanupExisting } = req.body;
  
  // NEW: If documentIds provided, sync them first
  if (documentIds && documentIds.length > 0) {
    await agentDocumentLinkService.syncDocumentsToAgent(
      agentId, 
      documentIds, 
      userId
    );
  }
  
  // EXISTING: Proceed with training
  const result = await trainingService.trainAgent(agentId, userId);
  // ... rest of existing logic
}
```

---

### Phase 4: Playground Settings API

#### 4.1 Playground Chat Endpoint
**New or Modify:** `POST /agents/:agentId/chat`

**Request Body:**
```typescript
{
  message: string;
  chatHistory?: Array<{role: string, content: string}>;
  
  // Ephemeral overrides (for testing)
  overrides?: {
    temperature?: number;
    systemPrompt?: string;
    provider?: string;
    model?: string;
  }
}
```

**Response:** Stream chat response using existing chat logic

#### 4.2 Provider Models API
**Existing:** `provider_models` table is seeded
**Need:** API to fetch available models

**New Endpoint:**
```typescript
GET /provider-models             - List all available models
GET /provider-models/:provider   - List models for specific provider
```

---

## Database Migration Strategy

### Migration 1: Add `document_id` to `sources`
```sql
ALTER TABLE sources 
ADD COLUMN document_id INTEGER NULL 
REFERENCES documents(id) ON DELETE SET NULL;

CREATE INDEX idx_sources_document_id ON sources(document_id);
```

### Migration 2: Add indexes for performance
```sql
CREATE INDEX idx_documents_uploaded_by ON documents(uploaded_by);
CREATE INDEX idx_documents_status ON documents(status);
```

---

## Implementation Checklist

### Phase 1: Knowledge Base ✅ COMPLETED
- [x] Create `DocumentController` with CRUD operations
- [x] Create `DocumentService` with file upload logic
- [x] Create `DocumentRoute` and register in app
- [x] Create `DocumentDto` for validation
- [ ] Test upload, list, delete flows

**Status**: All code implemented and registered in server.ts. APIs ready for testing.

### Phase 2: Agent-Document Linking ✅ COMPLETED
- [x] Run migration to add `document_id` to `sources`
- [x] Create `AgentDocumentLinkService`
- [x] Implement `syncDocumentsToAgent` logic
- [ ] Add tests for linking/unlinking

**Status**: Migration executed successfully. Service created with Replace/Sync logic as approved.

### Phase 3: Training Integration ✅ COMPLETED
- [x] Update `TrainAgentDto` to accept `documentIds`
- [x] Modify `trainAgent` controller to call sync before training
- [x] Implement document sync logic before training execution
- [ ] Test end-to-end: upload doc → link to agent → train
- [ ] Verify vectors are created correctly

**Status**: Documents can now be synced to agents before training via `documentIds` parameter. Controller properly extracts `documentIds` and calls `syncDocumentsToAgent` before initiating training process.

### Phase 4: Playground & Models ✅ COMPLETED
- [x] Create `ProviderModelController` and `ProviderModelService` 
- [x] Create `GET /provider-models` endpoints
- [x] Chat endpoint exists: `/chat/agents/:agentId`
- [x] Add ephemeral settings overrides to `AgentChatDto`
- [ ] Test playground chat with different settings

**Status**: 
- ✅ Provider Models API fully implemented with GET endpoints
- ✅ Chat endpoint exists for agent interaction
- ✅ **NEW**: `AgentChatDto` now supports optional `overrides` field for ephemeral testing (temperature, systemPrompt, provider, model)
  - Frontend can now implement playground settings without creating temporary agents
  - Overrides are optional and only apply to the current chat request

---

## Remaining Questions (Lower Priority)

> [!NOTE]
> These can be addressed during implementation or in future iterations:

1. **Folder Support**: The `documents` table has `folder_id`. Should we implement folder/category organization in KB?
   - **Suggestion**: Implement basic folder CRUD in Phase 1, but folders are optional (nullable)

2. **Document Sharing**: Should documents in KB be:
   - **Global** (all admins see same KB) ← **Recommended**
   - **Per-Admin** (each admin has their own KB)
   - **Current assumption**: Global KB for all admins

3. **Source Types**: Current `sources` supports 5 types (file, text, website, database, qa). Should Knowledge Base only handle files?
   - **Current assumption**: KB only handles files (type='file'). Other source types remain agent-specific for now.

4. **Training Scope**: When admin selects documents and clicks "Train", should it:
   - **Fully retrain** (delete existing vectors, re-embed everything) ← **Current behavior**
   - **Incremental** (only embed new/changed documents)
   - **Current assumption**: Use existing retrain logic (full retrain)


## Current Status & Next Steps

### ✅ Completed (Phases 1 & 2)

**Phase 1 - Knowledge Base API:**
- ✅ `DocumentController`, `DocumentService`, `DocumentRoute`, `DocumentDto` created
- ✅ Endpoints: POST /documents/upload, GET /documents, GET /documents/:id, PUT /documents/:id, DELETE /documents/:id
- ✅ Registered in server.ts
- ✅ Safety check: prevents deleting documents linked to agents

**Phase 2 - Agent-Document Linking:**
- ✅ Migration executed: `document_id` column added to `sources` table with index
- ✅ `AgentDocumentLinkService` created with `syncDocumentsToAgent` method
- ✅ Implements Replace/Sync approach (selected docs = complete training set)
- ✅ Automatically creates `sources` + `file_sources` entries for selected documents

---

### 🎯 Next: Phase 3 - Training Integration

**What needs to be done:**
1. Update `TrainAgentDto` to accept optional `documentIds[]` parameter
2. Modify `AgentController.trainAgent` to:
   - Check if `documentIds` are provided
   - If yes, call `agentDocumentLinkService.syncDocumentsToAgent()` first
   - Then proceed with existing training logic
3. Test end-to-end flow:
   - Upload document to KB
   - Link document to agent
   - Trigger training
   - Verify vectors created in Pinecone

**After Phase 3:**
- Phase 4: Provider Models API & Playground Chat endpoint
- Frontend implementation (all 3 tabs)
