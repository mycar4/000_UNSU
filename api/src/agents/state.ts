import { Annotation } from '@langchain/langgraph'

export interface HotZone {
  area: string
  demand: string
  status: 'critical' | 'warning' | 'normal'
}

export interface AgentState {
  userQuery: string
  hotzones: HotZone[]
  trafficContext: string
  audioScript: string
  report: string
  error?: string
}

export const AgentStateAnnotation = Annotation.Root({
  userQuery: Annotation<string>(),
  hotzones: Annotation<HotZone[]>(),
  trafficContext: Annotation<string>(),
  audioScript: Annotation<string>(),
  report: Annotation<string>(),
  error: Annotation<string | undefined>(),
})
