import { AgentStateAnnotation } from '../state.js'

export async function retrieverNode(state: typeof AgentStateAnnotation.State) {
  try {
    console.log('[retrieverNode] Retrieving matched hotzones (Pass-through)...')
    if (state.error) return {}
    // Currently pass-through as specified in GUIDE_API.md
    return {}
  } catch (error: any) {
    return { error: `Retriever error: ${error.message || error}` }
  }
}
