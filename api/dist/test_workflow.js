import { app } from './agents/workflow.js';
async function runTest() {
    console.log('[Test] Initiating LangGraph workflow test...');
    try {
        const result = await app.invoke({ userQuery: '강남역' });
        console.log('[Test] Execution success!');
        console.log('[Test] Output state:', JSON.stringify(result, null, 2));
    }
    catch (error) {
        console.error('[Test] Execution failed:', error);
    }
}
runTest();
