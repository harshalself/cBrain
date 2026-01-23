/**
 * Failing Questions Vector Database Analysis
 *
 * This script specifically analyzes the failing questions from the easy questions test
 * to determine if the required data exists in the vector database and why retrieval failed.
 *
 * Failing Questions:
 * 1. "Who are the co-founders of QuantumForge?" - Expected: "Dr. Elena Vasquez and Marcus Chen"
 * 2. "What does CLE stand for?" - Expected: "Crystal Lattice Entanglement"
 *
 * Usage:
 * Run: npx ts-node scripts/test-failing-questions-vector-analysis.ts
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

async function analyzeFailingQuestions() {
  console.log("🔍 === FAILING QUESTIONS VECTOR DATABASE ANALYSIS ===");
  console.log("🎯 Analyzing why these specific questions failed despite 100% document coverage\n");

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

    // STEP 2: Analyze each failing question
    for (const testQuestion of failingQuestions) {
      console.log(`❓ QUESTION ${testQuestion.id}: "${testQuestion.question}"`);
      console.log(`🎯 Expected: "${testQuestion.expected}"\n`);

      // Test 1: Direct question search
      console.log("🔍 Test 1: Direct question vector search");
      const questionResponse = await api.post("/vectors/search", {
        query: testQuestion.question,
        agentId: TEST_AGENT_ID
      });

      if (questionResponse.status === 200) {
        const results = questionResponse.data.data || [];
        console.log(`   📊 Results found: ${results.length}`);

        if (results.length > 0) {
          console.log("   🎯 Top 3 results:");
          results.slice(0, 3).forEach((result: any, index: number) => {
            console.log(`     ${index + 1}. Score: ${result.score?.toFixed(4) || "N/A"}`);
            console.log(`        Text: "${result.text?.substring(0, 150) || "N/A"}..."`);
            console.log(`        Source ID: ${result.sourceId || "N/A"}`);
            console.log(`        Chunk Index: ${result.chunkIndex || "N/A"}`);
          });

          // Check if any result contains the expected answer
          const hasExpectedAnswer = results.some((result: any) =>
            result.text?.toLowerCase().includes(testQuestion.expected.toLowerCase())
          );
          console.log(`   ✅ Contains expected answer: ${hasExpectedAnswer ? "YES" : "NO"}`);
        } else {
          console.log("   ❌ No results found for direct question search");
        }
      } else {
        console.log(`   ❌ Question search failed: ${questionResponse.status}`);
      }

      console.log("");

      // Test 2: Keyword-based searches
      console.log("🔍 Test 2: Individual keyword searches");
      for (const keyword of testQuestion.keywords) {
        console.log(`   🔎 Searching for: "${keyword}"`);

        const keywordResponse = await api.post("/vectors/search", {
          query: keyword,
          agentId: TEST_AGENT_ID
        });

        if (keywordResponse.status === 200) {
          const keywordResults = keywordResponse.data.data || [];
          console.log(`      📊 Results: ${keywordResults.length}`);

          if (keywordResults.length > 0) {
            const topResult = keywordResults[0];
            console.log(`      🎯 Top Score: ${topResult.score?.toFixed(4) || "N/A"}`);
            console.log(`      📄 Text: "${topResult.text?.substring(0, 100) || "N/A"}..."`);

            // Check if this keyword result contains the expected answer
            const containsExpected = topResult.text?.toLowerCase().includes(testQuestion.expected.toLowerCase());
            console.log(`      ✅ Contains expected answer: ${containsExpected ? "YES" : "NO"}`);
          } else {
            console.log(`      ❌ No results for keyword: "${keyword}"`);
          }
        } else {
          console.log(`      ❌ Keyword search failed: ${keywordResponse.status}`);
        }
        console.log("");
      }

      // Test 3: Context retrieval simulation
      console.log("🔍 Test 3: Context retrieval simulation (top 3 results, 2000 char limit)");
      const contextResponse = await api.post("/vectors/search", {
        query: testQuestion.question,
        agentId: TEST_AGENT_ID
      });

      if (contextResponse.status === 200) {
        const allResults = contextResponse.data.data || [];
        const top3Results = allResults.slice(0, 3);

        console.log(`   📊 Total results available: ${allResults.length}`);
        console.log(`   🎯 Using top 3 for context: ${top3Results.length}`);

        if (top3Results.length > 0) {
          // Simulate context building (like ContextService does)
          const contextParts: string[] = [];
          let totalChars = 0;

          for (const result of top3Results) {
            if (result.text && result.text.length > 0) {
              const citation = result.sourceId ? ` [source_${result.sourceId}]` : '';
              const contextSnippet = `${result.text}${citation}`;

              // Check if adding this would exceed 2000 char limit
              if (totalChars + contextSnippet.length <= 2000) {
                contextParts.push(contextSnippet);
                totalChars += contextSnippet.length;
              } else {
                console.log(`      ⚠️  Skipping result (would exceed 2000 char limit)`);
                break;
              }
            }
          }

          const finalContext = contextParts.join("\n\n");
          console.log(`   📏 Final context length: ${finalContext.length} characters`);
          console.log(`   📚 Context sources used: ${contextParts.length}`);

          // Check if final context contains expected answer
          const contextHasAnswer = finalContext.toLowerCase().includes(testQuestion.expected.toLowerCase());
          console.log(`   ✅ Final context contains expected answer: ${contextHasAnswer ? "YES" : "NO"}`);

          if (!contextHasAnswer) {
            console.log("   🔍 Context content preview:");
            console.log(`      "${finalContext.substring(0, 300)}..."`);
          }
        } else {
          console.log("   ❌ No results available for context building");
        }
      } else {
        console.log(`   ❌ Context simulation failed: ${contextResponse.status}`);
      }

      console.log("\n" + "=".repeat(80) + "\n");
    }

    // STEP 3: Overall Analysis
    console.log("📊 === OVERALL ANALYSIS ===");

    // Check if data exists anywhere in the vector database
    console.log("🔍 Checking if expected data exists anywhere in vector database...");

    for (const testQuestion of failingQuestions) {
      console.log(`\n❓ Question ${testQuestion.id} - "${testQuestion.expected}"`);

      // Search for the exact expected answer
      const existenceCheck = await api.post("/vectors/search", {
        query: testQuestion.expected,
        agentId: TEST_AGENT_ID
      });

      if (existenceCheck.status === 200) {
        const existenceResults = existenceCheck.data.data || [];
        console.log(`   📊 Direct search results: ${existenceResults.length}`);

        if (existenceResults.length > 0) {
          const topScore = existenceResults[0].score;
          console.log(`   🎯 Top score: ${topScore?.toFixed(4) || "N/A"}`);
          console.log(`   📄 Top result preview: "${existenceResults[0].text?.substring(0, 100) || "N/A"}..."`);
          console.log(`   ✅ Data EXISTS in vector database`);
        } else {
          console.log(`   ❌ Data NOT FOUND in vector database`);
        }
      } else {
        console.log(`   ❌ Existence check failed: ${existenceCheck.status}`);
      }
    }

    // STEP 4: Recommendations
    console.log("\n💡 === RECOMMENDATIONS ===");

    console.log("🔧 Potential Issues Identified:");
    console.log("   1. Context selection algorithm may not be prioritizing relevant chunks");
    console.log("   2. Question phrasing might not match chunk content structure");
    console.log("   3. Reranking algorithm might be demoting high-relevance chunks");
    console.log("   4. 2000 character limit might be cutting off relevant information");

    console.log("\n🛠️ Suggested Fixes:");
    console.log("   1. Increase context results from top 3 to top 5");
    console.log("   2. Adjust reranking weights for exact keyword matches");
    console.log("   3. Increase context character limit from 2000 to 3000");
    console.log("   4. Add question preprocessing to extract key entities");
    console.log("   5. Implement hybrid search with boosted keyword matching");

  } catch (error) {
    console.log("\n❌ === ANALYSIS FAILED ===");
    console.error("Error:", error instanceof Error ? error.message : String(error));
  }
}

// Run the analysis
analyzeFailingQuestions().catch(console.error);