import { StateGraph, START, END, MemorySaver } from '@langchain/langgraph'
import { AgentStateAnnotation } from './state.js'
import { scrapeNode } from './nodes/scrape.js'
import { vectorizeNode } from './nodes/vectorize.js'
import { retrieverNode } from './nodes/retriever.js'
import { summarizerNode } from './nodes/summarizer.js'
import { PostgresSaver } from '@langchain/langgraph-checkpoint-postgres'
import pg from 'pg'
import dotenv from 'dotenv'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
dotenv.config({ path: path.join(__dirname, '../../../.env') })

let checkpointer: any = new MemorySaver()
const databaseUrl = process.env.DATABASE_URL || process.env.PG_CONNECTION_STRING

if (databaseUrl) {
  try {
    const pool = new pg.Pool({
      connectionString: databaseUrl,
      ssl: { rejectUnauthorized: false }
    })
    checkpointer = new PostgresSaver(pool)
    checkpointer.setup().catch((e: any) => console.error('[Workflow] PostgresSaver setup error:', e.message))
    console.log('[Workflow] PostgresSaver initialized for LangGraph.')
  } catch (err: any) {
    console.error('[Workflow] Failed to initialize PostgresSaver, falling back to MemorySaver.', err.message)
  }
} else {
  console.log('[Workflow] No Supabase DATABASE_URL found. Using MemorySaver fallback.')
}

// Construct the workflow
const workflow = new StateGraph(AgentStateAnnotation)
  .addNode('scrape', scrapeNode)
  .addNode('vectorize', vectorizeNode)
  .addNode('retriever', retrieverNode)
  .addNode('summarizer', summarizerNode)

// Set transitions
workflow.addEdge(START, 'scrape')

// Conditional route checking for errors to abort early (Cost protection)
workflow.addConditionalEdges('scrape', (state) => {
  return state.error ? END : 'vectorize'
})

workflow.addConditionalEdges('vectorize', (state) => {
  return state.error ? END : 'retriever'
})

workflow.addConditionalEdges('retriever', (state) => {
  return state.error ? END : 'summarizer'
})

workflow.addEdge('summarizer', END)

export const app = workflow.compile({ checkpointer })
