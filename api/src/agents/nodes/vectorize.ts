import { AgentStateAnnotation } from '../state.js'

export async function vectorizeNode(state: typeof AgentStateAnnotation.State) {
  try {
    console.log('[vectorizeNode] Generating embeddings (Pass-through)...')
    if (state.error) return {}
    // Currently pass-through as specified in GUIDE_API.md
    return {}
  } catch (error: any) {
    return { error: `Vectorize error: ${error.message || error}` }
  }
}
