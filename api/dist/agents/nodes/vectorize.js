export async function vectorizeNode(state) {
    try {
        console.log('[vectorizeNode] Generating embeddings (Pass-through)...');
        if (state.error)
            return {};
        // Currently pass-through as specified in GUIDE_API.md
        return {};
    }
    catch (error) {
        return { error: `Vectorize error: ${error.message || error}` };
    }
}
