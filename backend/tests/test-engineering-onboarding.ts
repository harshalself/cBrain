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

// Extracted from sample_data/engineering_onboarding.txt
const TEST_CASES: TestCase[] = [
    {
        question: "What is our Git branching strategy?",
        expectedKeywords: ["trunk-based", "main", "feat", "fix", "review"]
    },
    {
        question: "When are the standard production deployment windows?",
        expectedKeywords: ["continuously", "Tuesdays", "Thursdays", "2:00 AM", "4:00 AM UTC", "SRE"]
    },
    {
        question: "How do I access the staging database?",
        expectedKeywords: ["VPN", "staging.env", "DBeaver", "pgAdmin", "cloned", "Sunday"]
    },
    {
        question: "How do we handle hotfixes?",
        expectedKeywords: ["hotfix", "bypass", "Principal Engineer", "GitHub Actions"]
    },
    {
        question: "What are the backend coding standards?",
        expectedKeywords: ["Airbnb", "ESLint", "Jest", "80%", "Swagger", "OpenAPI"]
    },
    {
        question: "How do I request elevated AWS permissions?",
        expectedKeywords: ["PR", "infrastructure-as-code", "iam-requests.yml", "okta"]
    },
    {
        question: "What is our tech stack?",
        expectedKeywords: ["React", "TypeScript", "Node.js", "Express", "PostgreSQL", "Redis", "AWS", "ECS Fargate"]
    },
    {
        question: "How do I access logs for production services?",
        expectedKeywords: ["Datadog", "Okta", "env:prod"]
    },
    {
        question: "What is the process for updating an npm dependency?",
        expectedKeywords: ["PR", "package.json", "package-lock.json", "CI", "--force"]
    },
    {
        question: "How do I get access to the GitHub organization?",
        expectedKeywords: ["IT ticket", "invitation"]
    },
    {
        question: "Where can I find our CI/CD pipeline definitions?",
        expectedKeywords: ["GitHub Actions", ".github/workflows", "deploy.yml"]
    },
    {
        question: "How are database schema changes managed?",
        expectedKeywords: ["Knex.js", "migrations", "migrate:make", "up", "down"]
    },
    {
        question: "How do I run the project locally?",
        expectedKeywords: ["npm install", "docker:up", "npm run dev"]
    },
    {
        question: "What is the required code coverage percentage?",
        expectedKeywords: ["80%", "statement", "branch"]
    },
    {
        question: "How do I trigger a manual deployment to staging?",
        expectedKeywords: ["Actions tab", "Deploy to Staging"]
    },
    {
        question: "What is the policy on embedding secrets in code?",
        expectedKeywords: ["NEVER", "environment variables", "AWS Secrets Manager"]
    },
    {
        question: "How do I format code before pushing?",
        expectedKeywords: ["Prettier", "npm run format", "Husky"]
    },
    {
        question: "How do I report a security vulnerability in our codebase?",
        expectedKeywords: ["Infosec", "#security-triage", "email"]
    },
    {
        question: "Where is our REST API documentation?",
        expectedKeywords: ["Swagger UI", "staging.api.cbrain.com/docs", "api.cbrain.com/docs"]
    },
    {
        question: "How are feature flags managed?",
        expectedKeywords: ["LaunchDarkly", "boolean flag"]
    },
    {
        question: "Can I use open-source libraries with GPL licenses?",
        expectedKeywords: ["No", "GPL", "AGPL", "MIT", "Apache 2.0", "BSD"]
    },
    {
        question: "How do I resolve a Node OOM (Out of Memory) error locally?",
        expectedKeywords: ["heap out of memory", "--max-old-space-size=4096"]
    },
    {
        question: "What is the policy for creating new microservices?",
        expectedKeywords: ["RFC", "Architecture Review Board", "monolithic"]
    },
    {
        question: "Where do I store technical design documents (TDDs)??",
        expectedKeywords: ["Markdown", "docs/architecture"]
    },
    {
        question: "How do I handle scheduled cron jobs?",
        expectedKeywords: ["AWS EventBridge", "ECS tasks", "setInterval"]
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
        console.log("Response data:", JSON.stringify(response.data, null, 2));
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
    console.log(`Preparing to test ${TEST_CASES.length} questions from engineering_onboarding.txt`);

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
                // Some answers might use synonyms or slightly different phrasing
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
