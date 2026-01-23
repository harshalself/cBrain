/**
 * Failing Questions Search Strategy Test
 *
 * This script tests different search strategies for the failing questions
 * to find the optimal approach for retrieving the correct context.
 *
 * Failing Questions:
 * 1. "Who are the co-founders of QuantumForge?" - Expected: "Dr. Elena Vasquez and Marcus Chen"
 * 2. "What does CLE stand for?" - Expected: "Crystal Lattice Entanglement"
 *
 * Usage:
 * Run: npx ts-node scripts/test-failing-questions-search-strategies.ts
 */

import axios from "axios";
import * as dotenv from "dotenv";

// Load environment variables
dotenv.config();

const API_BASE_URL = "http://localhost:8000/api/v1";
const TEST_AGENT_ID = 7;

// Hardcoded credentials for testing
const TEST_EMAIL = "harshal@gmail.com";
const TEST_PASSWORD = "harshal2004";

let authToken = "";

// Enhanced axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 60000,
  validateStatus: () => true,
});

// Failing questions from the easy test
const failingQuestions = [
  {
    id: 3,
    question: "Who are the co-founders of QuantumForge?",
    expected: "Dr. Elena Vasquez and Marcus Chen",
    keywords: ["Elena Vasquez", "Marcus Chen", "co-founders", "founded by"]
  },
  {
    id: 4,
    question: "What does CLE stand for?",
    expected: "Crystal Lattice Entanglement",
    keywords: ["CLE", "Crystal Lattice Entanglement", "error correction"]
  }
];

// Different search strategies to test
const searchStrategies = [
  { name: "pinecone_hybrid", config: { searchStrategy: "pinecone_hybrid", enableReranking: true } },
  { name: "semantic_only", config: { searchStrategy: "semantic_only", enableReranking: true } },
  { name: "hybrid_no_rerank", config: { searchStrategy: "pinecone_hybrid", enableReranking: false } },
  { name: "semantic_no_rerank", config: { searchStrategy: "semantic_only", enableReranking: false } }
];

async function testSearchStrategies() {
  console.log("🔍 === FAILING QUESTIONS SEARCH STRATEGY TEST ===");
  console.log("🎯 Testing different search strategies to optimize context retrieval\n");

  try {
    // STEP 1: Authentication
    console.log("🔐 Authenticating...");
    const loginResponse = await api.post("/users/login", {
      email: TEST_EMAIL,
      password: TEST_PASSWORD
    });

    if (loginResponse.status !== 200) {
      throw new Error(`Login failed: ${loginResponse.data?.message}`);
    }

    authToken = loginResponse.data.data.token;
    api.defaults.headers.common['Authorization'] = `Bearer ${authToken}`;
    console.log("✅ Authentication successful\n");

    // STEP 2: Test each question with different strategies
    for (const testQuestion of failingQuestions) {
      console.log(`❓ QUESTION ${testQuestion.id}: "${testQuestion.question}"`);
      console.log(`🎯 Expected: "${testQuestion.expected}"\n`);

      const results = [];

      for (const strategy of searchStrategies) {
        console.log(`🔍 Testing strategy: ${strategy.name}`);

        try {
          // Create session for each strategy test
          const sessionResponse = await api.post("/chat/sessions", {
            agentId: TEST_AGENT_ID
          });

          if (sessionResponse.status !== 201) {
            console.log(`   ❌ Session creation failed: ${sessionResponse.data?.message || 'Unknown error'}`);
            continue;
          }

          const sessionId = sessionResponse.data.data.id;

          // Send question with specific search strategy
          const chatResponse = await api.post(`/chat/agents/${TEST_AGENT_ID}`, {
            messages: [{ role: "user", content: testQuestion.question }],
            sessionId: sessionId.toString(),
            ...strategy.config
          });

          if (chatResponse.status === 200) {
            const response = chatResponse.data.data.message;
            const chatData = chatResponse.data.data;

            // Evaluate response accuracy
            const hasExpectedAnswer = response.toLowerCase().includes(testQuestion.expected.toLowerCase());
            const similarity = hasExpectedAnswer ? 1.0 : 0.0;

            const result = {
              strategy: strategy.name,
              correct: hasExpectedAnswer,
              similarity: similarity,
              contextUsed: chatData.contextUsed,
              contextLength: chatData.contextLength,
              contextSources: chatData.contextSources?.length || 0,
              response: response.substring(0, 100) + "..."
            };

            results.push(result);

            console.log(`   ✅ Correct: ${result.correct}`);
            console.log(`   📏 Context: ${result.contextLength} chars, ${result.contextSources} sources`);
            console.log(`   🤖 Response: "${result.response}"`);

          } else {
            console.log(`   ❌ Chat request failed: ${chatResponse.status} - ${chatResponse.data?.message}`);
            results.push({
              strategy: strategy.name,
              correct: false,
              similarity: 0,
              error: chatResponse.data?.message
            });
          }

        } catch (error) {
          console.log(`   ❌ Error testing ${strategy.name}: ${error instanceof Error ? error.message : String(error)}`);
          results.push({
            strategy: strategy.name,
            correct: false,
            similarity: 0,
            error: error instanceof Error ? error.message : String(error)
          });
        }

        console.log("");
      }

      // Analyze results for this question
      console.log(`📊 RESULTS FOR QUESTION ${testQuestion.id}:`);
      const successfulStrategies = results.filter(r => r.correct);

      if (successfulStrategies.length > 0) {
        console.log(`   ✅ Successful strategies: ${successfulStrategies.map(r => r.strategy).join(', ')}`);
        successfulStrategies.forEach(result => {
          if ('contextLength' in result) {
            console.log(`      ${result.strategy}: ${result.contextLength} chars, ${result.contextSources} sources`);
          }
        });
      } else {
        console.log(`   ❌ No strategy successfully retrieved the correct information`);
        console.log(`   📋 Failed strategies: ${results.map(r => r.strategy).join(', ')}`);
      }

      console.log("\n" + "=".repeat(80) + "\n");
    }

    // STEP 3: Overall Analysis
    console.log("📊 === OVERALL ANALYSIS ===");

    // Count successes per strategy
    const strategySuccess: { [key: string]: number } = {};
    searchStrategies.forEach(s => strategySuccess[s.name] = 0);

    failingQuestions.forEach(question => {
      // For each question, check which strategies worked
      // (This is a simplified analysis - in practice you'd track per question)
    });

    console.log("🔧 Strategy Performance:");
    console.log("   - pinecone_hybrid: Hybrid search with semantic + keyword matching");
    console.log("   - semantic_only: Pure semantic search using embeddings");
    console.log("   - hybrid_no_rerank: Hybrid search without reranking");
    console.log("   - semantic_no_rerank: Semantic search without reranking");

    console.log("\n💡 RECOMMENDATIONS:");
    console.log("   1. If semantic_only works better: The reranking algorithm may be demoting relevant chunks");
    console.log("   2. If hybrid strategies work better: Keyword matching is important for these questions");
    console.log("   3. If no reranking works better: The reranking model may be prioritizing wrong criteria");
    console.log("   4. Consider question preprocessing to extract key entities before search");

  } catch (error) {
    console.log("\n❌ === ANALYSIS FAILED ===");
    console.error("Error:", error instanceof Error ? error.message : String(error));
  }
}

// Run the analysis
testSearchStrategies().catch(console.error);