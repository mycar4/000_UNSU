import { z } from 'zod';
import { getApiStatus, recordApiCall } from '../utils/apiConfig.js';
import { withCache } from '../utils/cache.js';
import { WeatherDataSchema, TrafficInfoSchema, FlightInfoSchema, TrainInfoSchema } from '../schemas/radar.js';
export async function fetchWeather(lat = 37.5665, lon = 126.9780) {
    const status = getApiStatus('weather');
    if (status.sandboxMode) {
        recordApiCall('weather', true);
        return { temperature: 24.5, weatherCode: 0, precipitationProbability: 10, conditionStr: '맑음' };
    }
    try {
        const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,weather_code,precipitation&hourly=precipitation_probability&timezone=Asia%2FSeoul`;
        const response = await fetch(url);
        if (!response.ok)
            throw new Error('Weather API failed');
        const data = await response.json();
        const temp = data.current?.temperature_2m || 0;
        const code = data.current?.weather_code || 0;
        const precipProb = data.hourly?.precipitation_probability?.[0] || 0;
        let conditionStr = '맑음';
        if (code === 1 || code === 2 || code === 3)
            conditionStr = '구름 많음';
        else if (code >= 50 && code <= 69)
            conditionStr = '비';
        else if (code >= 71 && code <= 77)
            conditionStr = '눈';
        else if (code >= 95)
            conditionStr = '뇌우';
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
        return parsed.data;
    }
    catch (err) {
        console.error('[ExternalAPI] Weather fetch failed, fallback to mock.', err.message);
        recordApiCall('weather', false);
        return { temperature: 24.5, weatherCode: 0, precipitationProbability: 10, conditionStr: '맑음' };
    }
}
const ITS_API_KEY = process.env.ITS_API_KEY || '';
export async function fetchTrafficInfo() {
    const statusInfo = getApiStatus('traffic');
    if (statusInfo.sandboxMode) {
        recordApiCall('traffic', true);
        return { roadName: '강변북로', speed: 35, status: '서행', message: '성수대교 부근에서 부분적인 서행이 감지됩니다.' };
    }
    if (ITS_API_KEY) {
        try {
            const url = `https://openapi.its.go.kr:9443/trafficInfo?apiKey=${ITS_API_KEY}&type=all&dType=1&minX=126.8&maxX=127.2&minY=37.4&maxY=37.7`;
            const response = await fetch(url);
            if (response.ok) {
                const payload = {
                    roadName: '올림픽대로',
                    speed: 25,
                    status: '정체',
                    message: '현재 여의도 구간에서 가양대교 방면으로 정체가 발생하고 있습니다.'
                };
                const parsed = TrafficInfoSchema.safeParse(payload);
                if (!parsed.success) {
                    console.warn('[Zod Validation] Traffic validation failed:', parsed.error.errors);
                    throw new Error('Traffic data schema validation failed');
                }
                recordApiCall('traffic', true);
                return parsed.data;
            }
        }
        catch (err) {
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
const DATA_GO_KR_API_KEY = process.env.DATA_GO_KR_API_KEY || '';
export async function fetchAirportFlights() {
    const statusInfo = getApiStatus('airport');
    recordApiCall('airport', true); // Currently all fallback, so always success or simulate
    const rawFlights = [
        { airport: '김포공항 (국내선)', flightName: 'KE1234 (제주발)', expectedArrivalTime: '18:45', status: '지연', passengerCountEst: 280 },
        { airport: '인천공항 (제1터미널)', flightName: 'OZ541 (프랑크푸르트발)', expectedArrivalTime: '19:10', status: '정상', passengerCountEst: 350 }
    ];
    const parsed = z.array(FlightInfoSchema).safeParse(rawFlights);
    if (!parsed.success) {
        console.warn('[Zod Validation] Flight validation failed:', parsed.error.errors);
        return [];
    }
    return parsed.data;
}
export async function fetchTrainStatus() {
    const statusInfo = getApiStatus('trains');
    recordApiCall('trains', true);
    const rawTrains = [
        { station: '서울역', trainName: 'KTX 124 (부산발)', arrivalTime: '19:30', surgeLevel: 'HIGH' },
        { station: '수서역', trainName: 'SRT 312 (광주송정발)', arrivalTime: '19:45', surgeLevel: 'MEDIUM' }
    ];
    const parsed = z.array(TrainInfoSchema).safeParse(rawTrains);
    if (!parsed.success) {
        console.warn('[Zod Validation] Train validation failed:', parsed.error.errors);
        return [];
    }
    return parsed.data;
}
const OPINET_API_KEY = process.env.OPINET_API_KEY || '';
export async function fetchNearbyGasStations(lat = 37.5665, lon = 126.9780, fuelType = 'LPG') {
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
        if (!res.ok)
            throw new Error('Opinet API failed');
        const data = await res.json();
        const items = data.RESULT?.OIL || [];
        recordApiCall('opinet', true);
        return items.map((item, idx) => ({
            name: item.OS_NM || `주유소 ${idx + 1}`,
            brand: item.POLL_DIV_NM || '기타',
            address: item.NEW_ADR || '',
            distanceM: Math.round(Math.random() * 2000 + 200), // 실제는 Haversine 계산 필요
            pricePerLiter: Number(item.PRICE) || 1030,
            fuelType,
            isOpen: true,
        }));
    }
    catch (err) {
        console.error('[ExternalAPI] Opinet fetch failed:', err.message);
        recordApiCall('opinet', false);
        return [
            { name: '서울 에너지 충전소', brand: 'E1', address: '서울 마포구 상암동 48-2', distanceM: 320, pricePerLiter: 1021, fuelType: 'LPG', isOpen: true },
            { name: '상암 LPG 충전소', brand: 'SK가스', address: '서울 마포구 월드컵북로 366', distanceM: 850, pricePerLiter: 1034, fuelType: 'LPG', isOpen: true },
        ];
    }
}
export async function fetchPublicRestrooms(lat, lon) {
    const statusInfo = getApiStatus('restrooms');
    recordApiCall('restrooms', true);
    // Sandbox Fallback
    return [
        { name: '여의도 한강공원 제3화장실', address: '서울 영등포구 여의동로 330', distanceMeter: 450, open24Hours: true, parkingAvailable: true },
        { name: '마포역 개방화장실', address: '서울 마포구 도화동', distanceMeter: 1200, open24Hours: false, parkingAvailable: false }
    ];
}
const SEOUL_SUBWAY_API_KEY = process.env.SEOUL_SUBWAY_API_KEY || '';
const METRO_API_KEY = process.env.METRO_API_KEY || '';
export async function fetchSeoulSubway() {
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
        if (!res.ok)
            throw new Error('Seoul subway API failed');
        const data = await res.json();
        const items = data.realtimeArrivalList || [];
        recordApiCall('subway_seoul', true);
        return items.map((item) => ({
            source: 'seoul',
            stationName: item.statnNm || '강남',
            lineNum: item.subwayNm || '',
            trainStatus: item.arvlMsg2 || '',
            destinationName: item.bstatnNm || '',
            surgeLevel: 'MEDIUM'
        }));
    }
    catch (err) {
        console.error('[ExternalAPI] Seoul subway failed:', err.message);
        recordApiCall('subway_seoul', false);
        return [
            { source: 'seoul', stationName: '강남', lineNum: '2호선', trainStatus: '진입', destinationName: '성수', surgeLevel: 'HIGH' },
        ];
    }
}
export async function fetchMetroSubway() {
    const status = getApiStatus('subway_metro');
    recordApiCall('subway_metro', true);
    // 수도권 광역전철 (TAGO) - Key 발급 후 실연동 예정
    return [
        { source: 'metro', stationName: '수원', lineNum: '경부선', trainStatus: '도착', destinationName: '서울', surgeLevel: 'MEDIUM' },
        { source: 'metro', stationName: '인천', lineNum: '공항철도', trainStatus: '출발', destinationName: '서울역', surgeLevel: 'LOW' },
    ];
}
// 각 소스별 Mock 이벤트 데이터
const MOCK_EVENTS_BY_SOURCE = {
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
// 이벤트 수집 및 필터링 함수
export async function fetchAggregatedEvents(filter = {}) {
    const today = new Date().toISOString().slice(0, 10);
    const targetDate = filter.date || today;
    // 각 소스 병렬 수집 (현재는 Mock, API Key 등록 후 실API 전환)
    const allEvents = [];
    for (const [sourceId, events] of Object.entries(MOCK_EVENTS_BY_SOURCE)) {
        const statusInfo = getApiStatus(sourceId);
        if (!statusInfo)
            continue;
        recordApiCall(sourceId, true);
        allEvents.push(...events);
    }
    // 필터링 파이프라인
    let filtered = allEvents.filter(ev => {
        // 날짜 범위 필터
        if (ev.startDate > targetDate || ev.endDate < targetDate)
            return false;
        // 카테고리 필터
        if (filter.category && ev.category !== filter.category)
            return false;
        // 지역 필터
        if (filter.region && ev.region !== filter.region && ev.region !== 'nationwide')
            return false;
        // 급증 예상만 필터
        if (filter.surgeOnly && !ev.surgeExpected)
            return false;
        // 최소 예상 관람객 수 필터
        if (filter.minAttendees && (ev.expectedAttendees || 0) < filter.minAttendees)
            return false;
        return true;
    });
    // 예상 관람객 수 내림차순 정렬 (영향도 높은 순)
    filtered.sort((a, b) => (b.expectedAttendees || 0) - (a.expectedAttendees || 0));
    return filtered;
}
// G-PAN 핫존 연동용: 오늘 급증 예상 이벤트만 반환 (기존 LocalEvent 형식 호환)
export async function fetchLocalEvents(date) {
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
export async function compileGPanTrafficContext(query) {
    const cacheKey = `traffic_context_${query.trim().toLowerCase()}`;
    return withCache(cacheKey, 60, async () => {
        try {
            const [weather, traffic, flights, trains] = await Promise.all([
                fetchWeather(),
                fetchTrafficInfo(),
                fetchAirportFlights(),
                fetchTrainStatus()
            ]);
            let context = `현재 기상 상태: ${weather.conditionStr} (온도: ${weather.temperature}°C, 강수 확률: ${weather.precipitationProbability}%)\n`;
            context += `실시간 도로 교통 상황: [${traffic.roadName}] 평균 속도 ${traffic.speed}km/h (${traffic.status}) - ${traffic.message}\n`;
            const activeFlights = flights.filter(f => f.status === '지연' || f.status === '결항');
            if (activeFlights.length > 0) {
                context += `주요 항공편 이슈: ${activeFlights.map(f => `${f.flightName} ${f.status} (${f.passengerCountEst}명 예상)`).join(', ')}\n`;
            }
            else {
                context += `주요 항공편 이슈: 없음 (정상 운행 중)\n`;
            }
            const activeTrains = trains.filter(t => t.surgeLevel === 'HIGH');
            if (activeTrains.length > 0) {
                context += `주요 열차 밀집역: ${activeTrains.map(t => `${t.station} (${t.trainName} 도착 예정, 혼잡도 높음)`).join(', ')}\n`;
            }
            return context;
        }
        catch (err) {
            console.error('[ExternalAPI] compileGPanTrafficContext failed:', err.message);
            return `실시간 교통 데이터 및 기상 정보 수집 실패 (대체 Mock 데이터 적용 중)`;
        }
    });
}
