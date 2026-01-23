/**
 * Response Quality Analysis Test
 * 
 * This test analyzes WHY responses are failing and identifies specific issues:
 * 1. Context retrieval problems (vector search issues)
 * 2. Chunking problems (information split across chunks)
 * 3. LLM reasoning problems (model not using context properly)
 * 4. Missing information in knowledge base
 * 
 * Goal: Identify the root cause of failures to guide improvements
 */

import axios from "axios";
import * as dotenv from "dotenv";
import * as fs from "fs";
import * as path from "path";

dotenv.config();

const API_BASE_URL = "http://localhost:8000/api/v1";
const TEST_USER = {
  email: "harshal@gmail.com",
  password: "harshal2004",
};
const TEST_AGENT_ID = 7;

let authToken = "";

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 60000,
  validateStatus: () => true,
});

// Test cases that we KNOW should work based on the knowledge base
const criticalTestCases = [
  {
    id: "comp_adv",
    question: "What are QuantumForge's competitive advantages?",
    expectedKeywords: ["Proprietary Materials", "Ararat Crystal", "Room Temperature", "Error Correction", "CLE", "Vertical Integration"],
    category: "business",
    complexity: "medium"
  },
  {
    id: "market_pos",
    question: "What is QuantumForge's market share and who are their competitors?",
    expectedKeywords: ["35%", "market share", "IonTech", "SuperQ", "QuantumSoft", "EntangleCorp"],
    category: "business",
    complexity: "medium"
  },
  {
    id: "crystal_steps",
    question: "What are the exact steps to create Ararat Crystal?",
    expectedKeywords: ["High-pressure diamond synthesis", "2.5 million PSI", "neodymium", "europium", "terbium", "Quantum annealing", "-273.15°C", "electromagnetic pulse"],
    category: "technical",
    complexity: "hard"
  },
  {
    id: "cle_detail",
    question: "How does Crystal Lattice Entanglement (CLE) work and what are its benefits?",
    expectedKeywords: ["99.97%", "error correction", "22°C", "ambient temperature", "15 watts", "qubit connectivity"],
    category: "technical",
    complexity: "hard"
  },
  {
    id: "q4_specs",
    question: "What are the complete specifications of the Q4 Infinity Processor?",
    expectedKeywords: ["4096", "qubits", "64x64", "toroidal", "1,000,000", "quantum volume", "5 petahertz", "99.999%", "fidelity"],
    category: "technical",
    complexity: "hard"
  }
];

interface AnalysisResult {
  testCase: string;
  question: string;
  category: string;
  complexity: string;
  
  // Vector search analysis
  vectorResults: number;
  topVectorScore: number;
  avgVectorScore: number;
  relevantChunksFound: number;
  
  // Context analysis
  contextUsed: boolean;
  contextLength: number;
  contextSources: number;
  keywordsInContext: string[];
  keywordsCoverage: number;
  
  // Response analysis
  responseLength: number;
  keywordsInResponse: string[];
  keywordsInResponseButNotContext: string[];
  responseCoverage: number;
  
  // Issue identification
  issues: string[];
  rootCause: string;
  recommendation: string;
}

async function analyzeResponseQuality() {
  console.log("🔬 === RESPONSE QUALITY ANALYSIS ===");
  console.log("📊 Identifying root causes of response failures\n");
  
  const results: AnalysisResult[] = [];
  
  try {
    // Authentication
    console.log("🔐 Authenticating...");
    const loginResponse = await api.post("/users/login", TEST_USER);
    if (loginResponse.status !== 200) {
      throw new Error(`Login failed: ${loginResponse.data?.message}`);
    }
    
    authToken = loginResponse.data.data.token;
    api.defaults.headers.common['Authorization'] = `Bearer ${authToken}`;
    console.log("✅ Authenticated\n");
    
    // Test each case
    for (const testCase of criticalTestCases) {
      console.log(`\n${"=".repeat(80)}`);
      console.log(`🧪 TEST: ${testCase.id.toUpperCase()}`);
      console.log(`❓ Question: ${testCase.question}`);
      console.log(`📂 Category: ${testCase.category} | Complexity: ${testCase.complexity}`);
      console.log(`🎯 Expected Keywords: ${testCase.expectedKeywords.join(", ")}`);
      
      const analysis: AnalysisResult = {
        testCase: testCase.id,
        question: testCase.question,
        category: testCase.category,
        complexity: testCase.complexity,
        vectorResults: 0,
        topVectorScore: 0,
        avgVectorScore: 0,
        relevantChunksFound: 0,
        contextUsed: false,
        contextLength: 0,
        contextSources: 0,
        keywordsInContext: [],
        keywordsCoverage: 0,
        responseLength: 0,
        keywordsInResponse: [],
        keywordsInResponseButNotContext: [],
        responseCoverage: 0,
        issues: [],
        rootCause: "",
        recommendation: ""
      };
      
      // Step 1: Analyze vector search
      console.log("\n📊 STEP 1: Vector Search Analysis");
      const vectorResponse = await api.post("/vectors/search", {
        query: testCase.question,
        agentId: TEST_AGENT_ID
      });
      
      if (vectorResponse.status === 200) {
        const vectors = vectorResponse.data.data || [];
        analysis.vectorResults = vectors.length;
        
        if (vectors.length > 0) {
          const scores = vectors.map((v: any) => v.score);
          analysis.topVectorScore = Math.max(...scores);
          analysis.avgVectorScore = scores.reduce((a: number, b: number) => a + b, 0) / scores.length;
          analysis.relevantChunksFound = vectors.filter((v: any) => v.score > 0.5).length;
          
          console.log(`   ✓ Vector Results: ${analysis.vectorResults}`);
          console.log(`   ✓ Top Score: ${analysis.topVectorScore.toFixed(4)}`);
          console.log(`   ✓ Avg Score: ${analysis.avgVectorScore.toFixed(4)}`);
          console.log(`   ✓ High Quality (>0.5): ${analysis.relevantChunksFound}`);
          
          // Check if expected keywords appear in vector results
          const allVectorText = vectors.map((v: any) => v.text?.toLowerCase() || "").join(" ");
          testCase.expectedKeywords.forEach(keyword => {
            if (allVectorText.includes(keyword.toLowerCase())) {
              analysis.keywordsInContext.push(keyword);
            }
          });
          
          analysis.keywordsCoverage = (analysis.keywordsInContext.length / testCase.expectedKeywords.length) * 100;
          
          console.log(`   ✓ Keywords Found in Vectors: ${analysis.keywordsInContext.length}/${testCase.expectedKeywords.length} (${analysis.keywordsCoverage.toFixed(1)}%)`);
          console.log(`   ✓ Found: ${analysis.keywordsInContext.join(", ")}`);
          
          const missingKeywords = testCase.expectedKeywords.filter(k => !analysis.keywordsInContext.includes(k));
          if (missingKeywords.length > 0) {
            console.log(`   ⚠️  Missing: ${missingKeywords.join(", ")}`);
            analysis.issues.push(`Missing keywords in vector results: ${missingKeywords.join(", ")}`);
          }
          
          // Show top 3 chunks
          console.log("\n   📄 Top 3 Vector Chunks:");
          vectors.slice(0, 3).forEach((v: any, idx: number) => {
            console.log(`      ${idx + 1}. Score: ${v.score.toFixed(4)} | Preview: "${v.text?.substring(0, 80)}..."`);
          });
        } else {
          console.log("   ❌ No vector results found!");
          analysis.issues.push("No vector results returned");
        }
      } else {
        console.log(`   ❌ Vector search failed: ${vectorResponse.status}`);
        analysis.issues.push("Vector search API failed");
      }
      
      // Step 2: Send actual chat request and analyze
      console.log("\n📊 STEP 2: Chat Response Analysis");
      
      const sessionResponse = await api.post("/chat/sessions", {
        agentId: TEST_AGENT_ID
      });
      
      if (sessionResponse.status === 201) {
        const sessionId = sessionResponse.data.data.id;
        
        const chatResponse = await api.post(`/chat/agents/${TEST_AGENT_ID}`, {
          messages: [{ role: "user", content: testCase.question }],
          sessionId: sessionId.toString(),
          searchStrategy: "pinecone_hybrid"
        });
        
        if (chatResponse.status === 200) {
          const response = chatResponse.data.data.message;
          const chatData = chatResponse.data.data;
          
          analysis.contextUsed = chatData.contextUsed || false;
          analysis.contextLength = chatData.contextLength || 0;
          analysis.contextSources = chatData.contextSources?.length || 0;
          analysis.responseLength = response.length;
          
          console.log(`   ✓ Context Used: ${analysis.contextUsed}`);
          console.log(`   ✓ Context Length: ${analysis.contextLength} chars`);
          console.log(`   ✓ Context Sources: ${analysis.contextSources}`);
          console.log(`   ✓ Response Length: ${analysis.responseLength} chars`);
          
          // Check which keywords appear in response
          const responseLower = response.toLowerCase();
          testCase.expectedKeywords.forEach(keyword => {
            if (responseLower.includes(keyword.toLowerCase())) {
              analysis.keywordsInResponse.push(keyword);
              
              // Check if keyword was in context
              if (!analysis.keywordsInContext.includes(keyword)) {
                analysis.keywordsInResponseButNotContext.push(keyword);
              }
            }
          });
          
          analysis.responseCoverage = (analysis.keywordsInResponse.length / testCase.expectedKeywords.length) * 100;
          
          console.log(`   ✓ Keywords in Response: ${analysis.keywordsInResponse.length}/${testCase.expectedKeywords.length} (${analysis.responseCoverage.toFixed(1)}%)`);
          console.log(`   ✓ Found: ${analysis.keywordsInResponse.join(", ")}`);
          
          const missingInResponse = testCase.expectedKeywords.filter(k => !analysis.keywordsInResponse.includes(k));
          if (missingInResponse.length > 0) {
            console.log(`   ⚠️  Missing: ${missingInResponse.join(", ")}`);
            analysis.issues.push(`Missing keywords in response: ${missingInResponse.join(", ")}`);
          }
          
          if (analysis.keywordsInResponseButNotContext.length > 0) {
            console.log(`   🤔 Keywords in response but NOT in context: ${analysis.keywordsInResponseButNotContext.join(", ")}`);
            analysis.issues.push(`LLM hallucinated keywords: ${analysis.keywordsInResponseButNotContext.join(", ")}`);
          }
          
          console.log(`\n   📝 Response Preview:\n   "${response.substring(0, 300)}..."`);
        } else {
          console.log(`   ❌ Chat request failed: ${chatResponse.status}`);
          analysis.issues.push("Chat API failed");
        }
      } else {
        console.log(`   ❌ Session creation failed: ${sessionResponse.status}`);
        analysis.issues.push("Session creation failed");
      }
      
      // Step 3: Root cause analysis
      console.log("\n🔍 STEP 3: Root Cause Analysis");
      
      if (analysis.vectorResults === 0) {
        analysis.rootCause = "VECTOR_SEARCH_FAILURE";
        analysis.recommendation = "Check vector database connectivity and agent configuration";
      } else if (analysis.topVectorScore < 0.3) {
        analysis.rootCause = "LOW_VECTOR_RELEVANCE";
        analysis.recommendation = "Improve embedding model or query preprocessing";
      } else if (analysis.keywordsCoverage < 50) {
        analysis.rootCause = "MISSING_KNOWLEDGE";
        analysis.recommendation = "Knowledge base is incomplete - add missing information to source documents";
      } else if (analysis.keywordsCoverage >= 70 && analysis.responseCoverage < 50) {
        analysis.rootCause = "LLM_NOT_USING_CONTEXT";
        analysis.recommendation = "LLM is not extracting information from context properly - adjust prompt or temperature";
      } else if (analysis.keywordsInResponseButNotContext.length > 0) {
        analysis.rootCause = "LLM_HALLUCINATION";
        analysis.recommendation = "LLM is making up information - strengthen system prompt to only use provided context";
      } else if (analysis.keywordsCoverage < 70) {
        analysis.rootCause = "POOR_CHUNKING";
        analysis.recommendation = "Information is split across chunks - improve chunking strategy or increase context window";
      } else {
        analysis.rootCause = "ACCEPTABLE_PERFORMANCE";
        analysis.recommendation = "Response quality is acceptable";
      }
      
      console.log(`   🎯 Root Cause: ${analysis.rootCause}`);
      console.log(`   💡 Recommendation: ${analysis.recommendation}`);
      console.log(`   ⚠️  Issues Identified: ${analysis.issues.length}`);
      analysis.issues.forEach((issue, idx) => {
        console.log(`      ${idx + 1}. ${issue}`);
      });
      
      results.push(analysis);
      
      // Small delay between tests
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    // Summary
    console.log(`\n\n${"=".repeat(80)}`);
    console.log("📊 === OVERALL ANALYSIS SUMMARY ===\n");
    
    const rootCauseCounts: Record<string, number> = {};
    results.forEach(r => {
      rootCauseCounts[r.rootCause] = (rootCauseCounts[r.rootCause] || 0) + 1;
    });
    
    console.log("🎯 Root Cause Distribution:");
    Object.entries(rootCauseCounts).forEach(([cause, count]) => {
      console.log(`   - ${cause}: ${count}/${results.length} (${(count / results.length * 100).toFixed(1)}%)`);
    });
    
    console.log("\n📈 Average Metrics:");
    const avgVectorScore = results.reduce((sum, r) => sum + r.avgVectorScore, 0) / results.length;
    const avgKeywordCoverage = results.reduce((sum, r) => sum + r.keywordsCoverage, 0) / results.length;
    const avgResponseCoverage = results.reduce((sum, r) => sum + r.responseCoverage, 0) / results.length;
    
    console.log(`   - Average Vector Score: ${avgVectorScore.toFixed(4)}`);
    console.log(`   - Average Context Coverage: ${avgKeywordCoverage.toFixed(1)}%`);
    console.log(`   - Average Response Coverage: ${avgResponseCoverage.toFixed(1)}%`);
    
    console.log("\n🚨 Priority Issues to Fix:");
    const priorityIssues = results
      .filter(r => r.rootCause !== "ACCEPTABLE_PERFORMANCE")
      .sort((a, b) => a.responseCoverage - b.responseCoverage);
    
    priorityIssues.forEach((r, idx) => {
      console.log(`\n   ${idx + 1}. ${r.testCase.toUpperCase()} (${r.complexity})`);
      console.log(`      Issue: ${r.rootCause}`);
      console.log(`      Context Coverage: ${r.keywordsCoverage.toFixed(1)}%`);
      console.log(`      Response Coverage: ${r.responseCoverage.toFixed(1)}%`);
      console.log(`      Fix: ${r.recommendation}`);
    });
    
    // Save detailed results
    const resultsPath = path.join(process.cwd(), `response-quality-analysis-${Date.now()}.json`);
    fs.writeFileSync(resultsPath, JSON.stringify({
      timestamp: new Date().toISOString(),
      summary: {
        totalTests: results.length,
        rootCauseCounts,
        avgVectorScore,
        avgKeywordCoverage,
        avgResponseCoverage
      },
      detailedResults: results
    }, null, 2));
    
    console.log(`\n📁 Detailed analysis saved: ${resultsPath}`);
    
  } catch (error) {
    console.error("\n❌ Analysis failed:", error instanceof Error ? error.message : String(error));
  }
}

// Run analysis
analyzeResponseQuality().catch(console.error);
