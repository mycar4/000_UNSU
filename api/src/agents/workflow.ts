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
  // Extract host for safer debug logging without exposing credentials
  let dbHost = 'unknown-host'
  try {
    const urlObj = new URL(databaseUrl)
    dbHost = urlObj.host
  } catch (e) {}

  console.log(`[Workflow] Attempting to connect to PostgreSQL at host: ${dbHost}...`)
  let connectionString = databaseUrl
  try {
    const urlObj = new URL(databaseUrl)
    urlObj.searchParams.delete('sslmode')
    connectionString = urlObj.toString()
  } catch (e) {}

  const pool = new pg.Pool({
    connectionString,
    ssl: { rejectUnauthorized: false },
    connectionTimeoutMillis: 2000 // Quick timeout if database is unreachable
  })
  try {
    // Test the database connection
    const client = await pool.connect()
    client.release()
    
    checkpointer = new PostgresSaver(pool)
    await checkpointer.setup()
    console.log(`[Workflow] PostgresSaver initialized successfully on: ${dbHost}`)
  } catch (err: any) {
    console.warn(`[Workflow] PostgreSQL (${dbHost}) is unreachable. Falling back to MemorySaver. Details:`, err.message)
    checkpointer = new MemorySaver()
    pool.end().catch(() => {})
  }
} else {
  console.log('[Workflow] No DATABASE_URL or PG_CONNECTION_STRING found in env. Defaulting to MemorySaver.')
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
