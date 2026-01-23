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
const QUANTUMFORGE_QUESTION = "What is QuantumForge Technologies and when was it founded?";

let authToken = "";

// Enhanced axios instance for detailed logging
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 60000,
  validateStatus: () => true,
});

// Enhanced logging with detailed step analysis
function logStep(step: string, details: string) {
  console.log(`\n${step}`);
  console.log(`${details}`);
}

function logSubStep(substep: string, data?: any) {
  console.log(`   ${substep}`);
  if (data) {
    console.log(`   ${JSON.stringify(data, null, 4)}`);
  }
}

async function analyzeCompleteBackendFlow() {
  console.log("🔬 === DETAILED BACKEND FLOW ANALYSIS ===");
  console.log("📋 Tracing every step from user query to AI response\n");
  
  // Variables to store data across steps
  let vectorResults: any[] = [];
  let chatData: any = null;
  let totalRequestTime = 0;
  
  try {
    // STEP 1: Authentication and setup
    logStep("🔐 STEP 1: AUTHENTICATION FLOW", "Understanding how user authentication works");
    
    const loginResponse = await api.post("/users/login", TEST_USER);
    if (loginResponse.status !== 200) {
      throw new Error(`Login failed: ${loginResponse.data?.message}`);
    }
    
    authToken = loginResponse.data.data.token;
    api.defaults.headers.common['Authorization'] = `Bearer ${authToken}`;
    
    logSubStep("✅ JWT Token obtained and set for subsequent requests");
    logSubStep("🔑 User ID from token", { userId: loginResponse.data.data.id });
    
    // STEP 2: Agent lookup and validation
    logStep("🤖 STEP 2: AGENT LOOKUP & VALIDATION", "How the system validates and loads agent configuration");
    
    const agentsResponse = await api.get("/agents");
    const agents = agentsResponse.data.data;
    const targetAgent = agents.find((agent: any) => agent.id === TEST_AGENT_ID);
    
    logSubStep("📋 Agent Configuration Loaded:");
    logSubStep("   - Agent Name", targetAgent.name);
    logSubStep("   - Provider/Model", `${targetAgent.provider}/${targetAgent.model}`);
    logSubStep("   - System Prompt Length", `${targetAgent.system_prompt?.length || 0} characters`);
    logSubStep("   - Temperature Setting", targetAgent.temperature);
    logSubStep("   - Active Status", targetAgent.is_active ? "Active" : "Inactive");
    logSubStep("   - Training Status", targetAgent.training_status);
    logSubStep("   - Embedded Sources Count", targetAgent.embedded_sources_count);
    
    // STEP 3: Enhanced Vector database analysis with detailed logging
    logStep("🧠 STEP 3: VECTOR DATABASE ANALYSIS", "Checking available knowledge base and vector embeddings");
    
    const vectorTestResponse = await api.post("/vectors/search", {
      query: QUANTUMFORGE_QUESTION,
      agentId: TEST_AGENT_ID
    });
    
    if (vectorTestResponse.status === 200) {
      vectorResults = vectorTestResponse.data.data || [];
      logSubStep("📊 Vector Search Results:");
      logSubStep("   - Total vectors found", vectorResults.length);
      
      if (vectorResults.length > 0) {
        const topResults = vectorResults.slice(0, 3);
        topResults.forEach((result: any, index: number) => {
          logSubStep(`   - Result ${index + 1}:`, {
            score: result.score,
            sourceId: result.sourceId,
            documentTitle: result.documentTitle || "N/A",
            textPreview: result.text?.substring(0, 100) + "...",
            chunkIndex: result.chunkIndex
          });
        });
        
        // Analyze vector score distribution
        const scores = vectorResults.map((r: any) => r.score);
        const avgScore = scores.reduce((a: number, b: number) => a + b, 0) / scores.length;
        const maxScore = Math.max(...scores);
        const minScore = Math.min(...scores);
        
        logSubStep("📈 Vector Quality Analysis:");
        logSubStep("   - Average Score", avgScore.toFixed(4));
        logSubStep("   - Best Score", maxScore.toFixed(4));
        logSubStep("   - Worst Score", minScore.toFixed(4));
        logSubStep("   - Score Range", `${(maxScore - minScore).toFixed(4)} (wider = more diverse results)`);
        
        // Check relevance threshold
        const highQualityResults = vectorResults.filter((r: any) => r.score > 0.5);
        logSubStep("   - High Quality Results (>0.5)", `${highQualityResults.length}/${vectorResults.length}`);
      }
    }
    
    // STEP 4: Session management with timing
    logStep("📝 STEP 4: SESSION MANAGEMENT", "Creating chat session for conversation tracking");
    
    const sessionStartTime = Date.now();
    const sessionResponse = await api.post("/chat/sessions", {
      agentId: TEST_AGENT_ID
    });
    const sessionCreationTime = Date.now() - sessionStartTime;
    
    const sessionData = sessionResponse.data.data;
    const sessionId = sessionData.id;
    
    logSubStep("📋 Session Created:");
    logSubStep("   - Session ID", sessionId);
    logSubStep("   - Agent ID", sessionData.agent_id);
    logSubStep("   - Creation Time", `${sessionCreationTime}ms`);
    logSubStep("   - Created At", sessionData.created_at);
    
    // STEP 5: Enhanced chat flow with detailed timing breakdown
    logStep("💬 STEP 5: CHAT PROCESSING FLOW", "Detailed analysis of chat message processing");
    
    console.log("   📤 Sending chat request with detailed tracking...");
    const chatStartTime = Date.now();
    
    const chatResponse = await api.post(`/chat/agents/${TEST_AGENT_ID}`, {
      messages: [
        {
          role: "user",
          content: QUANTUMFORGE_QUESTION
        }
      ],
      sessionId: sessionId.toString(),
      searchStrategy: "pinecone_hybrid"
    });
    
    const chatEndTime = Date.now();
    totalRequestTime = chatEndTime - chatStartTime;
    
    if (chatResponse.status === 200) {
      chatData = chatResponse.data.data;
      
      logSubStep("⏱️ Request Timing Analysis:");
      logSubStep("   - Total request time", `${totalRequestTime}ms`);
      logSubStep("   - Backend processing time", chatData.performance?.totalTime || "N/A");
      logSubStep("   - Parallel phase time", chatData.performance?.parallelPhase || "N/A");
      logSubStep("   - Sequential phase time", chatData.performance?.sequentialPhase || "N/A");
      
      // Calculate derived timing metrics
      if (chatData.performance?.totalTime && chatData.performance?.parallelPhase && chatData.performance?.sequentialPhase) {
        const backendMs = parseInt(chatData.performance.totalTime.replace('ms', ''));
        const parallelMs = parseInt(chatData.performance.parallelPhase.replace('ms', ''));
        const sequentialMs = parseInt(chatData.performance.sequentialPhase.replace('ms', ''));
        const aiProcessingMs = backendMs - parallelMs - sequentialMs;
        
        logSubStep("   - AI Processing time (derived)", `${aiProcessingMs}ms`);
        logSubStep("   - Network overhead", `${totalRequestTime - backendMs}ms`);
        
        // Performance efficiency analysis
        const parallelEfficiency = (parallelMs / backendMs * 100).toFixed(1);
        const aiProcessingRatio = (aiProcessingMs / backendMs * 100).toFixed(1);
        
        logSubStep("📊 Performance Breakdown:");
        logSubStep("   - Parallel processing efficiency", `${parallelEfficiency}% of total backend time`);
        logSubStep("   - AI processing ratio", `${aiProcessingRatio}% of total backend time`);
      }
      
      logSubStep("🔍 Context Analysis:");
      logSubStep("   - Context was used", chatData.contextUsed ? "Yes" : "No");
      logSubStep("   - Context length", `${chatData.contextLength || 0} characters`);
      logSubStep("   - Context sources", chatData.contextSources?.length || 0);
      
      // If we have context sources, analyze them
      if (chatData.contextSources && chatData.contextSources.length > 0) {
        logSubStep("📚 Context Sources Details:");
        chatData.contextSources.forEach((source: any, index: number) => {
          logSubStep(`   - Source ${index + 1}:`, {
            score: source.score?.toFixed(4) || "N/A",
            sourceId: source.sourceId || "N/A",
            chunkIndex: source.chunkIndex || "N/A",
            textLength: source.text?.length || 0
          });
        });
      }
      
      logSubStep("🤖 AI Response Analysis:");
      logSubStep("   - Response length", `${chatData.message?.length || 0} characters`);
      logSubStep("   - Model used", chatData.model);
      logSubStep("   - Provider", chatData.provider);
      logSubStep("   - Words per second", `${((chatData.message?.split(' ').length || 0) / (totalRequestTime / 1000)).toFixed(2)} WPS`);
      
      // Response quality indicators
      const responseWords = chatData.message?.split(' ').length || 0;
      const hasSpecificInfo = chatData.message?.includes('2017') && chatData.message?.includes('Elena') && chatData.message?.includes('Marcus');
      
      logSubStep("� Response Quality Indicators:");
      logSubStep("   - Word count", responseWords);
      logSubStep("   - Contains specific facts", hasSpecificInfo ? "Yes (founders, year)" : "No");
      logSubStep("   - Response completeness", responseWords > 50 ? "Complete" : "Incomplete");
      
      logSubStep("�💭 Generated Response Preview:");
      console.log(`   "${chatData.message?.substring(0, 200)}..."`);
      
      // STEP 6: Enhanced backend processing analysis
      logStep("🔬 STEP 6: BACKEND PROCESSING BREAKDOWN", "Understanding what happened inside the chat service");
      
      console.log("   Based on the response, here's what happened in the backend:");
      console.log("   ");
      console.log("   🔄 PHASE 1 - PARALLEL PROCESSING:");
      console.log("     1. Agent validation and caching");
      console.log("     2. Session creation/validation");  
      console.log("     3. Vector search for relevant context");
      console.log(`     📊 Parallel Efficiency: ${chatData.performance?.parallelPhase || "N/A"}`);
      console.log("   ");
      console.log("   🔄 PHASE 2 - SEQUENTIAL PROCESSING:");
      console.log("     1. User message saved to database");
      console.log("     2. Conversation history retrieved");
      console.log("     3. API key decryption and validation");
      console.log(`     📊 Sequential Time: ${chatData.performance?.sequentialPhase || "N/A"}`);
      console.log("   ");
      console.log("   🔄 PHASE 3 - AI PROCESSING:");
      console.log("     1. System prompt enhanced with context");
      console.log("     2. Message history prepared");
      console.log("     3. AI model called with streaming");
      console.log("     4. Response generated and streamed");
      console.log(`     📊 Model: ${chatData.model} (${chatData.provider})`);
      console.log("   ");
      console.log("   🔄 PHASE 4 - POST-PROCESSING:");
      console.log("     1. Assistant response saved to database");
      console.log("     2. Analytics events tracked");
      console.log("     3. Performance metrics calculated");
      
    } else {
      logSubStep("❌ Chat request failed", { status: chatResponse.status, error: chatResponse.data });
    }
    
    // STEP 7: Enhanced data persistence verification with analytics
    logStep("💾 STEP 7: DATA PERSISTENCE VERIFICATION", "Confirming all data was properly saved");
    
    const historyResponse = await api.get(`/chat/sessions/${sessionId}/history`);
    
    if (historyResponse.status === 200) {
      const historyData = historyResponse.data.data;
      logSubStep("📜 Session History Verification:");
      logSubStep("   - Total messages in session", historyData.messages.length);
      
      historyData.messages.forEach((msg: any, index: number) => {
        logSubStep(`   - Message ${index + 1}`, {
          role: msg.role,
          contentLength: msg.content.length,
          timestamp: msg.created_at,
          timeSinceCreation: `${Date.now() - new Date(msg.created_at).getTime()}ms ago`
        });
      });
      
      // Analyze message timing patterns
      if (historyData.messages.length >= 2) {
        const userMsg = historyData.messages[0];
        const assistantMsg = historyData.messages[1];
        const responseDelay = new Date(assistantMsg.created_at).getTime() - new Date(userMsg.created_at).getTime();
        
        logSubStep("⏱️ Message Timing Analysis:");
        logSubStep("   - Response delay", `${responseDelay}ms`);
        logSubStep("   - Response speed", responseDelay < 3000 ? "Fast" : responseDelay < 5000 ? "Normal" : "Slow");
      }
    }
    
    // STEP 8: System health and resource analysis
    logStep("🏥 STEP 8: SYSTEM HEALTH ANALYSIS", "Checking system performance and resource usage");
    
    // Check agent performance metrics if available
    try {
      const agentStatsResponse = await api.get(`/agents/${TEST_AGENT_ID}/stats`);
      if (agentStatsResponse.status === 200) {
        const agentStats = agentStatsResponse.data.data;
        logSubStep("📊 Agent Performance Stats:");
        logSubStep("   - Total conversations", agentStats.totalConversations || "N/A");
        logSubStep("   - Average response time", agentStats.averageResponseTime || "N/A");
        logSubStep("   - Success rate", agentStats.successRate || "N/A");
      }
    } catch (error) {
      logSubStep("⚠️ Agent stats endpoint not available");
    }
    
    // Memory and performance indicators from response data
    logSubStep("💻 Resource Usage Indicators:");
    if (chatData) {
      const estimatedMemoryUsage = (chatData.contextLength || 0) + (chatData.message?.length || 0);
      logSubStep("   - Estimated memory usage", `${estimatedMemoryUsage} characters in memory`);
      logSubStep("   - Vector search efficiency", vectorResults.length > 5 ? "Good diversity" : "Limited results");
      logSubStep("   - Response compression ratio", `${((chatData.contextLength || 0) / (chatData.message?.length || 1)).toFixed(2)}:1 (context:response)`);
    }
    
    // STEP 9: Advanced analytics insights
    logStep("📈 STEP 9: ANALYTICS & INSIGHTS", "Advanced analysis of chat performance");
    
    logSubStep("🎯 Query Analysis:");
    logSubStep("   - Query type", "Factual information request");
    logSubStep("   - Query complexity", QUANTUMFORGE_QUESTION.split(' ').length > 8 ? "Complex" : "Simple");
    logSubStep("   - Expected knowledge base hit", "High (company-specific information)");
    
    logSubStep("🧠 Knowledge Retrieval Effectiveness:");
    if (vectorResults && vectorResults.length > 0) {
      const relevantResults = vectorResults.filter((r: any) => r.score > 0.4);
      const effectiveness = (relevantResults.length / vectorResults.length * 100).toFixed(1);
      logSubStep("   - Retrieval effectiveness", `${effectiveness}% (${relevantResults.length}/${vectorResults.length} results above 0.4 threshold)`);
      logSubStep("   - Knowledge base coverage", vectorResults.length >= 5 ? "Good" : "Limited");
    }
    
    logSubStep("⚡ Performance Classification:");
    const performanceClass = totalRequestTime < 2000 ? "Excellent" : 
                           totalRequestTime < 4000 ? "Good" : 
                           totalRequestTime < 6000 ? "Acceptable" : "Needs optimization";
    logSubStep("   - Overall performance", `${performanceClass} (${totalRequestTime}ms)`);
    
    // Bottleneck identification
    if (chatData?.performance) {
      const backendMs = parseInt(chatData.performance.totalTime?.replace('ms', '') || '0');
      const networkMs = totalRequestTime - backendMs;
      const bottleneck = networkMs > backendMs ? "Network latency" : 
                        backendMs > 3000 ? "AI processing" : "Optimized";
      logSubStep("   - Primary bottleneck", bottleneck);
    }
    
  } catch (error) {
    console.log("\n❌ === ANALYSIS FAILED ===");
    console.error("Error:", error instanceof Error ? error.message : String(error));
  }
}

// Run the detailed analysis
analyzeCompleteBackendFlow().catch(console.error);