/**
 * Standalone Agent Training Script
 *
 * Trains an agent directly — bypasses BullMQ entirely.
 * Uses intfloat/multilingual-e5-large via HF router (confirmed working, 1024 dims).
 *
 * Usage:
 *   npx tsx scripts/train-agent.ts --agentId=<ID>
 */

import dotenv from 'dotenv';
dotenv.config();

import DB from '../database/index.schema';
import axios from 'axios';
import { Pinecone } from '@pinecone-database/pinecone';

// ─── CLI Args ─────────────────────────────────────────────────────────────────

const args = process.argv.slice(2);
const agentIdArg = args.find(a => a.startsWith('--agentId='));
if (!agentIdArg) {
    console.error('❌  Usage: npx tsx scripts/train-agent.ts --agentId=<ID>');
    process.exit(1);
}
const AGENT_ID = parseInt(agentIdArg.split('=')[1]);

// ─── Config ───────────────────────────────────────────────────────────────────

const HF_TOKEN = process.env.HUGGINGFACE_TOKEN!;
// multilingual-e5-large: confirmed working on HF router, 1024 dims (same as bge-m3)
// bge-m3 is broken on HF free tier — this is a drop-in replacement
const HF_MODEL = 'intfloat/multilingual-e5-large';
const HF_URL = `https://router.huggingface.co/hf-inference/models/${HF_MODEL}`;
const BATCH_SIZE = 8;       // Texts per HF request
const HF_TIMEOUT = 90_000;  // 90 seconds per request
const HF_RETRIES = 3;
const CHUNK_MAX = 800;     // Characters per chunk

const PINECONE_API_KEY = process.env.PINECONE_API_KEY!;
const PINECONE_INDEX = process.env.PINECONE_INDEX_NAME || 'cbrain';

// ─── Helpers ──────────────────────────────────────────────────────────────────

const log = (msg: string) => console.log(`[${new Date().toLocaleTimeString()}] ${msg}`);
const sleep = (ms: number) => new Promise<void>(r => setTimeout(r, ms));

// ─── Step 1: Load Sources ─────────────────────────────────────────────────────

async function loadSources(agentId: number) {
    const agent = await DB('agents').where({ id: agentId, is_deleted: false }).first();
    if (!agent) { console.error(`❌  Agent ${agentId} not found`); process.exit(1); }

    log(`👤  Agent: ${agent.name} (id=${agent.id}, user_id=${agent.user_id})`);
    log(`    Status: ${agent.training_status}`);

    const sources = await DB('sources')
        .where({ agent_id: agentId, is_deleted: false, is_embedded: false })
        .whereIn('status', ['pending', 'completed'])
        .select('id', 'name', 'source_type', 'status');

    log(`📂  Found ${sources.length} sources to embed`);
    if (sources.length === 0) {
        log('ℹ️   Nothing to do — all sources already embedded');
        process.exit(0);
    }

    const result: Array<{ sourceId: number; name: string; text: string }> = [];

    for (const source of sources) {
        if (source.source_type !== 'file') {
            log(`⚠️   Skip non-file: ${source.name}`);
            continue;
        }
        const fileSource = await DB('file_sources')
            .where({ source_id: source.id })
            .select('text_content')
            .first();

        if (!fileSource?.text_content?.trim()) {
            log(`⚠️   No text for source: ${source.name} — skipping`);
            continue;
        }
        log(`    ✅  Loaded: ${source.name} (${fileSource.text_content.length} chars)`);
        result.push({ sourceId: source.id, name: source.name, text: fileSource.text_content.trim() });
    }

    return { agent, sources: result };
}

// ─── Step 2: Chunk Text ───────────────────────────────────────────────────────

function chunkText(text: string, sourceName: string, sourceId: number) {
    const paragraphs = text.split(/\n{2,}/).map(p => p.trim()).filter(p => p.length > 30);
    const chunks: string[] = [];
    let current = '';

    for (const para of paragraphs) {
        if ((current + '\n\n' + para).length > CHUNK_MAX && current.length > 0) {
            chunks.push(current.trim());
            current = para;
        } else {
            current = current ? current + '\n\n' + para : para;
        }
    }
    if (current.trim()) chunks.push(current.trim());

    const finalChunks: string[] = [];
    for (const chunk of chunks) {
        if (chunk.length <= CHUNK_MAX) {
            finalChunks.push(chunk);
        } else {
            const sentences = chunk.match(/[^.!?]+[.!?]+/g) || [chunk];
            let part = '';
            for (const s of sentences) {
                if ((part + ' ' + s).length > CHUNK_MAX && part.length > 0) {
                    finalChunks.push(part.trim());
                    part = s;
                } else {
                    part = part ? part + ' ' + s : s;
                }
            }
            if (part.trim()) finalChunks.push(part.trim());
        }
    }

    log(`    ✂️   Chunked "${sourceName}": ${finalChunks.length} chunks`);
    return finalChunks.map((text, i) => ({
        id: `${sourceId}_chunk_${i}`,
        text,
        sourceId,
        chunkIndex: i,
        totalChunks: finalChunks.length,
    }));
}

// ─── Step 3: HuggingFace Embedding ───────────────────────────────────────────

async function embedBatch(texts: string[], attempt = 1): Promise<number[][]> {
    try {
        log(`    🤗  HF embed ${texts.length} texts (attempt ${attempt}/${HF_RETRIES})...`);

        const response = await axios.post(
            HF_URL,
            { inputs: texts, options: { wait_for_model: true } },
            {
                headers: { Authorization: `Bearer ${HF_TOKEN}`, 'Content-Type': 'application/json' },
                timeout: HF_TIMEOUT,
            }
        );

        const data: any[] = response.data;
        if (!Array.isArray(data)) throw new Error(`Unexpected response: ${typeof data}`);

        // Handle token-level (mean pool) or sentence-level embeddings
        const embeddings = data.map((item: any) => {
            if (!Array.isArray(item)) throw new Error('Invalid embedding item');
            if (Array.isArray(item[0])) {
                const dims = item[0].length;
                const avg = new Array(dims).fill(0);
                for (const vec of item) for (let i = 0; i < dims; i++) avg[i] += (vec[i] as number);
                return avg.map(v => v / item.length);
            }
            return item as number[];
        });

        log(`    ✅  ${embeddings.length} embeddings @ ${embeddings[0]?.length} dims`);
        return embeddings;

    } catch (err: any) {
        const isLoading = err?.response?.status === 503;
        const isTimeout = err?.code === 'ECONNABORTED';
        const msg = err?.response?.data?.error || err.message;

        if (isLoading) {
            log(`    ⏳  Model loading — waiting 30s...`);
            await sleep(30_000);
        } else if (isTimeout) {
            log(`    ⏰  Timeout — retrying`);
            await sleep(5_000);
        } else {
            log(`    ⚠️   HF error: ${msg}`);
            await sleep(3_000 * attempt);
        }

        if (attempt < HF_RETRIES) return embedBatch(texts, attempt + 1);
        throw new Error(`Embedding failed after ${HF_RETRIES} attempts: ${msg}`);
    }
}

async function embedAll(chunks: Array<{ id: string; text: string }>): Promise<number[][]> {
    const results: number[][] = [];
    const batches: typeof chunks[] = [];
    for (let i = 0; i < chunks.length; i += BATCH_SIZE) batches.push(chunks.slice(i, i + BATCH_SIZE));

    log(`\n🔢  Embedding ${chunks.length} chunks in ${batches.length} batches...`);

    for (let i = 0; i < batches.length; i++) {
        log(`\n  📦  Batch ${i + 1}/${batches.length}`);
        // multilingual-e5 requires 'passage:' prefix for stored documents
        const embeddings = await embedBatch(batches[i].map(c => `passage: ${c.text}`));
        results.push(...embeddings);
        if (i < batches.length - 1) await sleep(500);
    }
    return results;
}

// ─── Step 4: Upsert to Pinecone ───────────────────────────────────────────────

async function upsertToPinecone(
    agentId: number, userId: number,
    chunks: ReturnType<typeof chunkText>,
    embeddings: number[][]
) {
    const namespace = `user_${userId}_agent_${agentId}`;
    log(`\n📌  Upserting ${chunks.length} vectors → namespace: ${namespace}`);

    const pinecone = new Pinecone({ apiKey: PINECONE_API_KEY });
    const index = pinecone.index(PINECONE_INDEX).namespace(namespace);

    const vectors = chunks.map((chunk, i) => ({
        id: chunk.id,
        values: embeddings[i],
        metadata: {
            text: chunk.text.slice(0, 1000),
            sourceId: chunk.sourceId,
            chunkIndex: chunk.chunkIndex,
            totalChunks: chunk.totalChunks,
            agentId,
        },
    }));

    for (let i = 0; i < vectors.length; i += 100) {
        await index.upsert(vectors.slice(i, i + 100));
        log(`    ✅  Upserted ${Math.min(i + 100, vectors.length)}/${vectors.length}`);
    }

    log(`✅  Done — namespace '${namespace}'`);
}

// ─── Step 5: Update DB ────────────────────────────────────────────────────────

async function markComplete(agentId: number, sourceIds: number[]) {
    log('\n💾  Finalizing database...');
    await DB('sources')
        .whereIn('id', sourceIds)
        .update({ is_embedded: true, status: 'completed', updated_at: new Date() });

    await DB('agents').where({ id: agentId }).update({
        training_status: 'completed',
        training_progress: 100,
        training_error: null,
        embedded_sources_count: sourceIds.length,
        total_sources_count: sourceIds.length,
        trained_on: new Date(),
        updated_at: new Date(),
    });
    log('    ✅  Agent → completed 100%');
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
    console.log('\n' + '═'.repeat(60));
    console.log('  🚀  STANDALONE AGENT TRAINER');
    console.log(`  Agent ID   : ${AGENT_ID}`);
    console.log(`  HF Model   : ${HF_MODEL}`);
    console.log(`  Batch Size : ${BATCH_SIZE} | Timeout: ${HF_TIMEOUT / 1000}s`);
    console.log('═'.repeat(60) + '\n');

    try {
        const { agent, sources } = await loadSources(AGENT_ID);

        log('\n✂️   Chunking sources...');
        const allChunks: ReturnType<typeof chunkText> = [];
        for (const src of sources) {
            allChunks.push(...chunkText(src.text, src.name, src.sourceId));
        }
        log(`\n📊  Total: ${allChunks.length} chunks from ${sources.length} sources`);

        await DB('agents').where({ id: AGENT_ID }).update({
            training_status: 'in-progress', training_progress: 10,
            training_error: null, total_sources_count: sources.length,
            embedded_sources_count: 0, updated_at: new Date(),
        });

        const embeddings = await embedAll(allChunks);
        await DB('agents').where({ id: AGENT_ID }).update({ training_progress: 70 });

        await upsertToPinecone(AGENT_ID, agent.user_id, allChunks, embeddings);
        await DB('agents').where({ id: AGENT_ID }).update({ training_progress: 95 });

        const sourceIds = [...new Set(allChunks.map(c => c.sourceId))];
        await markComplete(AGENT_ID, sourceIds);

        console.log('\n' + '═'.repeat(60));
        console.log(`  🎉  TRAINING COMPLETE!`);
        console.log(`  Sources embedded : ${sourceIds.length}`);
        console.log(`  Vectors upserted : ${allChunks.length}`);
        console.log('═'.repeat(60) + '\n');
        process.exit(0);

    } catch (err: any) {
        console.error('\n❌  Training failed:', err.message || err);
        try {
            await DB('agents').where({ id: AGENT_ID }).update({
                training_status: 'failed', training_error: err.message, updated_at: new Date(),
            });
        } catch (_) { }
        process.exit(1);
    }
}

main();
