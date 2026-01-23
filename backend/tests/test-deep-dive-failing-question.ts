/**
 * Deep Dive Analysis for Failing Question
 * 
 * This test analyzes the ONE remaining failing question to understand
 * why it's not working despite having 100% context coverage.
 * 
 * Goal: Fix the root cause so ALL questions pass with high accuracy
 */

import axios from "axios";
import * as dotenv from "dotenv";
import * as fs from "fs";

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

async function deepDiveFailingQuestion() {
  console.log("🔬 === DEEP DIVE: MARKET POSITION QUESTION ===\n");
  
  try {
    // Auth
    const loginResponse = await api.post("/users/login", TEST_USER);
    authToken = loginResponse.data.data.token;
    api.defaults.headers.common['Authorization'] = `Bearer ${authToken}`;
    
    const question = "What is QuantumForge's market share and who are their competitors?";
    const expectedInfo = [
      "35% global quantum computing market share",
      "42% quantum cloud services market leadership", 
      "28% quantum hardware enterprise deployments",
      "IonTech - ion trap technology",
      "SuperQ - superconducting circuits",
      "QuantumSoft - software-only solutions",
      "EntangleCorp - acquired in 2022"
    ];
    
    console.log("❓ Question:", question);
    console.log("🎯 Expected Information:");
    expectedInfo.forEach((info, i) => console.log(`   ${i + 1}. ${info}`));
    
    // Step 1: Check what vector search returns
    console.log("\n📊 STEP 1: Vector Search Analysis");
    const vectorResponse = await api.post("/vectors/search", {
      query: question,
      agentId: TEST_AGENT_ID
    });
    
    if (vectorResponse.status === 200) {
      const results = vectorResponse.data.data || [];
      console.log(`✓ Found ${results.length} vector results`);
      
      // Check all vector results for expected info
      console.log("\n🔍 Analyzing ALL vector results for expected information:");
      const allVectorText = results.map((r: any) => r.text || "").join("\n\n");
      
      expectedInfo.forEach(info => {
        const found = allVectorText.toLowerCase().includes(info.toLowerCase().split(' ')[0]);
        console.log(`   ${found ? '✅' : '❌'} "${info}"`);
      });
      
      // Show all vector results with their full text
      console.log("\n📄 ALL VECTOR RESULTS (Full Text):");
      results.forEach((result: any, idx: number) => {
        console.log(`\n--- Result ${idx + 1} (Score: ${result.score?.toFixed(4)}) ---`);
        console.log(result.text);
      });
    }
    
    // Step 2: Send actual chat request
    console.log("\n\n📊 STEP 2: Chat Request");
    const sessionResponse = await api.post("/chat/sessions", {
      agentId: TEST_AGENT_ID
    });
    
    if (sessionResponse.status === 201) {
      const sessionId = sessionResponse.data.data.id;
      
      const chatResponse = await api.post(`/chat/agents/${TEST_AGENT_ID}`, {
        messages: [{ role: "user", content: question }],
        sessionId: sessionId.toString(),
        searchStrategy: "pinecone_hybrid"
      });
      
      if (chatResponse.status === 200) {
        const response = chatResponse.data.data.message;
        const chatData = chatResponse.data.data;
        
        console.log("✓ Chat Response Received");
        console.log(`✓ Context Used: ${chatData.contextUsed}`);
        console.log(`✓ Context Length: ${chatData.contextLength} chars`);
        console.log(`✓ Context Sources: ${chatData.contextSources?.length || 0}`);
        
        console.log("\n📝 FULL RESPONSE:");
        console.log(response);
        
        console.log("\n\n🔍 CHECKING: What information was included in response?");
        expectedInfo.forEach(info => {
          const keyword = info.split(' ')[0];
          const found = response.toLowerCase().includes(keyword.toLowerCase());
          console.log(`   ${found ? '✅' : '❌'} "${info}"`);
        });
      }
    }
    
  } catch (error) {
    console.error("❌ Error:", error instanceof Error ? error.message : String(error));
  }
}

deepDiveFailingQuestion().catch(console.error);
