/**
 * Embedding Latency Diagnostic
 *
 * Compares HuggingFace free-tier vs Pinecone Inference API for query embedding.
 * Then runs a full chat round-trip to confirm end-to-end improvements.
 *
 * Usage: npx ts-node tests/test-embedding-latency.ts
 */

import axios from "axios";
import * as dotenv from "dotenv";
import { Pinecone } from "@pinecone-database/pinecone";

dotenv.config();

const API_BASE_URL = "http://localhost:8000/api/v1";
const TEST_USER = { email: "employee@gmail.com", password: "12345678" };

const C = {
    reset: "\x1b[0m", green: "\x1b[32m", red: "\x1b[31m",
    yellow: "\x1b[33m", cyan: "\x1b[36m", bold: "\x1b[1m",
};
function c(text: string, color: string) { return `${color}${text}${C.reset}`; }
function ms(n: number) { return n < 1000 ? `${n}ms` : `${(n / 1000).toFixed(2)}s`; }

const api = axios.create({ baseURL: API_BASE_URL, timeout: 120_000, validateStatus: () => true });

async function login(): Promise<string> {
    const res = await api.post("/users/login", TEST_USER);
    if (res.status !== 200) throw new Error(`Login failed: ${res.data?.message}`);
    const token = res.data.data.token;
    api.defaults.headers.common["Authorization"] = `Bearer ${token}`;
    return token;
}

async function testHuggingFaceLatency(): Promise<number> {
    const hfToken = process.env.HUGGINGFACE_TOKEN;
    if (!hfToken) { console.log(c("  ⚠️  HUGGINGFACE_TOKEN not set — skipping", C.yellow)); return -1; }

    const start = Date.now();
    try {
        const res = await axios.post(
            "https://router.huggingface.co/hf-inference/models/intfloat/multilingual-e5-large",
            { inputs: ["query: test query"], options: { wait_for_model: true } },
            { headers: { Authorization: `Bearer ${hfToken}`, "Content-Type": "application/json" }, timeout: 90_000 }
        );
        const elapsed = Date.now() - start;
        const ok = res.status === 200 && Array.isArray(res.data) && res.data.length > 0;
        console.log(`  Status : ${ok ? c("200 OK", C.green) : c(`${res.status} ERROR`, C.red)}`);
        console.log(`  Latency: ${ms(elapsed)} ${elapsed > 5000 ? c("🐌 SLOW (cold start / rate limit)", C.red) : c("✅ Fast", C.green)}`);
        return elapsed;
    } catch (err: any) {
        const elapsed = Date.now() - start;
        console.log(c(`  ❌ Failed after ${ms(elapsed)}: ${err.message}`, C.red));
        return elapsed;
    }
}

async function testPineconeInferenceLatency(): Promise<number> {
    const pineconeKey = process.env.PINECONE_API_KEY;
    if (!pineconeKey) { console.log(c("  ⚠️  PINECONE_API_KEY not set — skipping", C.yellow)); return -1; }

    const pc = new Pinecone({ apiKey: pineconeKey });
    const start = Date.now();
    try {
        const result = await pc.inference.embed(
            "multilingual-e5-large",
            ["query: test query"],
            { inputType: "query", truncate: "END" }
        );
        const elapsed = Date.now() - start;
        const resultAny = result as any;
        const dims = resultAny?.[0]?.values?.length || resultAny?.data?.[0]?.values?.length || 0;
        console.log(`  Status : ${dims > 0 ? c(`OK (${dims} dims)`, C.green) : c("ERROR (no embedding)", C.red)}`);
        console.log(`  Latency: ${ms(elapsed)} ${elapsed > 2000 ? c("⚠️ Slower than expected", C.yellow) : c("✅ Fast", C.green)}`);
        return elapsed;
    } catch (err: any) {
        const elapsed = Date.now() - start;
        console.log(c(`  ❌ Failed after ${ms(elapsed)}: ${err.message}`, C.red));
        return elapsed;
    }
}

async function testChatRoundTrip(query: string, label: string): Promise<{ totalMs: number; phase1Ms: string; cached: boolean }> {
    const start = Date.now();
    const res = await api.post("/chat/agents/2", {
        messages: [{ role: "user", content: query }],
    });
    const totalMs = Date.now() - start;
    const data = res.data?.data;
    const phase1Ms = data?.performance?.parallelPhase || "N/A";
    const cached = !!data?.isFromCache;

    console.log(`  ${label}:`);
    if (res.status !== 200) {
        console.log(c(`    ❌ HTTP ${res.status}: ${res.data?.message || "Error"}`, C.red));
    } else {
        console.log(`    Total     : ${ms(totalMs)} ${totalMs > 10000 ? c("🐌", C.red) : totalMs > 5000 ? c("⚠️", C.yellow) : c("✅", C.green)}`);
        console.log(`    Phase1    : ${phase1Ms}`);
        console.log(`    Context   : ${data?.contextLength || 0} chars`);
        console.log(`    Cache     : ${cached ? c("HIT ⚡", C.green) : "MISS"}`);
    }
    return { totalMs, phase1Ms, cached };
}

async function run() {
    console.log(c("\n" + "═".repeat(65), C.bold));
    console.log(c("  🔬 EMBEDDING LATENCY DIAGNOSTIC", C.bold));
    console.log(c("═".repeat(65), C.bold));

    // Phase 1: Direct embedding comparison
    console.log(c("\n── Phase 1: HuggingFace Free-Tier (BEFORE) ──", C.bold));
    const hfMs = await testHuggingFaceLatency();

    console.log(c("\n── Phase 2: Pinecone Inference API (AFTER) ──", C.bold));
    const pcMs = await testPineconeInferenceLatency();

    if (hfMs > 0 && pcMs > 0) {
        const speedup = (hfMs / pcMs).toFixed(1);
        console.log(c(`\n  📊 Pinecone is ${speedup}x faster than HuggingFace free-tier`, C.cyan));
    }

    // Phase 2: Full chat round-trip
    console.log(c("\n── Phase 3: Full Chat Round-trip ──", C.bold));
    await login();

    const q = "What is the leave policy?";
    console.log(`  Query: "${q}"\n`);

    const cold = await testChatRoundTrip(q, "Cold request (1st)");
    const warm = await testChatRoundTrip(q, "Warm request (2nd, should cache)");

    // Summary
    console.log(c("\n" + "═".repeat(65), C.bold));
    console.log(c("  📋 SUMMARY", C.bold));
    console.log(c("═".repeat(65), C.bold));
    console.log(`  HuggingFace embedding     : ${hfMs > 0 ? ms(hfMs) : "skipped"}`);
    console.log(`  Pinecone inference         : ${pcMs > 0 ? ms(pcMs) : "skipped"}`);
    console.log(`  Chat cold request          : ${ms(cold.totalMs)}`);
    console.log(`  Chat warm/cached request   : ${ms(warm.totalMs)} ${warm.cached ? "(CACHED)" : "(NOT CACHED)"}`);

    if (cold.totalMs > 15000) {
        console.log(c("\n  ⚠️  Cold request still slow — check server logs for embedding timing.", C.yellow));
        console.log("  Look for: '🔤 Query embedding via Pinecone inference: XXXms'");
        console.log("  If you don't see that line, the new code isn't active (restart server).");
    } else {
        console.log(c("\n  ✅ Performance looks good!", C.green));
    }
    console.log();
}

run().catch(err => { console.error(c(`💥 ${err.message}`, C.red)); process.exit(1); });
