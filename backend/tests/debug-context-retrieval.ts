import axios from "axios";
import { config } from "dotenv";
config();

const API_BASE_URL = "http://localhost:8000/api/v1";
const TEST_AGENT_ID = 7; // Use numeric ID like other tests
const TEST_USER_EMAIL = "harshal@gmail.com";
const TEST_USER_PASSWORD = "harshal2004"; // Correct password from working test

// Enhanced axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 60000,
  validateStatus: () => true,
});

async function debugContextRetrieval() {
  console.log("🔍 === CONTEXT RETRIEVAL DEBUG ===\n");

  try {
    // Authenticate
    const authResponse = await axios.post(`${API_BASE_URL}/users/login`, {
      email: TEST_USER_EMAIL,
      password: TEST_USER_PASSWORD,
    });

    const token = authResponse.data.data.token;
    const api = axios.create({
      baseURL: API_BASE_URL,
      headers: { Authorization: `Bearer ${token}` },
    });

    console.log("✅ Authenticated\n");

    // Test questions that are failing
    const failingQuestions = [
      "What is QuantumForge's market share and who are their competitors?",
      "What are QuantumForge's strategic partnerships with universities and corporations?",
      // Add simpler test queries
      "partnerships",
      "MIT Stanford",
      "market share competitors"
    ];

    for (const question of failingQuestions) {
      console.log(`🔍 Testing: "${question}"\n`);

      // Create session
      const sessionResponse = await api.post("/chat/sessions", {
        agentId: TEST_AGENT_ID
      });

      const sessionId = sessionResponse.data.data.id;

      // Test the actual chat response
      const chatResponse = await api.post(`/chat/agents/${TEST_AGENT_ID}`, {
        messages: [{ role: "user", content: question }],
        sessionId: sessionId.toString(),
        searchStrategy: "pinecone_hybrid"
      });

      const response = chatResponse.data.data.message;
      console.log("🤖 AI Response:");
      console.log(`   "${response}"\n`);

      // Check if response contains "I don't have information"
      const hasNoInfo = response.toLowerCase().includes("don't have") ||
                       response.toLowerCase().includes("no information") ||
                       response.toLowerCase().includes("unfortunately");

      console.log(`📊 Analysis:`);
      console.log(`   - Contains "no information": ${hasNoInfo}`);
      console.log(`   - Response length: ${response.length} characters`);
      console.log(`   - Expected to find: ${question.includes('market share') ?
        '35% global share, IonTech, SuperQ, QuantumSoft, EntangleCorp' :
        'MIT, Stanford, PharmaCorp, Department of Defense, academic collaborations'}\n`);

      console.log("─".repeat(80) + "\n");
    }

  } catch (error: any) {
    console.error("❌ Error:", error.response?.data || error.message);
  }
}

debugContextRetrieval();