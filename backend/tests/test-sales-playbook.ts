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

// Extracted from sample_data/sales_playbook.txt
const TEST_CASES: TestCase[] = [
    { question: "What are the current pricing tiers for our Enterprise product?", expectedKeywords: ["Starter", "Professional", "Custom Enterprise", "Volume discounts"] },
    { question: "What constitutes a Sales Qualified Lead (SQL)?", expectedKeywords: ["BANT", "$10k", "6 months"] },
    { question: "How do I log a customer churn risk in Salesforce?", expectedKeywords: ["Salesforce", "CHURN-RISK", "Customer Success Manager"] },
    { question: "What is the commission structure for the current quarter?", expectedKeywords: ["10% base", "5%", "accelerator"] },
    { question: "How do I request a custom product demo environment for a prospect?", expectedKeywords: ["Demo Provisioning", "Solutions Engineering", "3 business days"] },
    { question: "What is the standard SLA for the Professional support tier?", expectedKeywords: ["4-hour", "Severity 1", "24-hour"] },
    { question: "How do I request a discount approval?", expectedKeywords: ["10%", "Director", "CRO", "Salesforce CPQ"] },
    { question: "What is our standard trial period length?", expectedKeywords: ["14-day", "30 days", "Proof of Concept"] },
    { question: "How do I record a sales call?", expectedKeywords: ["Gong", "conversational intelligence", "Zoom/Teams"] },
    { question: "Where do I find the latest pitch deck?", expectedKeywords: ["Highspot", "Core Materials", "outdated messaging"] },
    { question: "Who is our primary competitor and what is our differentiator?", expectedKeywords: ["AcmeCorp", "AI-driven analytics"] },
    { question: "What are the terms for a Multi-Year contract?", expectedKeywords: ["5% discount", "10%", "anti-cancellation"] },
    { question: "How do I handle legal redlines in a contract?", expectedKeywords: ["Ironclad", "#legal-review", "2 business days"] },
    { question: "What is a Proof of Concept (PoC)?", expectedKeywords: ["assisted evaluation", "NDA and PoC Agreement"] },
    { question: "How do I transition a closed-won deal to Customer Success?", expectedKeywords: ["DocuSign", "Closed Won", "Sales to CS Handoff Document"] },
    { question: "What is our policy on gifting to clients?", expectedKeywords: ["Sendoso", "$100"] },
    { question: "How are SDR commission structures set?", expectedKeywords: ["$150", "meeting held"] },
    { question: "How do I request Marketing collateral or case studies?", expectedKeywords: ["Asana Marketing Board", "4 weeks"] },
    { question: "Can we offer net-60 payment terms?", expectedKeywords: ["Net-30", "Net-60", "VP of Finance"] },
    { question: "What happens if a customer churns within the first 6 months?", expectedKeywords: ["clawed back", "subsequent paycheck"] },
    { question: "How do I register a deal for Partner/Channel sales?", expectedKeywords: ["Partner Portal", "Channel Account"] },
    { question: "What is the process for Security Questionnaires?", expectedKeywords: ["Loopio", "80%", "Infosec team"] },
    { question: "How do we handle reference calls?", expectedKeywords: ["Reference Request Form", "Customer Marketing team"] },
    { question: "What are the primary KPIs for Customer Success Managers?", expectedKeywords: ["Gross Retention Rate", "Net Retention Rate", "time-to-first-value"] },
    { question: "Can we accept credit cards for payment?", expectedKeywords: ["Stripe", "$15,000", "ACH or wire transfer"] }
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
