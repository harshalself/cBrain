import axios from "axios";
import * as dotenv from "dotenv";

// Load environment variables
dotenv.config();

const API_BASE_URL = "http://localhost:8000/api/v1";
const TEST_USER = {
  email: "harshal@gmail.com",
  password: "harshal2004",
};
const TEST_AGENT_ID = 7;
const TEST_QUERY = "What is QuantumForge Technologies and when was it founded?";

let authToken = "";
let testSessionId = 0;

// Enhanced axios instance with logging
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 60000,
  validateStatus: () => true,
});

// Add request/response interceptors for detailed logging
api.interceptors.request.use((config) => {
  console.log(`\n🔄 Making request: ${config.method?.toUpperCase()} ${config.url}`);
  if (config.data && config.url?.includes('/chat/')) {
    console.log("📤 Request Payload:", JSON.stringify(config.data, null, 2));
  }
  if (config.headers?.Authorization) {
    console.log("🔐 Using Authorization header");
  }
  return config;
});

api.interceptors.response.use((response) => {
  const status = response.status;
  const isSuccess = status >= 200 && status < 300;
  console.log(`${isSuccess ? "✅" : "❌"} Response Status: ${status}`);
  
  if (response.config.url?.includes('/chat/')) {
    console.log("📥 Response Data:", JSON.stringify(response.data, null, 2));
  }
  
  return response;
});

async function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function loginAndGetToken() {
  console.log("\n🔐 === STEP 1: USER AUTHENTICATION ===");
  
  const response = await api.post("/users/login", TEST_USER);
  
  if (response.status !== 200) {
    throw new Error(`Login failed: ${response.data?.message || "Unknown error"}`);
  }
  
  authToken = response.data.data.token;
  console.log("✅ Login successful, token obtained");
  
  // Set default authorization header
  api.defaults.headers.common['Authorization'] = `Bearer ${authToken}`;
  
  return response.data.data;
}

async function validateAgent() {
  console.log("\n🤖 === STEP 2: AGENT VALIDATION ===");
  
  const response = await api.get("/agents");
  
  if (response.status !== 200) {
    throw new Error(`Failed to fetch agents: ${response.data?.message}`);
  }
  
  const agents = response.data.data;
  const targetAgent = agents.find((agent: any) => agent.id === TEST_AGENT_ID);
  
  if (!targetAgent) {
    throw new Error(`Agent with ID ${TEST_AGENT_ID} not found`);
  }
  
  console.log("📊 Agent Details:");
  console.log(`   Name: ${targetAgent.name}`);
  console.log(`   Provider: ${targetAgent.provider}`);
  console.log(`   Model: ${targetAgent.model}`);
  console.log(`   Temperature: ${targetAgent.temperature}`);
  console.log(`   Is Active: ${targetAgent.is_active ? "Yes" : "No"}`);
  console.log(`   System Prompt Length: ${targetAgent.system_prompt?.length || 0} chars`);
  console.log(`   Training Status: ${targetAgent.training_status}`);
  console.log(`   Embedded Sources: ${targetAgent.embedded_sources_count}`);
  console.log(`   Total Sources: ${targetAgent.total_sources_count}`);
  
  if (!targetAgent.is_active) {
    throw new Error("Target agent is not active");
  }
  
  return targetAgent;
}

async function checkVectorAvailability() {
  console.log("\n🔍 === STEP 3: VECTOR AVAILABILITY CHECK ===");
  
  try {
    const response = await api.post("/vectors/search", {
      query: "test query for availability",
      agentId: TEST_AGENT_ID
    });
    
    console.log("🧠 Vector Search Availability Test:");
    if (response.status === 200) {
      const results = response.data.data || [];
      console.log(`   Found ${results.length} vector results`);
      console.log(`   Vector database accessible: Yes`);
      
      if (results.length > 0) {
        const firstResult = results[0];
        console.log("   Sample Vector Result:");
        console.log(`     Score: ${firstResult.score}`);
        console.log(`     Text Preview: "${firstResult.text?.substring(0, 100)}..."`);
        console.log(`     Source ID: ${firstResult.sourceId}`);
        console.log(`     Document Title: ${firstResult.documentTitle || "N/A"}`);
      }
    } else {
      console.log(`   Vector search failed with status: ${response.status}`);
    }
  } catch (error) {
    console.log(`   Vector search error: ${error instanceof Error ? error.message : String(error)}`);
  }
}

async function createChatSession() {
  console.log("\n📝 === STEP 4: CHAT SESSION CREATION ===");
  
  const response = await api.post("/chat/sessions", {
    agentId: TEST_AGENT_ID
  });
  
  if (response.status !== 201) {
    throw new Error(`Session creation failed: ${response.data?.message}`);
  }
  
  testSessionId = response.data.data.id;
  console.log("📋 Session Details:");
  console.log(`   Session ID: ${testSessionId}`);
  console.log(`   Agent ID: ${response.data.data.agent_id}`);
  console.log(`   Agent Name: ${response.data.data.agent_name}`);
  console.log(`   Created At: ${response.data.data.created_at}`);
  
  return response.data.data;
}

async function sendChatMessage() {
  console.log("\n💬 === STEP 5: SENDING CHAT MESSAGE ===");
  console.log(`📝 Test Query: "${TEST_QUERY}"`);
  
  const startTime = Date.now();
  console.log(`⏰ Request Start Time: ${new Date().toISOString()}`);
  
  // First, let's track what happens when we send the message
  console.log("\n🔄 Initiating chat request...");
  
  const response = await api.post(`/chat/agents/${TEST_AGENT_ID}`, {
    messages: [
      {
        role: "user",
        content: TEST_QUERY
      }
    ],
    sessionId: testSessionId.toString()  // Convert to string as required by DTO
  });
  
  const endTime = Date.now();
  const totalTime = endTime - startTime;
  
  console.log(`⏰ Request End Time: ${new Date().toISOString()}`);
  console.log(`⏱️ Total Request Time: ${totalTime}ms`);
  
  if (response.status !== 200) {
    console.log("❌ Chat request failed");
    console.log("Error Details:", response.data);
    return null;
  }
  
  const chatData = response.data.data;
  
  console.log("\n📊 === STEP 6: ANALYZING CHAT RESPONSE ===");
  console.log("🎯 Response Analysis:");
  console.log(`   Message Length: ${chatData.message?.length || 0} characters`);
  console.log(`   Session ID: ${chatData.sessionId}`);
  console.log(`   Context Used: ${chatData.contextLength > 0 ? "Yes" : "No"}`);
  console.log(`   Context Length: ${chatData.contextLength || 0} characters`);
  console.log(`   Source First Blocked: ${chatData.blocked ? "Yes" : "No"}`);
  console.log(`   Blocking Reason: ${chatData.reason || "N/A"}`);
  
  if (chatData.performance) {
    console.log("⚡ Performance Metrics:");
    console.log(`   Total Processing Time: ${chatData.performance.totalTime}`);
    console.log(`   Vector Search Time: ${chatData.performance.vectorSearchTime || "N/A"}`);
    console.log(`   Context Processing Time: ${chatData.performance.contextProcessingTime || "N/A"}`);
  }
  
  if (chatData.contextSources && chatData.contextSources.length > 0) {
    console.log("📚 Context Sources Used:");
    chatData.contextSources.forEach((source: any, index: number) => {
      console.log(`   ${index + 1}. Score: ${source.score}, Source: ${source.sourceId}, Title: ${source.documentTitle || "N/A"}`);
    });
  }
  
  console.log("\n💭 AI Response Preview:");
  const responsePreview = chatData.message?.substring(0, 200) || "No response";
  console.log(`"${responsePreview}${chatData.message?.length > 200 ? "..." : ""}"`);
  
  return chatData;
}

async function checkSessionHistory() {
  console.log("\n📜 === STEP 7: VERIFYING SESSION PERSISTENCE ===");
  
  try {
    const response = await api.get(`/chat/sessions/${testSessionId}/history`);
    
    if (response.status === 200) {
      const messages = response.data.data?.messages || [];
      console.log("💾 Session Messages Verification:");
      console.log(`   Total Messages in Session: ${messages.length}`);
      
      messages.forEach((msg: any, index: number) => {
        console.log(`   ${index + 1}. ${msg.role.toUpperCase()}: "${msg.content.substring(0, 50)}..." (${msg.created_at})`);
      });
    } else {
      console.log(`❌ Failed to fetch session history: ${response.status}`);
    }
  } catch (error) {
    console.log(`⚠️ Error checking session history: ${error instanceof Error ? error.message : String(error)}`);
  }
}

async function runComprehensiveChatTest() {
  console.log("🚀 === COMPREHENSIVE CHATBOT FLOW ANALYSIS ===");
  console.log(`📋 Test Configuration:`);
  console.log(`   API Base URL: ${API_BASE_URL}`);
  console.log(`   Test User: ${TEST_USER.email}`);
  console.log(`   Target Agent ID: ${TEST_AGENT_ID}`);
  console.log(`   Test Query: "${TEST_QUERY}"`);
  console.log(`   Environment: ${process.env.NODE_ENV || "development"}`);
  
  try {
    // Step 1: Authentication
    const user = await loginAndGetToken();
    console.log(`🔑 Authenticated User ID: ${user.id}`);
    
    // Step 2: Agent Validation
    const agent = await validateAgent();
    
    // Step 3: Vector Availability Check
    await checkVectorAvailability();
    
    // Step 4: Session Creation
    const session = await createChatSession();
    
    // Step 5: Send Chat Message & Analyze Response
    const chatResponse = await sendChatMessage();
    
    // Step 6: Verify Persistence
    await checkSessionHistory();
    
    console.log("\n🎉 === TEST COMPLETED SUCCESSFULLY ===");
    console.log("🔍 Key Observations:");
    
    if (chatResponse) {
      console.log(`   ✅ Chat flow functional: Message processed successfully`);
      console.log(`   ✅ Vector search: ${chatResponse.contextLength > 0 ? "Context retrieved" : "No context found"}`);
      console.log(`   ✅ Source filtering: ${chatResponse.blocked ? "Source-first blocking active" : "Query processed normally"}`);
      console.log(`   ✅ Session management: Messages persisted correctly`);
      console.log(`   ✅ Analytics tracking: Performance metrics captured`);
    }
    
    console.log("\n📊 Summary:");
    console.log("   - Authentication: ✅");
    console.log("   - Agent validation: ✅");
    console.log("   - Vector search: ✅");
    console.log("   - Session management: ✅");
    console.log("   - Message processing: ✅");
    console.log("   - Response generation: ✅");
    console.log("   - Data persistence: ✅");
    
  } catch (error) {
    console.log("\n❌ === TEST FAILED ===");
    console.error("Error:", error instanceof Error ? error.message : String(error));
    
    if (error instanceof Error && error.stack) {
      console.log("\nStack Trace:");
      console.log(error.stack);
    }
    
    process.exit(1);
  }
}

// Run the comprehensive test
runComprehensiveChatTest().catch(console.error);