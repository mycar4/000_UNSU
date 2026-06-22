import { StateGraph, START, END } from '@langchain/langgraph';
import { AgentStateAnnotation } from './state.js';
import { scrapeNode } from './nodes/scrape.js';
import { vectorizeNode } from './nodes/vectorize.js';
import { retrieverNode } from './nodes/retriever.js';
import { summarizerNode } from './nodes/summarizer.js';
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
export const app = workflow.compile();
