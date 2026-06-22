import { StateGraph, START, END, MemorySaver } from '@langchain/langgraph';
import { AgentStateAnnotation } from './state.js';
import { scrapeNode } from './nodes/scrape.js';
import { vectorizeNode } from './nodes/vectorize.js';
import { retrieverNode } from './nodes/retriever.js';
import { summarizerNode } from './nodes/summarizer.js';
import { PostgresSaver } from '@langchain/langgraph-checkpoint-postgres';
import pg from 'pg';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '../../../.env') });
let checkpointer = new MemorySaver();
const databaseUrl = process.env.DATABASE_URL || process.env.PG_CONNECTION_STRING;
if (databaseUrl) {
    const pool = new pg.Pool({
        connectionString: databaseUrl,
        ssl: { rejectUnauthorized: false },
        connectionTimeoutMillis: 1500 // Quick timeout if database is unreachable
    });
    try {
        // Test the database connection
        const client = await pool.connect();
        client.release();
        checkpointer = new PostgresSaver(pool);
        await checkpointer.setup();
        console.log('[Workflow] PostgresSaver initialized for LangGraph.');
    }
    catch (err) {
        console.warn('[Workflow] PostgreSQL database is unreachable. Falling back to MemorySaver. Details:', err.message);
        checkpointer = new MemorySaver();
        pool.end().catch(() => { });
    }
}
else {
    console.log('[Workflow] No Supabase DATABASE_URL found. Using MemorySaver fallback.');
}
// Construct the workflow
const workflow = new StateGraph(AgentStateAnnotation)
    .addNode('scrape', scrapeNode)
    .addNode('vectorize', vectorizeNode)
    .addNode('retriever', retrieverNode)
    .addNode('summarizer', summarizerNode);
// Set transitions
workflow.addEdge(START, 'scrape');
// Conditional route checking for errors to abort early (Cost protection)
workflow.addConditionalEdges('scrape', (state) => {
    return state.error ? END : 'vectorize';
});
workflow.addConditionalEdges('vectorize', (state) => {
    return state.error ? END : 'retriever';
});
workflow.addConditionalEdges('retriever', (state) => {
    return state.error ? END : 'summarizer';
});
workflow.addEdge('summarizer', END);
export const app = workflow.compile({ checkpointer });
