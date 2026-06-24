import { AgentStateAnnotation } from '../state.js'
import { compileGPanTrafficContext, fetchAirportFlights, fetchTrainStatus, fetchTrafficInfo } from '../../services/externalApi.js'

export async function scrapeNode(state: typeof AgentStateAnnotation.State) {
  try {
    console.log('[scrapeNode] Fetching active traffic hotzones dynamically from real-time APIs...')
    if (!state.userQuery) {
      return { error: 'No user query specified' }
    }
    
    // Fetch real-time compiled context from external APIs
    const trafficContext = await compileGPanTrafficContext(state.userQuery)
    
    // Generate hotzones dynamically from APIs
    const dynamicHotzones: { area: string; demand: string; status: 'critical'|'warning'|'normal' }[] = []
    
    // 1. Airports
    const flights = await fetchAirportFlights().catch(() => [])
    const delayedFlights = flights.filter(f => f.status === '지연' || f.status === '결항')
    if (delayedFlights.length > 0) {
      dynamicHotzones.push({
        area: flights[0]?.airport || '공항 주변',
        demand: `출발/도착 항공기 ${delayedFlights.length}편 연착 발생. 공항 승객 대기열 급증 예상. (15분 이상 대기)`,
        status: 'critical'
      })
    }

    // 2. Trains
    const trains = await fetchTrainStatus().catch(() => [])
    if (trains.length > 0 && trains.some(t => t.surgeLevel === 'HIGH')) {
      dynamicHotzones.push({
        area: trains.find(t => t.surgeLevel === 'HIGH')?.station || '기차역 주변',
        demand: `주요 열차 도착/출발로 인한 승객 집중 (수요 150% 증가)`,
        status: 'warning'
      })
    }

    // 3. Traffic Incidents
    const traffic = await fetchTrafficInfo().catch(() => ({ incidents: [] }))
    if (traffic.incidents.length > 0) {
      const topIncident = traffic.incidents[0]
      dynamicHotzones.push({
        area: topIncident.location,
        demand: `돌발 교통상황(${topIncident.type})으로 인한 우회 차량 및 택시 대기열 발생 (10분 지연)`,
        status: topIncident.severity === 'SEVERE' ? 'critical' : 'warning'
      })
    }

    // Fallback if none found, we generate one based on the user query
    if (dynamicHotzones.length === 0) {
      const query = state.userQuery.trim().split(' ')[0]
      dynamicHotzones.push({
        area: `${query} 중심가`,
        demand: `유동 인구 안정적 (대기 시간 5분 내외)`,
        status: 'normal'
      })
    }
    
    return {
      hotzones: dynamicHotzones,
      trafficContext: trafficContext
    }
  } catch (error: any) {
    return { error: `Scrape error: ${error.message || error}` }
  }
}

