import { z } from 'zod';
import { getApiStatus, recordApiCall } from '../utils/apiConfig.js';
import { withCache } from '../utils/cache.js';
import {
  WeatherDataSchema,
  TrafficInfoSchema,
  FlightInfoSchema,
  TrainInfoSchema
} from '../schemas/radar.js';

// ==========================================
// 1. Weather API (Open-Meteo: No API Key Required)
// ==========================================
export interface WeatherData {
  temperature: number;
  weatherCode: number;
  precipitationProbability: number;
  conditionStr: string;
}

export async function fetchWeather(lat = 37.5665, lon = 126.9780): Promise<WeatherData> {
  const status = getApiStatus('weather');
  if (status.sandboxMode) {
    recordApiCall('weather', true);
    return { temperature: 24.5, weatherCode: 0, precipitationProbability: 10, conditionStr: '맑음' };
  }

  try {
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,weather_code,precipitation&hourly=precipitation_probability&timezone=Asia%2FSeoul`;
    const response = await fetch(url);
    if (!response.ok) throw new Error('Weather API failed');
    
    const data: any = await response.json();
    const temp = data.current?.temperature_2m || 0;
    const code = data.current?.weather_code || 0;
    const precipProb = data.hourly?.precipitation_probability?.[0] || 0;

    let conditionStr = '맑음';
    if (code === 1 || code === 2 || code === 3) conditionStr = '구름 많음';
    else if (code >= 50 && code <= 69) conditionStr = '비';
    else if (code >= 71 && code <= 77) conditionStr = '눈';
    else if (code >= 95) conditionStr = '뇌우';

    const payload = {
      temperature: temp,
      weatherCode: code,
      precipitationProbability: precipProb,
      conditionStr
    };

    const parsed = WeatherDataSchema.safeParse(payload);
    if (!parsed.success) {
      console.warn('[Zod Validation] Weather validation failed:', parsed.error.errors);
      throw new Error('Weather data schema validation failed');
    }

    recordApiCall('weather', true);
    return parsed.data as WeatherData;
  } catch (err: any) {
    console.error('[ExternalAPI] Weather fetch failed, fallback to mock.', err.message);
    recordApiCall('weather', false);
    return { temperature: 24.5, weatherCode: 0, precipitationProbability: 10, conditionStr: '맑음' };
  }
}

// ==========================================
// 2. Traffic Info API (ITS 국가교통정보센터)
// ==========================================
export interface TrafficInfo {
  roadName: string;
  speed: number;
  status: '원활' | '서행' | '정체' | '정보없음';
  message: string;
}

const ITS_API_KEY = process.env.ITS_API_KEY || '';
const KORAIL_API_KEY = process.env.KORAIL_API_KEY || '';
const METRO_API_KEY = process.env.METRO_API_KEY || '';
const KOPIS_API_KEY = process.env.KOPIS_API_KEY || '';

export async function fetchTrafficInfo(): Promise<TrafficInfo> {
  const statusInfo = getApiStatus('traffic');
  if (statusInfo.sandboxMode) {
    recordApiCall('traffic', true);
    return { roadName: '강변북로', speed: 35, status: '서행', message: '성수대교 부근에서 부분적인 서행이 감지됩니다.' };
  }

  const apiKey = ITS_API_KEY || process.env.SEOUL_OPEN_API_KEY || '';
  if (apiKey) {
    try {
      const url = `http://openapi.seoul.go.kr:8088/${apiKey}/json/AccidentInfo/1/5/`;
      const response = await fetch(url);
      if (response.ok) {
        const data: any = await response.json();
        const row = data.AccidentInfo?.row?.[0];
        if (row) {
          const roadName = row.LNK_NAM || '서울 주요 도로';
          const accType = row.ACC_TYP || '돌발상황';
          const message = row.ACC_DES || '실시간 교통 돌발 상황 발생. 안전 운전에 유의하시기 바랍니다.';
          const payload = {
            roadName: roadName,
            speed: 20,
            status: '정체' as const,
            message: `[${accType}] ${message}`
          };
          const parsed = TrafficInfoSchema.safeParse(payload);
          if (parsed.success) {
            recordApiCall('traffic', true);
            return parsed.data as TrafficInfo;
          } else {
            console.warn('[Zod Validation] Traffic validation failed:', parsed.error.errors);
          }
        } else {
          // No accidents means traffic is smooth!
          const payload = {
            roadName: '올림픽대로',
            speed: 75,
            status: '원활' as const,
            message: '현재 서울 도심 및 간선도로의 실시간 돌발 상황이 없습니다. 안전 운행하십시오.'
          };
          const parsed = TrafficInfoSchema.safeParse(payload);
          if (parsed.success) {
            recordApiCall('traffic', true);
            return parsed.data as TrafficInfo;
          }
        }
      }
    } catch (err: any) {
      console.error('[ExternalAPI] Traffic fetch failed:', err.message);
    }
  }
  
  // Sandbox Fallback
  recordApiCall('traffic', false);
  return {
    roadName: '강변북로',
    speed: 35,
    status: '서행',
    message: '성수대교 부근에서 부분적인 서행이 감지됩니다.'
  };
}

// ==========================================
// 3. Culture & Events API (공공데이터포털 - 한국문화정보원)
// ==========================================
export interface LocalEvent {
  eventName: string;
  location: string;
  endTime: string;
  surgeExpected: boolean;
}

const DATA_GO_KR_API_KEY = process.env.DATA_GO_KR_API_KEY || '';

// Removed duplicate fetchLocalEvents

// ==========================================
// 4. Airport Arrival API (인천/한국공항공사)
// ==========================================
export interface FlightInfo {
  airport: string;
  flightName: string;
  expectedArrivalTime: string;
  status: '정상' | '지연' | '결항';
  passengerCountEst: number;
}

const AIRPORT_API_KEY = process.env.AIRPORT_API_KEY || '';

export async function fetchAirportFlights(): Promise<FlightInfo[]> {
  const statusInfo = getApiStatus('airport');
  if (statusInfo.sandboxMode || !AIRPORT_API_KEY) {
    recordApiCall('airport', true);
    return [
      { airport: '김포공항 (국내선)', flightName: 'KE1234 (제주발)', expectedArrivalTime: '18:45', status: '지연' as const, passengerCountEst: 280 },
      { airport: '인천공항 (제1터미널)', flightName: 'OZ541 (프랑크푸르트발)', expectedArrivalTime: '19:10', status: '정상' as const, passengerCountEst: 350 }
    ];
  }

  try {
    const url = `https://apis.data.go.kr/B551178/flight-status/detail?serviceKey=${AIRPORT_API_KEY}&type=json&numOfRows=5`;
    const res = await fetch(url);
    if (res.ok) {
      const data: any = await res.json();
      const items = data.response?.body?.items?.item || [];
      const list = Array.isArray(items) ? items : [items];
      if (list.length > 0) {
        recordApiCall('airport', true);
        const mapped = list.map((item: any) => ({
          airport: `${item.ARRIVED_KOR || '인천'}공항`,
          flightName: `${item.AIR_FLN || 'OZ541'} (${item.BOARDING_KOR || '해외발'})`,
          expectedArrivalTime: item.STD ? `${String(item.STD).slice(0, 2)}:${String(item.STD).slice(2, 4)}` : '19:10',
          status: item.RMK_KOR === '지연' ? ('지연' as const) : item.RMK_KOR === '결항' ? ('결항' as const) : ('정상' as const),
          passengerCountEst: 300
        }));
        const parsed = z.array(FlightInfoSchema).safeParse(mapped);
        if (parsed.success) {
          return parsed.data as FlightInfo[];
        } else {
          console.warn('[Zod Validation] Airport validation failed:', parsed.error.errors);
        }
      }
    }
    throw new Error('Invalid Airport API response');
  } catch (err: any) {
    console.error('[ExternalAPI] Airport fetch failed, using fallback:', err.message);
    recordApiCall('airport', false);
    return [
      { airport: '김포공항 (국내선)', flightName: 'KE1234 (제주발)', expectedArrivalTime: '18:45', status: '지연' as const, passengerCountEst: 280 },
      { airport: '인천공항 (제1터미널)', flightName: 'OZ541 (프랑크푸르트발)', expectedArrivalTime: '19:10', status: '정상' as const, passengerCountEst: 350 }
    ];
  }
}

// ==========================================
// 5. Train Arrival API (코레일 / SRT)
// ==========================================
export interface TrainInfo {
  station: string;
  trainName: string;
  arrivalTime: string;
  surgeLevel: 'HIGH' | 'MEDIUM' | 'LOW';
}

export async function fetchTrainStatus(): Promise<TrainInfo[]> {
  const statusInfo = getApiStatus('trains');
  if (statusInfo.sandboxMode || !KORAIL_API_KEY) {
    recordApiCall('trains', true);
    return [
      { station: '서울역', trainName: 'KTX 124 (부산발)', arrivalTime: '19:30', surgeLevel: 'HIGH' as const },
      { station: '수서역', trainName: 'SRT 312 (광주송정발)', arrivalTime: '19:45', surgeLevel: 'MEDIUM' as const }
    ];
  }

  try {
    const todayStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const url = `https://apis.data.go.kr/1613000/TrainInfo/GetStrtpntAlocFndTrainInfo?serviceKey=${KORAIL_API_KEY}&depPlaceId=NAT010000&arrPlaceId=NAT011668&depPlandTime=${todayStr}&_type=json&numOfRows=5&pageNo=1`;
    const res = await fetch(url);
    if (!res.ok) throw new Error(`Train API HTTP error: ${res.status}`);
    const data: any = await res.json();
    const items = data.response?.body?.items?.item || [];
    const list = Array.isArray(items) ? items : [items];
    
    // API Call succeeded even if empty
    recordApiCall('trains', true);
    
    if (list.length > 0) {
      const mapped = list.slice(0, 3).map((item: any) => ({
        station: '서울역',
        trainName: `${item.traingradename || 'KTX'} ${item.trainno || ''}`,
        arrivalTime: item.arrplandtime ? `${String(item.arrplandtime).slice(8, 10)}:${String(item.arrplandtime).slice(10, 12)}` : '19:30',
        surgeLevel: 'HIGH' as const
      }));
      const parsed = z.array(TrainInfoSchema).safeParse(mapped);
      if (parsed.success) return parsed.data as TrainInfo[];
    }
    // Return mock data if empty list
    return [
      { station: '서울역', trainName: 'KTX 123', arrivalTime: '19:30', surgeLevel: 'HIGH' as const },
      { station: '용산역', trainName: 'ITX 456', arrivalTime: '19:45', surgeLevel: 'MEDIUM' as const }
    ];
  } catch (err: any) {
    console.error('[ExternalAPI] Trains fetch failed:', err.message);
    recordApiCall('trains', false);
    return [
      { station: '서울역', trainName: 'KTX 123', arrivalTime: '19:30', surgeLevel: 'HIGH' },
      { station: '용산역', trainName: 'ITX 456', arrivalTime: '19:45', surgeLevel: 'MEDIUM' },
    ];
  }
}

// ==========================================
// 9. Opinet Gas Station API (한국석유공사)
// ==========================================
export interface GasStation {
  name: string;
  brand: string;       // LPG/GS/SK/현대 등
  address: string;
  distanceM: number;   // 현재 위치로부터 거리 (미터)
  pricePerLiter: number; // 리터당 가격 (원)
  fuelType: 'LPG' | 'GASOLINE' | 'DIESEL';
  isOpen: boolean;
}

const OPINET_API_KEY = process.env.OPINET_API_KEY || '';

export async function fetchNearbyGasStations(lat = 37.5665, lon = 126.9780, fuelType: 'LPG' | 'GASOLINE' | 'DIESEL' = 'LPG'): Promise<GasStation[]> {
  const status = getApiStatus('opinet');
  if (status.sandboxMode || !OPINET_API_KEY) {
    recordApiCall('opinet', true);
    return [
      { name: '서울 에너지 충전소', brand: 'E1', address: '서울 마포구 상암동 48-2', distanceM: 320, pricePerLiter: 1021, fuelType: 'LPG', isOpen: true },
      { name: '상암 LPG 충전소', brand: 'SK가스', address: '서울 마포구 월드컵북로 366', distanceM: 850, pricePerLiter: 1034, fuelType: 'LPG', isOpen: true },
      { name: '강변 에너지 플러스', brand: 'GS칼텍스', address: '서울 마포구 강변북로 9-34', distanceM: 1200, pricePerLiter: 1045, fuelType: 'LPG', isOpen: false },
    ];
  }

  try {
    // 한국석유공사 오피넷 주유소 정보 API
    // 실제: prodcd=LPG, count=5, area=현재 시군구코드
    const prodcd = fuelType === 'LPG' ? 'D047' : fuelType === 'GASOLINE' ? 'B027' : 'D001';
    const url = `https://www.opinet.co.kr/api/lowPriceStationList.do?code=${OPINET_API_KEY}&out=json&prodcd=${prodcd}&cnt=5`;
    const res = await fetch(url);
    if (!res.ok) throw new Error('Opinet API failed');
    const data: any = await res.json();
    const items = data.RESULT?.OIL || [];
    recordApiCall('opinet', true);
    return items.map((item: any, idx: number) => ({
      name: item.OS_NM || `주유소 ${idx + 1}`,
      brand: item.POLL_DIV_NM || '기타',
      address: item.NEW_ADR || '',
      distanceM: Math.round(Math.random() * 2000 + 200), // 실제는 Haversine 계산 필요
      pricePerLiter: Number(item.PRICE) || 1030,
      fuelType,
      isOpen: true,
    }));
  } catch (err: any) {
    console.error('[ExternalAPI] Opinet fetch failed:', err.message);
    recordApiCall('opinet', false);
    return [
      { name: '서울 에너지 충전소', brand: 'E1', address: '서울 마포구 상암동 48-2', distanceM: 320, pricePerLiter: 1021, fuelType: 'LPG', isOpen: true },
      { name: '상암 LPG 충전소', brand: 'SK가스', address: '서울 마포구 월드컵북로 366', distanceM: 850, pricePerLiter: 1034, fuelType: 'LPG', isOpen: true },
    ];
  }
}

// ==========================================
// 6. Public Restrooms API (행정안전부)
// ==========================================
export interface RestroomInfo {
  name: string;
  address: string;
  distanceMeter: number;
  open24Hours: boolean;
  parkingAvailable: boolean;
}


export async function fetchPublicRestrooms(lat: number, lon: number): Promise<RestroomInfo[]> {
  const statusInfo = getApiStatus('restrooms');
  recordApiCall('restrooms', true);

  const freePublicRestrooms = [
    { name: "여의도 한강공원 3호 개방화장실", address: "서울 영등포구 여의동로 330", lat: 37.528, lon: 126.932, open24Hours: true, parkingAvailable: true },
    { name: "마포역 4번출구 지하 공공화장실", address: "서울 마포구 도화동", lat: 37.539, lon: 126.946, open24Hours: true, parkingAvailable: false },
    { name: "공덕역 도보 3분 개방화장실", address: "서울 마포구 마포대로 92", lat: 37.543, lon: 126.951, open24Hours: false, parkingAvailable: false },
    { name: "강남역 2번출구 개방화장실", address: "서울 강남구 강남대로 396", lat: 37.498, lon: 127.027, open24Hours: true, parkingAvailable: false },
    { name: "김포공항 국내선 화장실", address: "서울 강서구 하늘길 112", lat: 37.558, lon: 126.802, open24Hours: true, parkingAvailable: true },
    { name: "부산역 맞이방 화장실", address: "부산 동구 중앙대로 206", lat: 35.115, lon: 129.043, open24Hours: true, parkingAvailable: true },
    { name: "제주공항 1층 화장실", address: "제주 제주시 공항로 2", lat: 33.506, lon: 126.493, open24Hours: true, parkingAvailable: true }
  ];

  const getDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371e3; // metres
    const φ1 = lat1 * Math.PI / 180;
    const φ2 = lat2 * Math.PI / 180;
    const Δφ = (lat2 - lat1) * Math.PI / 180;
    const Δλ = (lon2 - lon1) * Math.PI / 180;

    const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c; // in metres
  };

  try {
    const url = `https://apis.data.go.kr/1741000/public_restroom_info_v2/info_v2?serviceKey=${process.env.DATA_GO_KR_API_KEY || ''}&returnType=JSON&numOfRows=10&pageNo=1`;
    const res = await fetch(url);
    if (!res.ok) throw new Error('Restroom API failed');
    const data: any = await res.json();
    const items = data.response?.body?.items?.item || [];
    const list = Array.isArray(items) ? items : [items];
    if (list.length > 0) {
      recordApiCall('restrooms', true);
      return list.map((r: any) => {
        // v2 API doesn't provide lat/lon, so we provide a mock distance based on index
        const dist = Math.round(Math.random() * 500) + 100; 
        return {
          name: r.RSTRM_NM || '공중화장실',
          address: r.LCTN_ROAD_NM_ADDR || r.LCTN_LOTNO_ADDR || '',
          distanceMeter: dist,
          open24Hours: String(r.OPN_HR_DTL || '').includes('24') || String(r.OPN_HR || '').includes('24'),
          parkingAvailable: false
        };
      }).sort((a: any, b: any) => a.distanceMeter - b.distanceMeter);
    }
    throw new Error('Empty restrooms');
  } catch (err: any) {
    console.error('[ExternalAPI] Restrooms fetch failed, using fallback:', err.message);
    const results = freePublicRestrooms.map(r => {
      const dist = getDistance(lat, lon, r.lat, r.lon);
      return {
        name: r.name,
        address: r.address,
        distanceMeter: Math.round(dist),
        open24Hours: r.open24Hours,
        parkingAvailable: r.parkingAvailable
      };
    });
    results.sort((a, b) => a.distanceMeter - b.distanceMeter);
    return results;
  }
}

// ==========================================
// 7. Seoul Subway API (서울 열린데이터광장)
// ==========================================
export interface SubwayInfo {
  source: 'seoul' | 'metro';
  stationName: string;
  lineNum: string;
  trainStatus: string; // 진입/도착/출발
  destinationName: string;
  surgeLevel: 'HIGH' | 'MEDIUM' | 'LOW';
}

const SEOUL_SUBWAY_API_KEY = process.env.SEOUL_SUBWAY_API_KEY || '';

export async function fetchSeoulSubway(): Promise<SubwayInfo[]> {
  const status = getApiStatus('subway_seoul');
  if (status.sandboxMode || !SEOUL_SUBWAY_API_KEY) {
    recordApiCall('subway_seoul', true);
    return [
      { source: 'seoul', stationName: '강남', lineNum: '2호선', trainStatus: '진입', destinationName: '성수', surgeLevel: 'HIGH' },
      { source: 'seoul', stationName: '잠실', lineNum: '2호선', trainStatus: '도착', destinationName: '신천', surgeLevel: 'HIGH' },
      { source: 'seoul', stationName: '홍대입구', lineNum: '2호선', trainStatus: '출발', destinationName: '합정', surgeLevel: 'MEDIUM' },
    ];
  }

  try {
    // 서울 열린데이터광장: 지하철 실시간 도착정보 API
    const url = `http://swopenapi.seoul.go.kr/api/subway/${SEOUL_SUBWAY_API_KEY}/json/realtimeStationArrival/0/10/강남`;
    const res = await fetch(url);
    if (!res.ok) throw new Error('Seoul subway API failed');
    const data: any = await res.json();
    const items = data.realtimeArrivalList || [];
    recordApiCall('subway_seoul', true);
    return items.map((item: any) => ({
      source: 'seoul' as const,
      stationName: item.statnNm || '강남',
      lineNum: item.subwayNm || '',
      trainStatus: item.arvlMsg2 || '',
      destinationName: item.bstatnNm || '',
      surgeLevel: 'MEDIUM' as const
    }));
  } catch (err: any) {
    console.error('[ExternalAPI] Seoul subway failed:', err.message);
    recordApiCall('subway_seoul', false);
    return [
      { source: 'seoul', stationName: '강남', lineNum: '2호선', trainStatus: '진입', destinationName: '성수', surgeLevel: 'HIGH' },
    ];
  }
}

export async function fetchMetroSubway(): Promise<SubwayInfo[]> {
  const statusInfo = getApiStatus('subway_metro');
  if (statusInfo.sandboxMode || !METRO_API_KEY) {
    recordApiCall('subway_metro', true);
    return [
      { source: 'metro', stationName: '수원', lineNum: '경부선', trainStatus: '도착', destinationName: '서울', surgeLevel: 'MEDIUM' },
      { source: 'metro', stationName: '인천', lineNum: '공항철도', trainStatus: '출발', destinationName: '서울역', surgeLevel: 'LOW' },
    ];
  }

  try {
    const url = `https://apis.data.go.kr/1613000/SubwayInfo/GetSubwaySttnAcctoSchdulList?serviceKey=${METRO_API_KEY}&subwayStationId=CT01_SUB120&dailyTypeCode=01&upDownTypeCode=U&_type=json&numOfRows=5`;
    const res = await fetch(url);
    if (!res.ok) throw new Error(`Metro API HTTP error: ${res.status}`);
    const data: any = await res.json();
    const items = data.response?.body?.items?.item || [];
    const list = Array.isArray(items) ? items : [items];
    
    recordApiCall('subway_metro', true);
    
    if (list.length > 0) {
      return list.map((item: any) => ({
        source: 'metro' as const,
        stationName: item.subwayStationNm || item.subwayStationName || '수원',
        lineNum: item.subwayRouteNm || item.subwayRouteName || '경부선',
        trainStatus: item.arrTime ? `${String(item.arrTime).substring(0, 2)}:${String(item.arrTime).substring(2, 4)} 도착예정` : '도착예정',
        destinationName: item.endSubwayStationNm || item.endStationName || '서울',
        surgeLevel: 'MEDIUM' as const
      }));
    }
    
    // Return mock data if empty list
    return [
      { source: 'metro', stationName: '수원', lineNum: '1호선', trainStatus: '진입', destinationName: '청량리', surgeLevel: 'HIGH' },
      { source: 'metro', stationName: '금정', lineNum: '4호선', trainStatus: '도착', destinationName: '당고개', surgeLevel: 'MEDIUM' },
    ];
  } catch (err: any) {
    console.error('[ExternalAPI] Metro Subway fetch failed:', err.message);
    recordApiCall('subway_metro', false);
    return [
      { source: 'metro', stationName: '수원', lineNum: '1호선', trainStatus: '진입', destinationName: '청량리', surgeLevel: 'HIGH' },
      { source: 'metro', stationName: '금정', lineNum: '4호선', trainStatus: '도착', destinationName: '당고개', surgeLevel: 'MEDIUM' },
    ];
  }
}

// ==========================================
// 8. Multi-Source Event Aggregator (문화행사 통합)
// ==========================================

// 공통 이벤트 인터페이스 (수집 원시 데이터)
export interface RawEvent {
  id: string;
  source: string;       // API 소스 ID (events_kopis, events_seoul 등)
  category: string;     // concert / sports / festival / exhibition / outdoor / culture
  region: string;       // seoul / gyeonggi / busan / incheon / nationwide
  title: string;
  venue: string;
  venueAddress?: string;
  startDate: string;
  endDate: string;
  endTime: string;      // HH:MM 형식
  expectedAttendees?: number;
  surgeExpected: boolean;
  tags: string[];
}

// 필터 옵션
export interface EventFilter {
  category?: string;
  region?: string;
  date?: string;        // YYYY-MM-DD
  surgeOnly?: boolean;
  minAttendees?: number;
}

// 각 소스별 Mock 이벤트 데이터
const MOCK_EVENTS_BY_SOURCE: Record<string, RawEvent[]> = {
  events_kopis: [
    { id: 'kopis-001', source: 'events_kopis', category: 'concert', region: 'seoul', title: '뮤지컬 레미제라블', venue: '블루스퀘어 신한카드홀', venueAddress: '서울 용산구 이태원로 294', startDate: '2026-06-20', endDate: '2026-08-31', endTime: '21:30', expectedAttendees: 1800, surgeExpected: true, tags: ['뮤지컬', '대형공연'] },
    { id: 'kopis-002', source: 'events_kopis', category: 'concert', region: 'seoul', title: '빈 필하모닉 내한공연', venue: '롯데콘서트홀', venueAddress: '서울 송파구 올림픽로 300', startDate: '2026-07-15', endDate: '2026-07-15', endTime: '21:00', expectedAttendees: 2000, surgeExpected: true, tags: ['클래식', '내한공연'] },
  ],
  events_culture: [
    { id: 'culture-001', source: 'events_culture', category: 'festival', region: 'nationwide', title: '싸이 흠뻑쇼 SUMMER SWAG 2026', venue: '잠실 종합운동장 올림픽주경기장', venueAddress: '서울 송파구 올림픽로 25', startDate: '2026-07-19', endDate: '2026-07-20', endTime: '22:30', expectedAttendees: 50000, surgeExpected: true, tags: ['콘서트', '대형행사', '잠실'] },
    { id: 'culture-002', source: 'events_culture', category: 'festival', region: 'seoul', title: '서울 재즈 페스티벌', venue: '올림픽공원 88잔디마당', venueAddress: '서울 송파구 올림픽로 424', startDate: '2026-07-25', endDate: '2026-07-27', endTime: '21:00', expectedAttendees: 30000, surgeExpected: true, tags: ['재즈', '페스티벌', '야외'] },
  ],
  events_seoul: [
    { id: 'seoul-001', source: 'events_seoul', category: 'outdoor', region: 'seoul', title: '한강 불꽃축제', venue: '여의도 한강공원', venueAddress: '서울 영등포구 여의동로 330', startDate: '2026-10-03', endDate: '2026-10-03', endTime: '21:30', expectedAttendees: 100000, surgeExpected: true, tags: ['불꽃', '야외', '한강', '여의도'] },
    { id: 'seoul-002', source: 'events_seoul', category: 'culture', region: 'seoul', title: '서울 거리예술축제', venue: '광화문 광장', venueAddress: '서울 종로구 세종대로 172', startDate: '2026-09-05', endDate: '2026-09-07', endTime: '22:00', expectedAttendees: 20000, surgeExpected: true, tags: ['거리예술', '광화문'] },
  ],
  events_gyeonggi: [
    { id: 'gyeonggi-001', source: 'events_gyeonggi', category: 'festival', region: 'gyeonggi', title: '수원 화성문화제', venue: '수원화성 일원', venueAddress: '경기 수원시 팔달구 행궁로 11', startDate: '2026-09-25', endDate: '2026-09-28', endTime: '21:00', expectedAttendees: 40000, surgeExpected: true, tags: ['수원', '문화유산', '야외'] },
  ],
  events_busan: [
    { id: 'busan-001', source: 'events_busan', category: 'festival', region: 'busan', title: '부산 국제영화제 (BIFF)', venue: '부산 남포동 일원', venueAddress: '부산 중구 남포동', startDate: '2026-10-08', endDate: '2026-10-17', endTime: '22:00', expectedAttendees: 80000, surgeExpected: true, tags: ['영화', '국제행사', '부산'] },
  ],
  events_incheon: [
    { id: 'incheon-001', source: 'events_incheon', category: 'culture', region: 'incheon', title: '인천 펜타포트 락 페스티벌', venue: '인천 송도 달빛축제공원', venueAddress: '인천 연수구 송도동', startDate: '2026-08-07', endDate: '2026-08-09', endTime: '23:00', expectedAttendees: 35000, surgeExpected: true, tags: ['록', '페스티벌', '인천'] },
  ],
  events_sports: [
    { id: 'sports-001', source: 'events_sports', category: 'sports', region: 'seoul', title: 'KBO 잠실 LG vs 두산 더블헤더', venue: '잠실야구장', venueAddress: '서울 송파구 올림픽로 19-2', startDate: '2026-07-18', endDate: '2026-07-18', endTime: '21:30', expectedAttendees: 25000, surgeExpected: true, tags: ['야구', 'KBO', '잠실', '더블헤더'] },
    { id: 'sports-002', source: 'events_sports', category: 'sports', region: 'seoul', title: 'K리그 서울 vs 전북', venue: '서울월드컵경기장', venueAddress: '서울 마포구 월드컵로 240', startDate: '2026-07-20', endDate: '2026-07-20', endTime: '21:00', expectedAttendees: 30000, surgeExpected: true, tags: ['축구', 'K리그', '상암'] },
  ],
  events_concert: [
    { id: 'concert-001', source: 'events_concert', category: 'concert', region: 'seoul', title: 'BTS 월드투어 서울 콘서트', venue: '고척 스카이돔', venueAddress: '서울 구로구 경인로 430', startDate: '2026-08-22', endDate: '2026-08-24', endTime: '22:30', expectedAttendees: 25000, surgeExpected: true, tags: ['BTS', '콘서트', '고척'] },
  ],
  events_convention: [
    { id: 'convention-001', source: 'events_convention', category: 'exhibition', region: 'seoul', title: '코리아 IT 엑스포 2026', venue: 'COEX 전시장', venueAddress: '서울 강남구 봉은사로 524', startDate: '2026-07-23', endDate: '2026-07-26', endTime: '18:00', expectedAttendees: 15000, surgeExpected: false, tags: ['IT', '전시', '코엑스'] },
    { id: 'convention-002', source: 'events_convention', category: 'exhibition', region: 'gyeonggi', title: '2026 서울 모터쇼', venue: 'KINTEX', venueAddress: '경기 고양시 일산서구 킨텍스로 217-60', startDate: '2026-09-10', endDate: '2026-09-20', endTime: '19:00', expectedAttendees: 60000, surgeExpected: true, tags: ['자동차', '모터쇼', '킨텍스'] },
  ],
  events_outdoor: [
    { id: 'outdoor-001', source: 'events_outdoor', category: 'outdoor', region: 'seoul', title: '보라매공원 야외음악회', venue: '보라매공원 야외공연장', venueAddress: '서울 동작구 신대방동 395', startDate: '2026-07-12', endDate: '2026-07-12', endTime: '21:00', expectedAttendees: 5000, surgeExpected: false, tags: ['야외', '음악회', '공원'] },
  ],
};

function parseKopisXml(xmlText: string): RawEvent[] {
  const events: RawEvent[] = [];
  const dbRegex = /<db>([\s\S]*?)<\/db>/g;
  let match;
  while ((match = dbRegex.exec(xmlText)) !== null) {
    const dbContent = match[1];
    const getValue = (tag: string) => {
      const tagRegex = new RegExp(`<${tag}>([\\s\\S]*?)<\/${tag}>`);
      const m = tagRegex.exec(dbContent);
      return m ? m[1].trim() : '';
    };
    const id = getValue('mt20id') || Math.random().toString(36).substring(7);
    const title = getValue('prfnm');
    const venue = getValue('fcltynm');
    const startDate = getValue('prfpdfrom')?.replace(/\./g, '-') || '';
    const endDate = getValue('prfpdto')?.replace(/\./g, '-') || '';
    const genre = getValue('genrenm') || '문화';
    const status = getValue('prfstate');
    
    if (title && venue) {
      events.push({
        id,
        source: 'events_kopis',
        category: genre.includes('뮤지컬') || genre.includes('연극') ? 'concert' : 'festival',
        region: 'seoul',
        title,
        venue,
        venueAddress: '서울시 공연장',
        startDate,
        endDate,
        endTime: '21:30',
        expectedAttendees: 1500,
        surgeExpected: true,
        tags: [genre, status]
      });
    }
  }
  return events;
}

// 이벤트 수집 및 필터링 함수
export async function fetchAggregatedEvents(filter: EventFilter = {}): Promise<RawEvent[]> {
  const today = new Date().toISOString().slice(0, 10);
  const targetDate = filter.date || today;

  const allEvents: RawEvent[] = [];
  
  // 1. Fetch KOPIS events if KOPIS key is available
  const kopisStatus = getApiStatus('events_kopis');
  if (KOPIS_API_KEY && !kopisStatus.sandboxMode) {
    try {
      const stdate = targetDate.replace(/-/g, '');
      const edDateObj = new Date(new Date(targetDate).getTime() + 90 * 24 * 60 * 60 * 1000);
      const eddate = edDateObj.toISOString().slice(0, 10).replace(/-/g, '');
      const url = `http://www.kopis.or.kr/openApi/restful/pblprfr?service=${KOPIS_API_KEY}&stdate=${stdate}&eddate=${eddate}&cpage=1&rows=10&shcate=GGGA`;
      const res = await fetch(url);
      if (res.ok) {
        const xmlText = await res.text();
        const kopisEvents = parseKopisXml(xmlText);
        allEvents.push(...kopisEvents);
        recordApiCall('events_kopis', true);
      } else {
        throw new Error('Kopis HTTP error');
      }
    } catch (err: any) {
      console.error('[ExternalAPI] Kopis fetch failed, using fallback:', err.message);
      recordApiCall('events_kopis', false);
      allEvents.push(...MOCK_EVENTS_BY_SOURCE.events_kopis);
    }
  } else {
    allEvents.push(...MOCK_EVENTS_BY_SOURCE.events_kopis);
  }

  // 1.5 Fetch Convention Events from Tour API (B551011)
  const conventionStatus = getApiStatus('events_convention');
  if (DATA_GO_KR_API_KEY && !conventionStatus?.sandboxMode) {
    try {
      // searchFestival1 or areaBasedList1
      const url = `https://apis.data.go.kr/B551011/KorService2/searchFestival1?serviceKey=${DATA_GO_KR_API_KEY}&MobileOS=ETC&MobileApp=AppTest&_type=json&eventStartDate=${targetDate.replace(/-/g, '')}`;
      const res = await fetch(url);
      if (res.ok) {
        const data: any = await res.json();
        const items = data.response?.body?.items?.item || [];
        const list = Array.isArray(items) ? items : [items];
        if (list.length > 0) {
          const conventionEvents = list.map((item: any) => ({
            id: item.contentid || Math.random().toString(36).substring(7),
            source: 'events_convention',
            category: 'festival',
            region: 'nationwide',
            title: item.title || '지역 축제',
            venue: item.addr1 || '행사장',
            venueAddress: item.addr1 || item.addr2 || '',
            startDate: item.eventstartdate ? `${item.eventstartdate.substring(0,4)}-${item.eventstartdate.substring(4,6)}-${item.eventstartdate.substring(6,8)}` : targetDate,
            endDate: item.eventenddate ? `${item.eventenddate.substring(0,4)}-${item.eventenddate.substring(4,6)}-${item.eventenddate.substring(6,8)}` : targetDate,
            endTime: '22:00',
            expectedAttendees: 5000,
            surgeExpected: true,
            tags: ['축제', '행사']
          }));
          allEvents.push(...conventionEvents);
          recordApiCall('events_convention', true);
        } else {
           allEvents.push(...MOCK_EVENTS_BY_SOURCE.events_convention);
        }
      } else {
        throw new Error('Tour API HTTP error');
      }
    } catch (err: any) {
      console.error('[ExternalAPI] Tour API fetch failed, using fallback:', err.message);
      recordApiCall('events_convention', false);
      allEvents.push(...MOCK_EVENTS_BY_SOURCE.events_convention);
    }
  } else {
    allEvents.push(...MOCK_EVENTS_BY_SOURCE.events_convention);
  }

  // 2. Add other event sources
  for (const [sourceId, events] of Object.entries(MOCK_EVENTS_BY_SOURCE)) {
    if (sourceId === 'events_kopis') continue;
    const statusInfo = getApiStatus(sourceId as any);
    if (!statusInfo) continue;
    recordApiCall(sourceId as any, true);
    allEvents.push(...events);
  }

  // 필터링 파이프라인
  let filtered = allEvents.filter(ev => {
    // 날짜 범위 필터
    if (ev.startDate > targetDate || ev.endDate < targetDate) return false;
    // 카테고리 필터
    if (filter.category && ev.category !== filter.category) return false;
    // 지역 필터
    if (filter.region && ev.region !== filter.region && ev.region !== 'nationwide') return false;
    // 급증 예상만 필터
    if (filter.surgeOnly && !ev.surgeExpected) return false;
    // 최소 예상 관람객 수 필터
    if (filter.minAttendees && (ev.expectedAttendees || 0) < filter.minAttendees) return false;
    return true;
  });

  // 예상 관람객 수 내림차순 정렬 (영향도 높은 순)
  filtered.sort((a, b) => (b.expectedAttendees || 0) - (a.expectedAttendees || 0));

  return filtered;
}

// G-PAN 핫존 연동용: 오늘 급증 예상 이벤트만 반환 (기존 LocalEvent 형식 호환)
export async function fetchLocalEvents(date: string): Promise<LocalEvent[]> {
  const events = await fetchAggregatedEvents({ date, surgeOnly: true });
  return events.map(ev => ({
    eventName: ev.title,
    location: ev.venue,
    endTime: ev.endTime,
    surgeExpected: ev.surgeExpected,
  }));
}

/**
 * G-PAN 실시간 교통 및 상황 맥락 정보를 컴파일하는 에이전트 유틸리티 (캐싱 적용)
 */
export async function compileGPanTrafficContext(query: string): Promise<string> {
  const cacheKey = `traffic_context_${query.trim().toLowerCase()}`;
  return withCache(cacheKey, 60, async () => {
    try {
      const q = query.toLowerCase();
      let lat = 37.5665;
      let lon = 126.9780;
      let regionName = '서울';
      let localRoad = '올림픽대로';
      let localAirport = '김포국제공항';
      let localStation = '서울역';

      if (q.includes('제주')) {
        lat = 33.4890;
        lon = 126.4983;
        regionName = '제주';
        localRoad = '평화로';
        localAirport = '제주국제공항';
        localStation = ''; // 제주에는 철도역이 없음
      } else if (q.includes('부산')) {
        lat = 35.1796;
        lon = 129.0756;
        regionName = '부산';
        localRoad = '동서고가로';
        localAirport = '김해국제공항';
        localStation = '부산역';
      } else if (q.includes('인천')) {
        lat = 37.4563;
        lon = 126.7052;
        regionName = '인천';
        localRoad = '경인고속도로';
        localAirport = '인천국제공항';
        localStation = '인천역';
      } else if (q.includes('대구')) {
        lat = 35.8714;
        lon = 128.6014;
        regionName = '대구';
        localRoad = '신천대로';
        localAirport = '대구국제공항';
        localStation = '동대구역';
      } else if (q.includes('광주')) {
        lat = 35.1595;
        lon = 126.8526;
        regionName = '광주';
        localRoad = '빛고을대로';
        localAirport = '광주공항';
        localStation = '광주송정역';
      } else if (q.includes('대전')) {
        lat = 36.3504;
        lon = 127.3845;
        regionName = '대전';
        localRoad = '한밭대로';
        localAirport = '';
        localStation = '대전역';
      } else if (q.includes('울산')) {
        lat = 35.5389;
        lon = 129.3114;
        regionName = '울산';
        localRoad = '산업로';
        localAirport = '';
        localStation = '울산역';
      }

      // 1. 날씨 호출 (좌표 반영)
      const weather = await fetchWeather(lat, lon);

      // 2. 교통 호출 (지역 맞춤형 가공)
      const trafficRaw = await fetchTrafficInfo();
      const traffic = {
        roadName: regionName !== '서울' ? localRoad : trafficRaw.roadName,
        speed: regionName !== '서울' ? Math.floor(Math.random() * 30 + 45) : trafficRaw.speed, // 서울 외 지역은 원활한 속도 시뮬레이션
        status: regionName !== '서울' ? ('원활' as const) : trafficRaw.status,
        message: regionName !== '서울' 
          ? `현재 ${localRoad} 전 구간 교통 흐름이 원활합니다.` 
          : trafficRaw.message
      };

      // 3. 공항 호출 (지역 맞춤형 가공)
      const flightsRaw = await fetchAirportFlights();
      const flights = flightsRaw.map(f => {
        if (regionName === '제주') {
          return { ...f, airport: '제주국제공항', flightName: f.flightName.replace('제주발', '김포발') };
        } else if (regionName !== '서울') {
          return { ...f, airport: localAirport || f.airport };
        }
        return f;
      });

      // 4. 열차 호출 (지역 맞춤형 가공)
      const trainsRaw = await fetchTrainStatus();
      const trains = localStation 
        ? trainsRaw.map(t => ({ ...t, station: localStation })) 
        : [];

      let context = `현재 기상 상태: ${weather.conditionStr} (온도: ${weather.temperature}°C, 강수 확률: ${weather.precipitationProbability}%)\n`;
      context += `실시간 도로 교통 상황: [${traffic.roadName}] 평균 속도 ${traffic.speed}km/h (${traffic.status}) - ${traffic.message}\n`;
      
      const activeFlights = flights.filter(f => f.status === '지연' || f.status === '결항');
      if (activeFlights.length > 0) {
        context += `주요 항공편 이슈: ${activeFlights.map(f => `${f.flightName} ${f.status} (${f.passengerCountEst}명 예상)`).join(', ')}\n`;
      } else {
        context += `주요 항공편 이슈: 없음 (정상 운행 중)\n`;
      }

      if (trains.length > 0) {
        const activeTrains = trains.filter(t => t.surgeLevel === 'HIGH');
        if (activeTrains.length > 0) {
          context += `주요 열차 밀집역: ${activeTrains.map(t => `${t.station} (${t.trainName} 도착 예정, 혼잡도 높음)`).join(', ')}\n`;
        }
      } else {
        context += `주요 열차 밀집역: 해당 지역 열차 노선 없음\n`;
      }

      return context;
    } catch (err: any) {
      console.error('[ExternalAPI] compileGPanTrafficContext failed:', err.message);
      return `실시간 교통 데이터 및 기상 정보 수집 실패 (대체 Mock 데이터 적용 중)`;
    }
  });
}

/**
 * Kakao Maps API를 이용해 위/경도 좌표를 구/동 단위 주소로 변환하는 역지오코딩 서비스
 */
export async function reverseGeocode(lat: number, lon: number): Promise<{ region: string; fullAddress: string }> {
  const KAKAO_MAP_API_KEY = process.env.KAKAO_MAP_API_KEY || '';

  if (KAKAO_MAP_API_KEY) {
    try {
      const url = `https://dapi.kakao.com/v2/local/geo/coord2address.json?x=${lon}&y=${lat}`;
      const res = await fetch(url, {
        headers: { Authorization: `KakaoAK ${KAKAO_MAP_API_KEY}` }
      });
      if (res.ok) {
        const data: any = await res.json();
        const doc = data.documents?.[0];
        if (doc) {
          const region = `${doc.address?.region_1depth_name || ''} ${doc.address?.region_2depth_name || ''} ${doc.address?.region_3depth_name || ''}`.trim();
          const fullAddress = doc.road_address?.address_name || doc.address?.address_name || region;
          return { region, fullAddress };
        }
      }
    } catch (err: any) {
      console.warn('[Geocoding] Kakao reverseGeocode failed, using fallback:', err.message);
    }
  }

  // Fallback Mock based on coordinates proximity
  if (Math.abs(lat - 33.4890) < 0.2 && Math.abs(lon - 126.4983) < 0.2) {
    return { region: '제주특별자치도 제주시 아라동', fullAddress: '제주특별자치도 제주시 아라동' };
  } else if (Math.abs(lat - 35.1796) < 0.2 && Math.abs(lon - 129.0756) < 0.2) {
    return { region: '부산광역시 연제구 연산동', fullAddress: '부산광역시 연제구 연산동' };
  } else if (Math.abs(lat - 37.4563) < 0.2 && Math.abs(lon - 126.7052) < 0.2) {
    return { region: '인천광역시 남동구 구월동', fullAddress: '인천광역시 남동구 구월동' };
  }
  
  return { region: '서울특별시 강남구 역삼동', fullAddress: '서울특별시 강남구 역삼동' };
}


