import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import { app } from './agents/workflow.js'
import { UserQuerySchema } from './schemas/validation.js'

dotenv.config()

const server = express()
const PORT = process.env.PORT || 3001

server.use(cors())
server.use(express.json())

// SSE streaming endpoint
server.get('/api/recommend/stream', async (req, res) => {
  const queryParam = req.query.q as string

  res.setHeader('Content-Type', 'text/event-stream')
  res.setHeader('Cache-Control', 'no-cache')
  res.setHeader('Connection', 'keep-alive')

  // Validation
  const validated = UserQuerySchema.safeParse({ query: queryParam })
  if (!validated.success) {
    res.write(`data: ${JSON.stringify({ type: 'error', message: validated.error.errors[0].message })}\n\n`)
    res.end()
    return
  }

  try {
    const query = validated.data.query
    console.log(`[Server] Streaming RAG analysis for query: ${query}`)

    // Run the LangGraph agent
    const resultState = await app.invoke({ userQuery: query })

    if (resultState.error) {
      res.write(`data: ${JSON.stringify({ type: 'error', message: resultState.error })}\n\n`)
      res.end()
      return
    }

    // Send the hotzones and report back via SSE
    res.write(`data: ${JSON.stringify({ type: 'hotzones', hotzones: resultState.hotzones })}\n\n`)
    
    // Simulate streaming the report text line-by-line
    const lines = resultState.report.split('\n')
    for (const line of lines) {
      res.write(`data: ${JSON.stringify({ type: 'report', text: line })}\n\n`)
      await new Promise(resolve => setTimeout(resolve, 80))
    }

    res.end()
  } catch (error: any) {
    console.error('[Server] Streaming error:', error)
    res.write(`data: ${JSON.stringify({ type: 'error', message: error.message || error })}\n\n`)
    res.end()
  }
})

server.listen(PORT, () => {
  console.log(`[Server] UNSU API Server running at http://localhost:${PORT}`)
})
