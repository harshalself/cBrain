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

// Extracted from sample_data/hr_policy_faq.txt
const TEST_CASES: TestCase[] = [
    {
        question: "How many Paid Time Off (PTO) days do employees get?",
        expectedKeywords: ["20 days", "prorated"]
    },
    {
        question: "What is the company's remote work policy?",
        expectedKeywords: ["hybrid", "3 days", "Tuesday", "Monday", "Friday"]
    },
    {
        question: "Does the company offer a 401(k) match?",
        expectedKeywords: ["Fidelity", "100%", "4%", "immediate"]
    },
    {
        question: "How do I request parental leave?",
        expectedKeywords: ["12 weeks", "Workday", "30 days"]
    },
    {
        question: "When is payday?",
        expectedKeywords: ["15th", "last business day"]
    },
    {
        question: "What is the annual health and wellness stipend?",
        expectedKeywords: ["$500", "Expensify", "December 15th"]
    },
    {
        question: "How many sick days are provided annually?",
        expectedKeywords: ["10 paid", "do not roll over"]
    },
    {
        question: "Can I roll over unused PTO to the next year?",
        expectedKeywords: ["5 days", "forfeited", "December 31st"]
    },
    {
        question: "Does the company cover continuing education or certifications?",
        expectedKeywords: ["$1,500", "Manager approval"]
    },
    {
        question: "What is the bereavement leave policy?",
        expectedKeywords: ["5 days", "immediate family"]
    },
    {
        question: "Is vision and dental insurance included in the health plan?",
        expectedKeywords: ["vision and dental", "no extra premium", "BlueCross"]
    },
    {
        question: "How do I add my newborn to my health insurance?",
        expectedKeywords: ["30 days", "Workday Benefits"]
    },
    {
        question: "Does the company support visa sponsorships?",
        expectedKeywords: ["H-1B", "engineering", "hr-immigration"]
    },
    {
        question: "How do I sign up for the commuter benefits program?",
        expectedKeywords: ["pre-tax", "Workday", "10th of the month"]
    },
    {
        question: "Are there any employee discounts available?",
        expectedKeywords: ["PerkSpot", "Okta"]
    },
    {
        question: "How does the referral bonus program work?",
        expectedKeywords: ["90 days", "$2,000", "$5,000"]
    },
    {
        question: "What are the core working hours?",
        expectedKeywords: ["10:00 AM", "3:00 PM"]
    },
    {
        question: "Do I get paid time off to vote?",
        expectedKeywords: ["2 hours"]
    },
    {
        question: "Does the company match employee charity donations?",
        expectedKeywords: ["$1,000", "Benevity"]
    },
    {
        question: "How do I access my W-2 tax forms?",
        expectedKeywords: ["ADP", "January 31st"]
    },
    {
        question: "What is the policy for jury duty?",
        expectedKeywords: ["10 days", "paid leave", "jury summons"]
    },
    {
        question: "How are performance reviews conducted?",
        expectedKeywords: ["bi-annually", "June", "December"]
    },
    {
        question: "Can I expense meals when working late?",
        expectedKeywords: ["7:30 PM", "$25", "Expensify"]
    },
    {
        question: "How do I request an ergonomic assessment for my desk?",
        expectedKeywords: ["Jira Service Desk", "HR & Facilities"]
    },
    {
        question: "What is the process for submitting an HR grievance?",
        expectedKeywords: ["HR Business Partner", "1-800-555-0199"]
    }
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

    if (response.status !== 200) {
        throw new Error(`Login failed: ${response.data?.message || "Unknown error"}`);
    }

    const loginData = response.data?.data || response.data;
    authToken = loginData.accessToken || loginData.token;

    if (!authToken) {
        throw new Error("No token returned from login!");
    }

    console.log(`✅ Login successful as ${TEST_USER.email}`);

    // Set default authorization header
    api.defaults.headers.common['Authorization'] = `Bearer ${authToken}`;

    return loginData;
}

async function getActiveAgent() {
    console.log("\n🤖 === STEP 2: FINDING ACTIVE AGENT ===");

    const response = await api.get("/agents/active", {
        headers: { Authorization: `Bearer ${authToken}` }
    });

    if (response.status !== 200) {
        throw new Error(`Failed to fetch active agent: ${response.data?.message}`);
    }

    const targetAgent = response.data.data;

    if (!targetAgent) {
        throw new Error(`No active agents found. Please activate an agent first.`);
    }

    activeAgentId = targetAgent.id;

    console.log("📊 Active Agent Found:");
    console.log(`   ID: ${targetAgent.id}`);
    console.log(`   Name: ${targetAgent.name}`);
    console.log(`   Model: ${targetAgent.model}`);

    return targetAgent;
}

async function runEvaluation() {
    console.log("\n🧪 === STEP 3: RUNNING CHATBOT EVALUATION ===");
    console.log(`Preparing to test ${TEST_CASES.length} requests from hr_policy_faq.txt`);

    let passedCount = 0;
    let failedCount = 0;
    const failedQuestions: Array<{ q: string, reason: string, missing: string[] }> = [];

    for (let i = 0; i < TEST_CASES.length; i++) {
        const testCase = TEST_CASES[i];
        console.log(`\n---------------------------------------------------------`);
        console.log(`📝 Query [${i + 1}/${TEST_CASES.length}]: "${testCase.question}"`);

        try {
            // Create a fresh session for each question to avoid context bleeding
            const sessionResponse = await api.post("/chat/sessions", {
                agentId: activeAgentId
            }, {
                headers: { Authorization: `Bearer ${authToken}` }
            });

            if (sessionResponse.status !== 201) {
                console.log(`❌ Failed to create chat session: ${sessionResponse.data?.message}`);
                failedCount++;
                continue;
            }

            const sessionId = sessionResponse.data.data.id;

            // Send the chat message
            const chatResponse = await api.post(`/chat/agents/${activeAgentId}`, {
                messages: [{ role: "user", content: testCase.question }],
                sessionId: sessionId.toString()
            }, {
                headers: { Authorization: `Bearer ${authToken}` }
            });

            if (chatResponse.status !== 200) {
                console.log(`❌ Request failed with status code ${chatResponse.status}`);
                failedQuestions.push({
                    q: testCase.question,
                    reason: `HTTP ${chatResponse.status}: ${chatResponse.data?.message || 'Unknown error'}`,
                    missing: []
                });
                failedCount++;
                continue;
            }

            const answer = chatResponse.data?.data?.message || "";

            // Log context retrieval status
            const contextLength = chatResponse.data?.data?.contextLength || 0;
            if (contextLength > 0) {
                console.log(`✅ Context retrieved (${contextLength} chars)`);
            } else {
                console.log("⚠️ No context retrieved from vector database for this question.");
            }

            // Check keywords ignoring case
            const lowerAnswer = answer.toLowerCase();
            const missingKeywords = testCase.expectedKeywords.filter(
                kw => !lowerAnswer.includes(kw.toLowerCase())
            );

            if (missingKeywords.length === 0) {
                console.log(`✅ Status: PASSED`);
                passedCount++;
            } else {
                // If more than 50% of expected words are missing, consider it a fail
                const requiredCount = Math.ceil(testCase.expectedKeywords.length / 2);
                const matchCount = testCase.expectedKeywords.length - missingKeywords.length;

                if (matchCount >= requiredCount) {
                    console.log(`✅ Status: PARTIAL PASS (${matchCount}/${testCase.expectedKeywords.length} keywords found)`);
                    console.log(`   Missing: ${missingKeywords.join(', ')}`);
                    passedCount++;
                } else {
                    console.log(`❌ Status: FAILED`);
                    console.log(`   AI Answer snippet: "${answer.substring(0, 150)}..."`);
                    console.log(`   Missing extremely important keywords: ${missingKeywords.join(', ')}`);
                    failedQuestions.push({
                        q: testCase.question,
                        reason: `Missing critical information (${matchCount}/${testCase.expectedKeywords.length} keywords matched)`,
                        missing: missingKeywords
                    });
                    failedCount++;
                }
            }

        } catch (error) {
            console.log(`❌ Unhandled Error: ${error instanceof Error ? error.message : String(error)}`);
            failedCount++;
        }
    }

    // Final Report
    console.log("\n=========================================================");
    console.log("📊 === EVALUATION SUMMARY REPORT ===");
    console.log("=========================================================");
    console.log(`Total Questions   : ${TEST_CASES.length}`);
    console.log(`Passed            : ${passedCount}`);
    console.log(`Failed            : ${failedCount}`);

    const successRate = ((passedCount / TEST_CASES.length) * 100).toFixed(1);
    console.log(`Success Rate      : ${successRate}%`);

    if (failedCount > 0) {
        console.log("\n⚠️ FAILED QUESTIONS ANALYSIS:");
        failedQuestions.forEach((fq, idx) => {
            console.log(`  ${idx + 1}. Q: "${fq.q}"`);
            console.log(`     Reason: ${fq.reason}`);
            if (fq.missing.length > 0) {
                console.log(`     Missing Words: [${fq.missing.join(', ')}]`);
            }
        });
    }
}

async function runTestScript() {
    try {
        await loginAndGetToken();
        await getActiveAgent();
        await runEvaluation();
    } catch (error) {
        console.error("❌ Fatal Script Error:");
        console.error(error instanceof Error ? error.message : String(error));
        process.exit(1);
    }
}

// Run tests
runTestScript();
