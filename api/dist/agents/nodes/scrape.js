import { getHotZones } from '../../utils/db.js';
import { compileGPanTrafficContext } from '../../services/externalApi.js';
export async function scrapeNode(state) {
    try {
        console.log('[scrapeNode] Fetching active traffic hotzones from DB...');
        if (!state.userQuery) {
            return { error: 'No user query specified' };
        }
        // Fetch real-time compiled context from external APIs
        const trafficContext = await compileGPanTrafficContext(state.userQuery);
        // Fetch real hotzones from the DB wrapper
        const allZones = await getHotZones();
        // Filter hotzones matching the query (e.g. area name contains query)
        const query = state.userQuery.toLowerCase();
        let filtered = allZones.filter(z => z.zone_name.toLowerCase().includes(query));
        // If no specific match, return all active hotzones as default RAG retrieval context
        if (filtered.length === 0) {
            filtered = allZones;
        }
        // Format into HotZone schema (area, demand, status)
        const formatted = filtered.map(z => ({
            area: z.zone_name,
            demand: `${z.description} (${z.wait_minutes}분 대기)`,
            status: z.status === 'HIGH' ? 'critical' : z.status === 'LOW' ? 'normal' : 'warning'
        }));
        return {
            hotzones: formatted,
            trafficContext: trafficContext
        };
    }
    catch (error) {
        return { error: `Scrape error: ${error.message || error}` };
    }
}
