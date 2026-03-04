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

// Extracted from sample_data/it_support_guide.txt
const TEST_CASES: TestCase[] = [
    { question: "How do I connect to the company VPN?", expectedKeywords: ["Cisco AnyConnect", "vpn.cbrain.internal", "Duo 2FA"] },
    { question: "What is the process for resetting my Okta password?", expectedKeywords: ["okta.cbrain.com", "Forgot password", "ext. 5555"] },
    { question: "How do I request a license for new software?", expectedKeywords: ["Jira Service Desk", "manager must approve"] },
    { question: "I received a suspicious email. How do I report a phishing attempt?", expectedKeywords: ["Report Phishing", "Infosec"] },
    { question: "How do I connect to the guest Wi-Fi network?", expectedKeywords: ["cBrain-Guest", "Monday", "cBrain-Secure"] },
    { question: "My company laptop is broken or lost. What should I do?", expectedKeywords: ["security@cbrain.com", "Jira ticket", "IT Walk-up"] },
    { question: "How often must I change my main computer password?", expectedKeywords: ["90 days", "14 days"] },
    { question: "Are USB flash drives allowed on company computers?", expectedKeywords: ["No", "blocked", "endpoint security"] },
    { question: "How do I set up my email on my personal mobile phone?", expectedKeywords: ["Microsoft Intune Company Portal", "Outlook app"] },
    { question: "What is our standard laptop hardware for new hires?", expectedKeywords: ["14-inch MacBook Pro", "Dell Latitude"] },
    { question: "I need an external monitor or keyboard for my home office. How do I get one?", expectedKeywords: ["IT Procurement catalog", "cost center"] },
    { question: "How do I gain access to a specific shared Google Drive or SharePoint folder?", expectedKeywords: ["data owner", "Jira Service Desk"] },
    { question: "Is it okay to use ChatGPT or other AI tools for my work?", expectedKeywords: ["enterprise-approved", "public AI models"] },
    { question: "How do I request admin rights on my local machine?", expectedKeywords: ["Make Me Admin", "30 minutes"] },
    { question: "What do I do if my duo push authentication stops working?", expectedKeywords: ["IT Helpdesk", "bypass code"] },
    { question: "How do I access standard company templates for PowerPoint/Word?", expectedKeywords: ["Company Resources", "Templates"] },
    { question: "Why is my account locked out?", expectedKeywords: ["15 minutes", "5 failed"] },
    { question: "How do properly dispose of confidential printed documents?", expectedKeywords: ["Shred-It bins", "printers"] },
    { question: "How do I order a privacy screen for my laptop?", expectedKeywords: ["3M magnetic privacy screen", "Jira Service Desk"] },
    { question: "What should I do if I think my computer has a virus?", expectedKeywords: ["Disconnect", "ext. 9111", "quarantine"] },
    { question: "Can I use personal headphones or Bluetooth devices?", expectedKeywords: ["Yes", "untrusted"] },
    { question: "How do I setup an out-of-office auto-reply?", expectedKeywords: ["Outlook desktop client", "Outlook Web App"] },
    { question: "How do I request a new distribution list or shared inbox?", expectedKeywords: ["manager approval", "Jira Service Desk"] },
    { question: "Is split-tunneling allowed on the VPN?", expectedKeywords: ["disabled", "corporate firewall"] },
    { question: "How do I securely share large files with an external client?", expectedKeywords: ["Egnyte", "Dropbox", "WeTransfer"] }
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
