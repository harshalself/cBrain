# Questions

🎯 Product Strategy & Scope
Primary Use Case: Is the main focus internal company knowledge OR are you planning to offer this as a SaaS product to other companies eventually?
Company Size: What's your target company size? (Startups with 10-50 employees? 50-200? 200+?)
MVP Scope: For the MVP, which of these features are absolutely critical?
✅ Chat interface with RAG
✅ Document upload
❓ Onboarding coach (is this Phase 1 or later?)
❓ Analytics dashboard (basic or advanced?)
❓ External integrations (Notion, GitHub, etc. - MVP or later?)
Differentiation: What makes Siemens different from existing tools like Notion AI, Confluence AI, or Slite? What's your unique selling point?
👥 User Roles & Permissions
Employee Role: What exactly can employees do?
Ask questions ✓
Upload documents? (or only admins?)
Edit/update documents?
Flag incorrect answers ✓
See analytics about their own usage?
Admin Role: Beyond managing documents, what else can admins do?
Manage users (add/remove employees)?
Configure AI settings (model, temperature)?
Set up integrations?
View all analytics ✓
Create onboarding plans?
Department/Team Concept: Even with just 2 roles, do you want to organize users by teams/departments for:
Department-specific knowledge bases?
Team-level analytics?
Restricting certain documents to specific teams?
💬 Chat & AI Features
Conversation Context: How should the chat work?
Each question independent OR maintain conversation context?
Should employees be able to see their chat history?
Can employees resume previous conversations?
Multi-turn Conversations: If someone asks "What's our leave policy?" then follows up with "How do I apply?", should the AI understand "apply" refers to leave?
Response Formatting: How should AI responses look?
Plain text with source links?
Formatted with bullet points, tables, code blocks?
Show confidence score ("I'm 85% confident...")?
Show multiple sources or just the best match?
No Answer Scenario: What happens when AI can't find an answer?
Say "I don't know" and suggest contacting admin?
Suggest related topics?
Allow employees to flag as "missing documentation"?
📚 Document Management
Document Types: What document formats are essential for MVP?
PDF ✓
DOCX ✓
Markdown ✓
TXT ✓
Excel/CSV?
PowerPoint?
Images (OCR)?
Videos (transcription)?
Document Organization: How should documents be organized?
Flat list?
Folders/categories?
Tags only?
Both folders and tags?
Document Metadata: What metadata is important?
Department/Team
Category (HR, Engineering, Finance, etc.)
Tags
Author
Last updated date
Version number
Document Updates: When a document is updated:
Automatically re-process and update embeddings?
Keep version history?
Notify affected users?
Document Access Control: Should some documents be:
Public (all employees can access)?
Team-specific (only certain teams)?
Role-specific (admin-only)?
🎓 Onboarding System
Onboarding Priority: Is the AI Onboarding Coach a must-have for MVP or can it come later?
Onboarding Approach: If it's in MVP, how automated should it be?
Fully automated (AI generates everything)?
Template-based (admin creates templates, new hires follow)?
Hybrid (templates + AI assistance)?
Onboarding Content: What should onboarding include?
Reading materials/documents
Interactive Q&A with the AI
Quizzes/assessments
Tasks/checklists
Video content
Role-Based Onboarding: Should different roles (Engineer, Designer, Sales) have different onboarding plans?
📊 Analytics & Insights
Admin Analytics: What analytics are critical for admins?
Usage stats (DAU, questions asked) ✓
Top questions ✓
Unanswered/low-confidence questions ✓
Document popularity
Employee engagement scores
Knowledge gap detection ✓
Employee Analytics: Should employees see any analytics about themselves?
Their own questions asked?
Learning progress (if onboarding exists)?
Most used documents?
Knowledge Health: Is "knowledge gap detection" and "outdated document detection" essential for MVP?
🔗 External Integrations
Integration Priority: Which integrations are critical vs. nice-to-have?
Notion: MVP or Phase 2?
GitHub: MVP or Phase 2?
Google Drive: MVP or Phase 2?
Slack: (for notifications) MVP or later?
Integration Depth: For integrations like Notion:
One-time import OR real-time sync?
One-way (import only) OR two-way sync?
Which Notion content (pages, databases, both)?
🏗️ Technical Architecture
Groq Cloud: Which Groq models are you planning to use?
llama3-70b for better quality?
mixtral-8x7b for faster responses?
Different models for different tasks?
Embedding Model: What will generate embeddings for documents?
Groq's embedding model?
OpenAI embeddings (separate service)?
Open-source model (sentence-transformers)?
Supabase Setup: For Supabase:
Using Supabase PostgreSQL for relational data ✓
Using Supabase Storage (S3-compatible) for files ✓
Using Supabase Auth for authentication?
Using Supabase Realtime for any live features?
Document Processing: What's the flow for a newly uploaded document?
Upload to Supabase Storage ✓
Add job to queue (Redis-based?) ✓
Extract text
Chunk text
Generate embeddings (via Groq or separate service?)
Store in Pinecone ✓
Store metadata in Supabase PostgreSQL ✓
RAG Implementation: For RAG:
Use LangChain for orchestration?
Custom RAG pipeline?
What chunk size (512 tokens, 1024 tokens)?
How many chunks to retrieve (top 3, 5, 10)?
Re-ranking chunks before sending to LLM?
Caching Strategy: What should Redis cache?
Common question-answer pairs ✓
User sessions
Document metadata
Embeddings (or only in Pinecone)?
Queue System: What's the queue for?
"Training" = document processing?
Async jobs like embedding generation?
Using Bull.js, BullMQ, or another library?
🔐 Authentication & Security
Authentication: How do users log in?
Supabase Auth (email/password)?
SSO/OAuth (Google, Microsoft)?
Magic links?
User Invitation: How do new employees get access?
Admin sends invitations?
Self-signup with company email domain?
Admin creates accounts manually?
Data Security: Any specific security requirements?
Role-based document access?
Audit logs for admin actions?
Data encryption (already handled by Supabase)?
📱 User Interface & Experience
Design System: Are you using a component library?
Material UI?
Ant Design?
Chakra UI?
Custom components with Tailwind?
Mobile Experience: Is mobile support required for MVP?
Mobile-responsive web app ✓
Native mobile app (future)?
Admin Panel: Should admin panel be:
Same app as employee portal (with different views)?
Completely separate web app?
User Flow: When an employee logs in, what do they see?
Direct to chat interface?
Dashboard showing recent questions + chat?
Onboarding flow (if new user)?
🎯 Success Metrics & Goals
Primary Goal: What's the #1 metric that defines success?
Number of questions answered per day?
Employee satisfaction score?
Reduction in time to find information?
Reduction in support tickets to HR/IT?
Adoption Target: What's a successful adoption rate?
50% of employees using weekly?
80% using monthly?
Quality Metrics: How will you measure answer quality?
User thumbs up/down on answers?
Flag incorrect answers?
Follow-up question rate (if they ask again, answer wasn't good)?
🚀 Launch & Rollout
Pilot Approach: How will you launch?
Internal company first (dogfooding)?
Pilot with one department?
Full company launch?
Timeline Pressure: Do you have a deadline/target launch date?
Need MVP in 2 months? 3 months?
Or flexible timeline?
Budget Constraints: Any budget limits for:
Groq API costs (based on usage)?
Pinecone (vector storage costs)?
Supabase (storage and bandwidth)?
🔄 Edge Cases & Special Scenarios
Document Conflicts: What if a document is updated with conflicting information?
Always use latest version?
Show both versions with dates?
Multilingual Support: Do you need to support:
Multiple languages for documents?
Multiple languages for chat interface?
Or English only for now?
Large Documents: How to handle very large documents?
Technical manuals (100+ pages)?
Maximum file size limits?
Personal Data: What if documents contain PII (personally identifiable information)?
Special handling?
Redaction?
Or not a concern for internal use?
Offline Access: Any need for offline capabilities?
Or always assume internet connection?
🎨 User Experience Questions
Bookmark/Favorites: Should employees be able to:
Bookmark useful answers?
Create personal notes?
Share answers with colleagues?
Feedback Loop: How should employees provide feedback?
Thumbs up/down on answers?
"Report incorrect" button?
Suggest improvements?
Request new documentation?
Notifications: Should users get notifications for:
New documents added?
Documents they use frequently being updated?
Admin announcements?

# Answers

1.  for now this is a college project so focus as a internal company tool only
2. consider startups
3. keep basic analytics dashboard and a onboarding coach if possible , no need of external integrations yet
4. there is no usp i guess, its just a college project
5. employee will not upload or update documents , yes they will see their analytics and can flag correct and incorrect answers
6. Manage users (add/remove employees)
Configure AI settings (model, temperature)
View all analytics ✓
Create onboarding plans
admin can do all these above
7. no deppartment specific for now we will consider a team of 10 and whole as 1 team
8. yes it should maintain conversation context
yes employee can see chat history
yes they can resume previous conversations
9. yes it should understand what apply refers to
10. yes the answer be formatted accoridng to question asked  and no need of confidence score
11. tell to contact admin and able to flag as missing document
12. PDF ✓
DOCX ✓
Markdown ✓
TXT ✓
use these formats only for now
13. folders 
14. yes lets keep as much meta data as possible
15. dont notify only do this Automatically re-process and update embeddings
Keep version history
16. yes all can access all documents for now
17. if its easy to build then do it
18. hybrid 
19. Reading materials/documents
Interactive Q&A with the AI 
20. no , we only have 1 role right now so only 1 onboarding process
21. show analytics which are easy to make 
22. yes empployees can see their analytics
23. no thats not essential
24. no integrations for now 
25. no need of external integrations for now
26. admin can select from different models
27. we are using hugging face model of embedding , that we already have in our backend , i think its all mini somthing
28. Using Supabase PostgreSQL for relational data ✓
Using Supabase Storage (S3-compatible) for files ✓
only use this of supabase , we dont need realtime right now 
and for supabase also we are not using supabase direct services, we are externally using its database and storage
29. this process you can find in backend(one thing to note about backned , its a existing backend od my previous chatbot project so there can be many chanegs in that)
30. we use vercek ai sdk and all those configs are alredy in backend
31. caching is also in backend , do cache what all is required for best response
32. yes queue is for training
33. we have our own jwt based auth
34. we will send invitation from admin side and admin will invite employees
35. we are not using any encryption for now, and no audit logs required for now
36. mobile responsive web app , and we already have frontend in react and tailwindcss
37. yes mobile responsive
38. yes same app, and 2 logins according to role
39. if new user then onboarding process and then dashboard if old user
40. yes number of quesitons answered correctly 
41. no idea about this
42. yes thumbs up and thumbs down to flag correct and incorrect answers, dont track follow up quesiton if its difficult
43. firstly only build MVP and no launch
44. no deadline
45. no budget , current everything is free and we will use that 
46. we will do one thing, everytime new document is uploaded , we will remove earlier embeddings and reprocess and update embeddings so that we have new info always
47. no i dont want multilanguage support for now
48. normal fle size limits for now 
49. dont worry about that , we are just making a collee project
50. no offline access
51. no bookmark or favouraite
52. yes only implement thumbs up and down and nothing more advanced
53. only normal notificaiton of when admin updates a doc or uploads a doc then all will get notificationof that and no other notificaiton required

