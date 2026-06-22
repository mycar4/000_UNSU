import { Annotation } from '@langchain/langgraph';
export const AgentStateAnnotation = Annotation.Root({
    userQuery: Annotation(),
    hotzones: Annotation(),
    trafficContext: Annotation(),
    audioScript: Annotation(),
    report: Annotation(),
    error: Annotation(),
});
