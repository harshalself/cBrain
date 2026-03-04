import axios from "axios";
import * as dotenv from "dotenv";

// Load environment variables
dotenv.config();

const API_BASE_URL = "http://localhost:8000/api/v1";
const TEST_USER = {
    email: "employee@gmail.com",
    password: "12345678",
};

// Interface for test cases
interface TestCase {
    question: string;
    expectedKeywords: string[];
}

// Extracted from sample_data/office_facilities.txt
const TEST_CASES: TestCase[] = [
    { question: "Where do I register my car for the parking garage?", expectedKeywords: ["vehicle registration form", "intranet", "temporary passes"] },
    { question: "What are the building hours and when do I need my keycard?", expectedKeywords: ["7:00 AM to 7:00 PM", "employee badge", "temporary pass"] },
    { question: "How do I book a conference room for a client visit?", expectedKeywords: ["Google Calendar", "Boardroom", "facilities@cbrain.com"] },
    { question: "What is on the cafeteria menu this week?", expectedKeywords: ["2nd floor", "#office-announcements", "Dietary restrictions"] },
    { question: "Are dogs allowed in the office?", expectedKeywords: ["Yes", "HR", "leash", "vaccinations"] },
    { question: "What do I do in case of a fire alarm?", expectedKeywords: ["stairwell", "assembly point", "Floor Warden"] },
    { question: "How do I request an ergonomic chair?", expectedKeywords: ["Jira Service Desk", "Facilities"] },
    { question: "Where are the mother's nursing rooms located?", expectedKeywords: ["4th and 6th floors", "Google Calendar"] },
    { question: "How do I register a visitor/guest?", expectedKeywords: ["Envoy app", "2 hours", "photo ID"] },
    { question: "Where is the lost and found?", expectedKeywords: ["reception desk", "1st floor", "building security"] },
    { question: "How do I submit a maintenance request (e.g., a burnt-out lightbulb or broken desk)?", expectedKeywords: ["fix-it@cbrain.com", "24 hours"] },
    { question: "Where can I park my bicycle?", expectedKeywords: ["P1 level", "storage room"] },
    { question: "Are there showers in the building?", expectedKeywords: ["2nd floor", "gym", "towel"] },
    { question: "How do I get access to the building gym?", expectedKeywords: ["liability waiver", "Facilities", "24 hours"] },
    { question: "What is the policy for eating at my desk?", expectedKeywords: ["permitted", "considerate", "kitchen bins"] },
    { question: "Who handles mail and package deliveries?", expectedKeywords: ["mailroom", "ground floor", "Envoy system"] },
    { question: "Can I use the office printers for personal documents?", expectedKeywords: ["Occasional", "large volumes", "prohibited"] },
    { question: "Where do I put confidential shredding?", expectedKeywords: ["Locked grey Shredding bins", "recycling bins"] },
    { question: "Is smoking or vaping allowed on the premises?", expectedKeywords: ["No", "25 feet away"] },
    { question: "How do I request a standing desk?", expectedKeywords: ["motorized sit-stand", "Facilities ticket"] },
    { question: "Where are the first aid kits located?", expectedKeywords: ["pantry/kitchen", "AED", "elevators"] },
    { question: "What do I do if the office is too hot or cold?", expectedKeywords: ["facilities@cbrain.com", "building engineers"] },
    { question: "How do I book event space for a team offsite?", expectedKeywords: ["Town Hall", "1st floor", "events@cbrain.com"] },
    { question: "Are there quiet zones in the office?", expectedKeywords: ["Library", "5th floor"] },
    { question: "What is the procedure for working on weekends?", expectedKeywords: ["employee badge", "reduced schedule", "security"] }
];

let authToken = "";
let activeAgentId = 0;

// Enhanced axios instance with long timeout for AI generation
const api = axios.create({
    baseURL: API_BASE_URL,
    timeout: 60000,
    validateStatus: () => true,
});

async function loginAndGetToken() {
    console.log("\n🔐 === STEP 1: USER AUTHENTICATION ===");
    const response = await api.post("/users/login", TEST_USER);
    if (response.status !== 200) { throw new Error(`Login failed: ${response.data?.message || "Unknown error"}`); }
    const loginData = response.data?.data || response.data;
    authToken = loginData.accessToken || loginData.token;
    if (!authToken) { throw new Error("No token returned from login!"); }
    console.log(`✅ Login successful as ${TEST_USER.email}`);
    api.defaults.headers.common['Authorization'] = `Bearer ${authToken}`;
    return loginData;
}

async function getActiveAgent() {
    console.log("\n🤖 === STEP 2: FINDING ACTIVE AGENT ===");
    const response = await api.get("/agents/active", { headers: { Authorization: `Bearer ${authToken}` } });
    if (response.status !== 200) { throw new Error(`Failed to fetch active agent: ${response.data?.message}`); }
    const targetAgent = response.data.data;
    if (!targetAgent) { throw new Error(`No active agents found. Please activate an agent first.`); }
    activeAgentId = targetAgent.id;
    console.log("📊 Active Agent Found:");
    console.log(`   ID: ${targetAgent.id}\n   Name: ${targetAgent.name}\n   Model: ${targetAgent.model}`);
    return targetAgent;
}

async function runEvaluation() {
    console.log("\n🧪 === STEP 3: RUNNING CHATBOT EVALUATION ===");
    console.log(`Preparing to test ${TEST_CASES.length} requests from document`);
    let passedCount = 0; let failedCount = 0;
    const failedQuestions: Array<{ q: string, reason: string, missing: string[] }> = [];

    for (let i = 0; i < TEST_CASES.length; i++) {
        const testCase = TEST_CASES[i];
        console.log(`\n---------------------------------------------------------`);
        console.log(`📝 Query [${i + 1}/${TEST_CASES.length}]: "${testCase.question}"`);
        try {
            const sessionResponse = await api.post("/chat/sessions", { agentId: activeAgentId }, { headers: { Authorization: `Bearer ${authToken}` } });
            if (sessionResponse.status !== 201) { console.log(`❌ Failed to create chat session: ${sessionResponse.data?.message}`); failedCount++; continue; }
            const sessionId = sessionResponse.data.data.id;
            const chatResponse = await api.post(`/chat/agents/${activeAgentId}`, { messages: [{ role: "user", content: testCase.question }], sessionId: sessionId.toString() }, { headers: { Authorization: `Bearer ${authToken}` } });

            if (chatResponse.status !== 200) {
                console.log(`❌ Request failed with status code ${chatResponse.status}`);
                failedQuestions.push({ q: testCase.question, reason: `HTTP ${chatResponse.status}: ${chatResponse.data?.message || 'Unknown error'}`, missing: [] });
                failedCount++; continue;
            }

            const answer = chatResponse.data?.data?.message || "";
            const contextLength = chatResponse.data?.data?.contextLength || 0;
            if (contextLength > 0) { console.log(`✅ Context retrieved (${contextLength} chars)`); }
            else { console.log("⚠️ No context retrieved from vector database for this question."); }

            const lowerAnswer = answer.toLowerCase();
            const missingKeywords = testCase.expectedKeywords.filter(kw => !lowerAnswer.includes(kw.toLowerCase()));

            if (missingKeywords.length === 0) { console.log(`✅ Status: PASSED`); passedCount++; }
            else {
                const requiredCount = Math.ceil(testCase.expectedKeywords.length / 2);
                const matchCount = testCase.expectedKeywords.length - missingKeywords.length;
                if (matchCount >= requiredCount) {
                    console.log(`✅ Status: PARTIAL PASS (${matchCount}/${testCase.expectedKeywords.length} keywords found)`);
                    console.log(`   Missing: ${missingKeywords.join(', ')}`); passedCount++;
                } else {
                    console.log(`❌ Status: FAILED`);
                    console.log(`   AI Answer snippet: "${answer.substring(0, 150)}..."`);
                    console.log(`   Missing extremely important keywords: ${missingKeywords.join(', ')}`);
                    failedQuestions.push({ q: testCase.question, reason: `Missing critical information (${matchCount}/${testCase.expectedKeywords.length} keywords matched)`, missing: missingKeywords });
                    failedCount++;
                }
            }
        } catch (error) { console.log(`❌ Unhandled Error: ${error instanceof Error ? error.message : String(error)}`); failedCount++; }
    }
    console.log("\n=========================================================");
    console.log("📊 === EVALUATION SUMMARY REPORT ===");
    console.log("=========================================================");
    console.log(`Total Questions   : ${TEST_CASES.length}\nPassed            : ${passedCount}\nFailed            : ${failedCount}`);
    console.log(`Success Rate      : ${((passedCount / TEST_CASES.length) * 100).toFixed(1)}%`);
    if (failedCount > 0) {
        console.log("\n⚠️ FAILED QUESTIONS ANALYSIS:");
        failedQuestions.forEach((fq, idx) => {
            console.log(`  ${idx + 1}. Q: "${fq.q}"\n     Reason: ${fq.reason}`);
            if (fq.missing.length > 0) { console.log(`     Missing Words: [${fq.missing.join(', ')}]`); }
        });
    }
}

async function runTestScript() {
    try { await loginAndGetToken(); await getActiveAgent(); await runEvaluation(); }
    catch (error) { console.error("❌ Fatal Script Error:\n" + (error instanceof Error ? error.message : String(error))); process.exit(1); }
}

runTestScript();
