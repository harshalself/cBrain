/**
 * Comprehensive All-Questions Test
 * 
 * Tests ALL questions (easy + medium + hard) to get overall accuracy score
 * Goal: Achieve 90%+ accuracy across all difficulty levels
 */

import axios from "axios";
import * as dotenv from "dotenv";

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

// All questions from easy, medium, and hard tests
const allQuestions = [
  // EASY (5 questions)
  { id: 1, difficulty: "easy", question: "What is the name of QuantumForge's proprietary material?", expected: "Ararat Crystal" },
  { id: 2, difficulty: "easy", question: "When was QuantumForge Technologies founded?", expected: "2017" },
  { id: 3, difficulty: "easy", question: "Who are the co-founders of QuantumForge?", expected: "Dr. Elena Vasquez and Marcus Chen" },
  { id: 4, difficulty: "easy", question: "What does CLE stand for?", expected: "Crystal Lattice Entanglement" },
  { id: 5, difficulty: "easy", question: "What is the name of QuantumForge's quantum programming language?", expected: "QScript" },
  
  // MEDIUM (5 questions)
  { id: 6, difficulty: "medium", question: "What are the four steps in creating Ararat Crystal?", expected: "High-pressure diamond synthesis, Infusion with neodymium/europium/terbium, Quantum annealing, electromagnetic pulse" },
  { id: 7, difficulty: "medium", question: "What are the key features of the QuantumForge Q3 Harmony Processor?", expected: "1024 qubits, 99.99% fidelity, 1.2 petahertz, liquid helium cooling" },
  { id: 8, difficulty: "medium", question: "What are QuantumForge's current research projects?", expected: "Project Phoenix, Project Atlas, Project Genesis, Project Titan" },
  { id: 9, difficulty: "medium", question: "What are QuantumForge's competitive advantages?", expected: "Proprietary Materials, Room Temperature, Error Correction, Vertical Integration" },
  { id: 10, difficulty: "medium", question: "What are the components of the QuantumForge Development Kit?", expected: "Q1 mini processor, QScript, Crystal growth chamber, Quantum sensor array" },
  
  // HARD (5 questions)
  { id: 11, difficulty: "hard", question: "What is QuantumForge's market share and who are their competitors?", expected: "35% global share, 42% cloud, IonTech, SuperQ, QuantumSoft, EntangleCorp" },
  { id: 12, difficulty: "hard", question: "How does Crystal Lattice Entanglement work and what are its benefits?", expected: "crystal lattice structure, 99.97% error correction, 22°C, 15 watts" },
  { id: 13, difficulty: "hard", question: "What are the complete specifications of the Q4 Infinity Processor?", expected: "4096 qubits, 64x64 lattice, 1,000,000 quantum volume, 5 petahertz, 99.999% fidelity" },
  { id: 14, difficulty: "hard", question: "Describe QuantumForge's global manufacturing network and key facilities.", expected: "Turkey HQ, Switzerland optics, Japan semiconductor, Canada rare earth, multiple locations" },
  { id: 15, difficulty: "hard", question: "What are QuantumForge's strategic partnerships with universities and corporations?", expected: "MIT, Stanford, PharmaCorp, Department of Defense, academic collaborations" },
];

function calculateSimilarity(response: string, expected: string): number {
  const responseLower = response.toLowerCase();
  const expectedLower = expected.toLowerCase();
  
  const keywords = expectedLower.split(/[,\s]+/).filter(k => k.length > 2);
  let matches = 0;
  
  keywords.forEach(keyword => {
    if (responseLower.includes(keyword)) {
      matches++;
    }
  });
  
  return keywords.length > 0 ? matches / keywords.length : 0;
}

async function runComprehensiveTest() {
  console.log("🎯 === COMPREHENSIVE ALL-QUESTIONS TEST ===");
  console.log("📊 Testing 15 questions across all difficulty levels");
  console.log("🎯 Target: 90%+ overall accuracy\n");
  
  try {
    // Auth
    const loginResponse = await api.post("/users/login", TEST_USER);
    authToken = loginResponse.data.data.token;
    api.defaults.headers.common['Authorization'] = `Bearer ${authToken}`;
    console.log("✅ Authenticated\n");
    
    const results = {
      easy: { total: 0, correct: 0, scores: [] as number[] },
      medium: { total: 0, correct: 0, scores: [] as number[] },
      hard: { total: 0, correct: 0, scores: [] as number[] },
      overall: { total: 0, correct: 0, scores: [] as number[] }
    };
    
    for (const q of allQuestions) {
      console.log(`\n${q.difficulty.toUpperCase()} Q${q.id}: ${q.question.substring(0, 80)}...`);
      
      try {
        // Create session
        const sessionResponse = await api.post("/chat/sessions", {
          agentId: TEST_AGENT_ID
        });
        
        if (sessionResponse.status !== 201) {
          console.log(`   ❌ Session creation failed`);
          continue;
        }
        
        const sessionId = sessionResponse.data.data.id;
        
        // Send question
        const chatResponse = await api.post(`/chat/agents/${TEST_AGENT_ID}`, {
          messages: [{ role: "user", content: q.question }],
          sessionId: sessionId.toString(),
          searchStrategy: "pinecone_hybrid"
        });
        
        if (chatResponse.status === 200) {
          const response = chatResponse.data.data.message;
          const similarity = calculateSimilarity(response, q.expected);
          const correct = similarity >= 0.7;
          
          // Debug failing questions
          if (!correct && (q.question.includes('partnerships') || q.question.includes('market share'))) {
            console.log(`\n🔍 DEBUG: ${q.question}`);
            console.log(`Expected: ${q.expected.substring(0, 100)}...`);
            console.log(`Got: ${response.substring(0, 100)}...`);
            console.log(`Similarity: ${(similarity * 100).toFixed(1)}%`);
          }
          
          // Update stats
          const diffKey = q.difficulty as 'easy' | 'medium' | 'hard';
          results[diffKey].total++;
          results[diffKey].scores.push(similarity);
          if (correct) results[diffKey].correct++;
          
          results.overall.total++;
          results.overall.scores.push(similarity);
          if (correct) results.overall.correct++;
          
          const status = correct ? "✅ PASS" : "❌ FAIL";
          const score = (similarity * 100).toFixed(1);
          console.log(`   ${status} (${score}% similarity)`);
          
          if (!correct) {
            console.log(`   Expected: ${q.expected.substring(0, 60)}...`);
            console.log(`   Got: ${response.substring(0, 60)}...`);
          }
        } else {
          console.log(`   ❌ Chat request failed: ${chatResponse.status}`);
        }
        
        // Small delay
        await new Promise(resolve => setTimeout(resolve, 500));
        
      } catch (error) {
        console.log(`   ❌ Error: ${error instanceof Error ? error.message : String(error)}`);
      }
    }
    
    // Summary
    console.log("\n\n" + "=".repeat(80));
    console.log("📊 === TEST RESULTS SUMMARY ===\n");
    
    function printStats(name: string, stats: any) {
      const accuracy = stats.total > 0 ? (stats.correct / stats.total * 100).toFixed(1) : "0.0";
      const avgScore = stats.scores.length > 0 ? (stats.scores.reduce((a: number, b: number) => a + b, 0) / stats.scores.length * 100).toFixed(1) : "0.0";
      
      let badge = "❌";
      if (parseFloat(accuracy) >= 90) badge = "🟢";
      else if (parseFloat(accuracy) >= 75) badge = "🟡";
      else if (parseFloat(accuracy) >= 60) badge = "🟠";
      
      console.log(`${badge} ${name}:`);
      console.log(`   Questions: ${stats.total}`);
      console.log(`   Correct: ${stats.correct}/${stats.total}`);
      console.log(`   Accuracy: ${accuracy}%`);
      console.log(`   Avg Similarity: ${avgScore}%`);
      console.log();
    }
    
    printStats("EASY Questions", results.easy);
    printStats("MEDIUM Questions", results.medium);
    printStats("HARD Questions", results.hard);
    printStats("OVERALL Performance", results.overall);
    
    // Performance analysis
    const overallAccuracy = parseFloat((results.overall.correct / results.overall.total * 100).toFixed(1));
    
    console.log("🎯 === PERFORMANCE ANALYSIS ===\n");
    
    if (overallAccuracy >= 90) {
      console.log("🎉 EXCELLENT! Target achieved: 90%+ accuracy");
      console.log("   ✅ System is production-ready for general use");
      console.log("   ✅ Can confidently test with new sources");
    } else if (overallAccuracy >= 80) {
      console.log("🟡 GOOD! Close to target: 80-90% accuracy");
      console.log("   ⚠️  Review failing questions for patterns");
      console.log("   💡 Minor improvements needed before new sources");
    } else {
      console.log("🟠 NEEDS IMPROVEMENT: <80% accuracy");
      console.log("   ❌ Investigate failing questions");
      console.log("   ❌ Review system prompt or chunking strategy");
    }
    
    console.log("\n💡 === NEXT STEPS ===\n");
    
    if (overallAccuracy >= 90) {
      console.log("1. ✅ Test with new knowledge base sources");
      console.log("2. ✅ Deploy to production environment");
      console.log("3. ✅ Monitor real-world performance");
    } else {
      console.log("1. 🔍 Analyze failing questions");
      console.log("2. 🔧 Refine system prompt if needed");
      console.log("3. 🧪 Re-run this test after improvements");
    }
    
  } catch (error) {
    console.error("\n❌ Test failed:", error instanceof Error ? error.message : String(error));
  }
}

runComprehensiveTest().catch(console.error);
