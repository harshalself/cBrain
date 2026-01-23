import axios from "axios";
import * as dotenv from "dotenv";

dotenv.config();

const API_BASE_URL = "http://localhost:8000/api/v1";
const TEST_USER = { email: "harshal@gmail.com", password: "harshal2004" };
const TEST_AGENT_ID = 7;

const api = axios.create({ baseURL: API_BASE_URL, timeout: 60000, validateStatus: () => true });

async function testPartnershipsQuestion() {
  const loginResponse = await api.post("/users/login", TEST_USER);
  api.defaults.headers.common['Authorization'] = `Bearer ${loginResponse.data.data.token}`;
  
  const question = "What are QuantumForge's strategic partnerships with universities and corporations?";
  console.log("Testing:", question, "\n");
  
  const vectorResponse = await api.post("/vectors/search", {
    query: question,
    agentId: TEST_AGENT_ID
  });
  
  const results = vectorResponse.data.data || [];
  console.log(`Vector results: ${results.length}\n`);
  
  const allText = results.map((r: any) => r.text).join("\n\n");
  
  const keywords = ["MIT", "Stanford", "PharmaCorp", "Department of Defense", "strategic", "partnership"];
  keywords.forEach(kw => {
    const found = allText.includes(kw);
    console.log(`${found ? '✅' : '❌'} "${kw}"`);
  });
  
  console.log("\nALL 10 results:");
  results.forEach((r: any, i: number) => {
    const hasMIT = r.text?.includes("MIT");
    const hasStanford = r.text?.includes("Stanford");
    const hasPharmaCorp = r.text?.includes("PharmaCorp");
    const hasDefense = r.text?.includes("Department of Defense");
    
    console.log(`\n${i + 1}. Score: ${r.score?.toFixed(4)} ${hasMIT ? '[MIT]' : ''} ${hasStanford ? '[Stanford]' : ''} ${hasPharmaCorp ? '[PharmaCorp]' : ''} ${hasDefense ? '[DoD]' : ''}`);
    console.log(`Text: ${r.text?.substring(0, 200)}...`);
  });
}

testPartnershipsQuestion().catch(console.error);
