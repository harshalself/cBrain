/**
 * ============================================================
 * Training E2E Integration Test — Agent 1 (HR) on Medikos Doc
 * ============================================================
 *
 * What this test does:
 *  1. Login as admin@gmail.com
 *  2. Verify Document "Research_Paper___Medikos" exists in the Knowledge Base
 *  3. Sync/Link the document to Agent 1 (HR)
 *  4. Initiate training via POST /agents/1/train
 *  5. Poll training status every 5s until completed or failed (max 3 min)
 *  6. Verify DB state: sources.is_embedded=true, file_sources.text_content populated
 *  7. Run a vector search to confirm vectors now exist in Pinecone for agent 1
 *  8. Ask the chatbot: "Give me a list of uploaded documents"
 *  9. Print a final summary with PASS/FAIL for every step
 *
 * Run with:
 *   cd backend
 *   npx ts-node tests/test-training-e2e.ts
 */

import axios, { AxiosInstance } from "axios";

/* ──────────────────────────────────────────────────────────── */
/*  CONFIG                                                       */
/* ──────────────────────────────────────────────────────────── */
const BASE_URL = "http://localhost:8000/api/v1";
const CREDENTIALS = { email: "admin@gmail.com", password: "12345678" };
const TARGET_AGENT_ID = 1;
const TARGET_DOC_NAME = "Research_Paper___Medikos"; // partial match is fine
const POLL_INTERVAL_MS = 5_000;
const MAX_POLL_ATTEMPTS = 36; // 36 × 5s = 3 minutes max

/* ──────────────────────────────────────────────────────────── */
/*  COLOUR HELPERS                                               */
/* ──────────────────────────────────────────────────────────── */
const c = {
    reset: "\x1b[0m",
    bold: "\x1b[1m",
    green: "\x1b[32m",
    red: "\x1b[31m",
    yellow: "\x1b[33m",
    blue: "\x1b[34m",
    cyan: "\x1b[36m",
};

function logSection(title: string) {
    console.log(`\n${c.blue}${"═".repeat(62)}${c.reset}`);
    console.log(`${c.bold}${c.blue}  ${title}${c.reset}`);
    console.log(`${c.blue}${"═".repeat(62)}${c.reset}`);
}

function ok(msg: string, data?: any) {
    console.log(`  ${c.green}✅ ${msg}${c.reset}`);
    if (data !== undefined) console.log(`     ${JSON.stringify(data, null, 2)}`);
}

function fail(msg: string, data?: any) {
    console.log(`  ${c.red}❌ ${msg}${c.reset}`);
    if (data !== undefined) console.log(`     ${JSON.stringify(data, null, 2)}`);
}

function info(msg: string, data?: any) {
    console.log(`  ${c.cyan}ℹ  ${msg}${c.reset}`);
    if (data !== undefined) console.log(`     ${JSON.stringify(data, null, 2)}`);
}

function warn(msg: string, data?: any) {
    console.log(`  ${c.yellow}⚠  ${msg}${c.reset}`);
    if (data !== undefined) console.log(`     ${JSON.stringify(data, null, 2)}`);
}

/* ──────────────────────────────────────────────────────────── */
/*  RESULT TRACKER                                               */
/* ──────────────────────────────────────────────────────────── */
interface StepResult {
    step: string;
    passed: boolean;
    detail: string;
}

const results: StepResult[] = [];

function record(step: string, passed: boolean, detail: string) {
    results.push({ step, passed, detail });
}

/* ──────────────────────────────────────────────────────────── */
/*  MAIN TEST                                                    */
/* ──────────────────────────────────────────────────────────── */
async function main() {
    console.log(`\n${c.bold}${"█".repeat(62)}${c.reset}`);
    console.log(`${c.bold}  TRAINING E2E TEST — Agent: ${TARGET_AGENT_ID} | Doc: ${TARGET_DOC_NAME}${c.reset}`);
    console.log(`${c.bold}${"█".repeat(62)}${c.reset}`);

    const api: AxiosInstance = axios.create({
        baseURL: BASE_URL,
        timeout: 30_000,
        validateStatus: () => true, // never throw on HTTP errors — we check manually
    });

    let token = "";
    let documentId: number | null = null;
    let sessionId: string | null = null;
    let trainingFinalStatus = "";

    /* ─────────────────────────────────────────────────────────── */
    /*  STEP 1 — AUTHENTICATION                                     */
    /* ─────────────────────────────────────────────────────────── */
    logSection("STEP 1 — Login");
    try {
        const r = await api.post("/users/login", CREDENTIALS);
        // Token is under data.data.accessToken, user info is under data.data.user
        const authData = r.data?.data;
        const tokenValue = authData?.accessToken || authData?.token;
        if (r.status === 200 && tokenValue) {
            token = tokenValue;
            api.defaults.headers.common["Authorization"] = `Bearer ${token}`;
            const user = authData?.user || authData;
            ok(`Logged in — token starts: ${token.substring(0, 25)}...`);
            info(`User ID: ${user?.id} | Role: ${user?.role}`);
            record("Login", true, "Authenticated successfully");
        } else {
            fail("Login failed", r.data);
            record("Login", false, r.data?.message || "Unknown error");
            printSummary();
            return;
        }
    } catch (e: any) {
        fail("Login threw an error", e.message);
        record("Login", false, e.message);
        printSummary();
        return;
    }

    /* ─────────────────────────────────────────────────────────── */
    /*  STEP 2 — VERIFY DOCUMENT EXISTS                            */
    /* ─────────────────────────────────────────────────────────── */
    logSection("STEP 2 — Verify Document in Knowledge Base");
    try {
        const r = await api.get("/documents", { params: { limit: 100 } });
        const docs: any[] = r.data?.data?.documents || r.data?.data || [];

        const medikosDoc = docs.find((d: any) =>
            (d.name || "").toLowerCase().includes("medikos") ||
            (d.original_name || "").toLowerCase().includes("medikos")
        );

        if (medikosDoc) {
            documentId = medikosDoc.id;
            ok(`Document found: "${medikosDoc.name}" (ID: ${documentId})`);
            info(`Status: ${medikosDoc.status} | Size: ${medikosDoc.file_size} bytes | Type: ${medikosDoc.file_type}`);
            record("Document Found", true, `ID: ${documentId}, status: ${medikosDoc.status}`);
        } else {
            warn("Medikos document not found — listing all available documents:");
            docs.slice(0, 10).forEach((d: any) => console.log(`     • [${d.id}] ${d.name} (${d.status})`));
            fail("Cannot proceed without the target document");
            record("Document Found", false, "No document matching 'medikos' found");
            printSummary();
            return;
        }
    } catch (e: any) {
        fail("Error fetching documents", e.message);
        record("Document Found", false, e.message);
        printSummary();
        return;
    }

    /* ─────────────────────────────────────────────────────────── */
    /*  STEP 3 — VERIFY AGENT EXISTS                               */
    /* ─────────────────────────────────────────────────────────── */
    logSection("STEP 3 — Verify Agent 1 (HR)");
    try {
        const r = await api.get(`/agents/${TARGET_AGENT_ID}`);
        if (r.status === 200 && r.data?.data?.id) {
            const agent = r.data.data;
            ok(`Agent found: "${agent.name}" (ID: ${agent.id})`);
            info(`Provider: ${agent.provider} | Model: ${agent.model}`);
            info(`Current training status: ${agent.training_status || "none"}`);
            info(`Embedded sources: ${agent.embedded_sources_count} / ${agent.total_sources_count}`);
            record("Agent Found", true, `name: ${agent.name}, training_status: ${agent.training_status}`);
        } else {
            fail(`Agent ${TARGET_AGENT_ID} not found`, r.data);
            record("Agent Found", false, r.data?.message || "Not found");
            printSummary();
            return;
        }
    } catch (e: any) {
        fail("Error fetching agent", e.message);
        record("Agent Found", false, e.message);
        printSummary();
        return;
    }

    /* ─────────────────────────────────────────────────────────── */
    /*  STEP 4 — INITIATE TRAINING                                 */
    /* ─────────────────────────────────────────────────────────── */
    logSection("STEP 4 — Initiate Training (Document → Agent)");
    try {
        info(`Sending documentIds: [${documentId}] to /agents/${TARGET_AGENT_ID}/train`);
        const r = await api.post(`/agents/${TARGET_AGENT_ID}/train`, {
            documentIds: [documentId],
            forceRetrain: false,
            cleanupExisting: false,
        });

        if (r.status === 200 && r.data?.data?.jobId) {
            ok(`Training job queued — Job ID: ${r.data.data.jobId}`);
            info(`Total sources to embed: ${r.data.data.totalSources}`);
            info(`Namespace: ${r.data.data.namespace}`);
            record("Training Started", true, `jobId: ${r.data.data.jobId}, totalSources: ${r.data.data.totalSources}`);
        } else {
            fail(`Training initiation failed (HTTP ${r.status})`, r.data);
            record("Training Started", false, r.data?.message || `HTTP ${r.status}`);
            // Don't stop — try to poll status anyway
        }
    } catch (e: any) {
        fail("Training request threw an error", e.message);
        record("Training Started", false, e.message);
    }

    /* ─────────────────────────────────────────────────────────── */
    /*  STEP 5 — POLL TRAINING STATUS                              */
    /* ─────────────────────────────────────────────────────────── */
    logSection("STEP 5 — Poll Training Status (max 3 min)");
    info(`Polling every ${POLL_INTERVAL_MS / 1000}s ...`);

    let pollAttempts = 0;
    let trainingCompleted = false;
    let finalStatus: any = null;

    while (pollAttempts < MAX_POLL_ATTEMPTS) {
        await sleep(POLL_INTERVAL_MS);
        pollAttempts++;

        try {
            const r = await api.get(`/agents/${TARGET_AGENT_ID}/training-status`);
            const data = r.data?.data;

            if (!data) {
                warn(`Poll #${pollAttempts}: No data returned`);
                continue;
            }

            const status: string = data.status || data.training_status || "unknown";
            const progress: number = data.progress ?? data.training_progress ?? 0;
            const embedded: number = data.sources?.embedded ?? data.embedded_sources_count ?? 0;
            const total: number = data.sources?.total ?? data.total_sources_count ?? 0;
            const vectors: number = data.metrics?.vectorCount ?? 0;

            console.log(
                `  ${c.yellow}⏳ Poll #${pollAttempts.toString().padStart(2, "0")}${c.reset}` +
                ` | Status: ${c.bold}${status}${c.reset}` +
                ` | Progress: ${progress}%` +
                ` | Embedded: ${embedded}/${total}` +
                ` | Vectors: ${vectors}`
            );

            trainingFinalStatus = status;
            finalStatus = data;

            if (status === "completed") {
                trainingCompleted = true;
                ok(`Training COMPLETED after ${pollAttempts * POLL_INTERVAL_MS / 1000}s`);
                info(`Embedded sources: ${embedded} / ${total}`);
                info(`Vector count in Pinecone: ${vectors}`);

                const embeddingOk = embedded > 0;
                const vectorOk = vectors > 0;
                record("Training Completed", true, `embedded: ${embedded}, vectors: ${vectors}`);
                record("Embedding Count > 0", embeddingOk, `embedded_sources_count = ${embedded}`);
                record("Vector Count > 0", vectorOk, `vectorCount from Pinecone = ${vectors}`);
                break;
            }

            if (status === "failed") {
                fail(`Training FAILED: ${data.error?.message || "unknown error"}`);
                record("Training Completed", false, `Training failed: ${data.error?.message || "unknown error"}`);
                break;
            }
        } catch (e: any) {
            warn(`Poll #${pollAttempts}: Error — ${e.message}`);
        }
    }

    if (!trainingCompleted && trainingFinalStatus !== "failed") {
        warn("Training did not complete within the 3-minute window");
        record("Training Completed", false, "Timed out after 3 minutes");
    }

    /* ─────────────────────────────────────────────────────────── */
    /*  STEP 6 — VERIFY DB STATE VIA TRAINING-STATUS API          */
    /* ─────────────────────────────────────────────────────────── */
    logSection("STEP 6 — Verify Database State (via training-status API)");
    try {
        const r = await api.get(`/agents/${TARGET_AGENT_ID}/training-status`);
        const data = r.data?.data;
        if (!data) {
            fail("No data returned from training-status");
            record("DB Verification", false, "No data from API");
        } else {
            const embedded = data.sources?.embedded ?? data.embedded_sources_count ?? 0;
            const total = data.sources?.total ?? data.total_sources_count ?? 0;
            const sourceDetails: any[] = data.sources?.details || [];
            const embeddedSources = sourceDetails.filter((s: any) => s.isEmbedded === true || s.is_embedded === true);

            ok(`DB Check: embedded_sources_count = ${embedded}`);
            ok(`DB Check: total_sources_count = ${total}`);

            if (embeddedSources.length > 0) {
                ok(`${embeddedSources.length} source(s) have is_embedded=true in the DB`);
                embeddedSources.forEach((s: any) => info(`  Source: "${s.name}" | status: ${s.status}`));
            } else {
                warn("No sources show is_embedded=true via the API yet — check backend logs for extraction");
            }

            record("DB Embedded Sources", embedded > 0, `embedded: ${embedded}/${total}`);
        }
    } catch (e: any) {
        fail("Error verifying DB state", e.message);
        record("DB Verification", false, e.message);
    }

    /* ─────────────────────────────────────────────────────────── */
    /*  STEP 7 — VECTOR SEARCH SANITY CHECK                       */
    /* ─────────────────────────────────────────────────────────── */
    logSection("STEP 7 — Vector Search Sanity Check (Pinecone)");
    try {
        const searchQueries = [
            "Medikos research findings",
            "document summary",
            "study results",
        ];

        let anySuccess = false;
        for (const query of searchQueries) {
            const r = await api.post("/vectors/search", {
                query,
                agentId: TARGET_AGENT_ID,
            });

            const hits: any[] = r.data?.data || [];
            if (hits.length > 0) {
                anySuccess = true;
                ok(`Query "${query}" → ${hits.length} vector hits (top score: ${hits[0]?.score?.toFixed(4)})`);
                if (hits[0]?.text) {
                    info(`Top hit preview: "${String(hits[0].text).substring(0, 120)}..."`);
                }
            } else {
                warn(`Query "${query}" → 0 hits`);
            }
        }

        record("Vector Search", anySuccess, anySuccess ? "At least one query returned hits" : "All queries returned 0 hits");
    } catch (e: any) {
        fail("Vector search threw an error", e.message);
        record("Vector Search", false, e.message);
    }

    /* ─────────────────────────────────────────────────────────── */
    /*  STEP 8 — CHATBOT QUESTION                                  */
    /* ─────────────────────────────────────────────────────────── */
    logSection("STEP 8 — Chatbot Question: 'Give me a list of uploaded docs'");
    try {
        // First, create a chat session with the active agent
        info("Creating chat session with Agent 1…");
        const sessionR = await api.post("/chat/sessions", {
            agentId: TARGET_AGENT_ID,
        });

        if (sessionR.status === 200 || sessionR.status === 201) {
            sessionId = sessionR.data?.data?.sessionId || sessionR.data?.data?.id;
            info(`Session created: ${sessionId}`);
        } else {
            warn(`Could not create session (HTTP ${sessionR.status}) — trying direct message`);
        }

        // Send the message
        const messageR = await api.post(
            sessionId ? `/chat/sessions/${sessionId}/messages` : `/chat/agents/${TARGET_AGENT_ID}`,
            {
                content: "Give me a list of uploaded documents",
                message: "Give me a list of uploaded documents",
                messages: [{ role: "user", content: "Give me a list of uploaded documents" }],
            }
        );

        if (messageR.status === 200 || messageR.status === 201) {
            const reply =
                messageR.data?.data?.content ||
                messageR.data?.data?.message ||
                messageR.data?.data?.reply ||
                JSON.stringify(messageR.data?.data);
            ok("Chatbot responded:");
            console.log(`\n  ${c.cyan}┌${"─".repeat(58)}┐${c.reset}`);
            String(reply)
                .split("\n")
                .forEach((line) => console.log(`  ${c.cyan}│${c.reset} ${line}`));
            console.log(`  ${c.cyan}└${"─".repeat(58)}┘${c.reset}\n`);

            const mentionsDocs = String(reply).toLowerCase().includes("document") ||
                String(reply).toLowerCase().includes("uploaded") ||
                String(reply).toLowerCase().includes("medikos") ||
                String(reply).toLowerCase().includes("file");

            record("Chatbot Response", true, "Received a response from the chatbot");
            record("Response Mentions Docs", mentionsDocs, mentionsDocs ? "Response references documents/uploads" : "Response doesn't mention documents");
        } else {
            warn(`Chat returned HTTP ${messageR.status}`, messageR.data);
            record("Chatbot Response", false, `HTTP ${messageR.status}: ${messageR.data?.message || "No message"}`);
        }
    } catch (e: any) {
        fail("Chat request failed", e.message);
        record("Chatbot Response", false, e.message);
    }

    /* ─────────────────────────────────────────────────────────── */
    /*  FINAL SUMMARY                                              */
    /* ─────────────────────────────────────────────────────────── */
    printSummary();
}

/* ──────────────────────────────────────────────────────────── */
/*  HELPERS                                                      */
/* ──────────────────────────────────────────────────────────── */
function sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

function printSummary() {
    const passed = results.filter((r) => r.passed).length;
    const total = results.length;
    const allPassed = passed === total;

    console.log(`\n${c.bold}${"█".repeat(62)}${c.reset}`);
    console.log(`${c.bold}  TEST SUMMARY${c.reset}  — ${passed}/${total} checks passed`);
    console.log(`${c.bold}${"█".repeat(62)}${c.reset}`);

    results.forEach((r) => {
        const icon = r.passed ? `${c.green}✅` : `${c.red}❌`;
        const label = r.step.padEnd(28);
        console.log(`  ${icon} ${label}${c.reset}  ${r.detail}`);
    });

    console.log(`\n${allPassed ? c.green : c.red}${c.bold}  ${allPassed ? "🎉 ALL CHECKS PASSED" : "⚠ SOME CHECKS FAILED"}${c.reset}\n`);

    process.exit(allPassed ? 0 : 1);
}

/* ──────────────────────────────────────────────────────────── */
/*  ENTRY POINT                                                  */
/* ──────────────────────────────────────────────────────────── */
main().catch((e) => {
    console.error("\n💥 Unexpected test crash:", e.message);
    process.exit(1);
});
