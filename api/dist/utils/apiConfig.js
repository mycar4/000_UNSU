// api/src/utils/apiConfig.ts
// 초기 인메모리 설정
const configStore = {
    // ── 인프라/지도 ────────────────────────────────────────
    address: {
        id: 'address', name: '주소 검색', provider: 'Daum Postcode', group: '인프라/지도',
        sandboxMode: false, health: 'OK', callsToday: 0, note: 'JS SDK - Key 불필요'
    },
    deeplink: {
        id: 'deeplink', name: '내비게이션 딥링크', provider: 'TMap / KakaoNavi', group: '인프라/지도',
        sandboxMode: false, health: 'OK', callsToday: 0, note: 'URL Scheme - Key 불필요'
    },
    // ── 금융/세무 ────────────────────────────────────────
    fintech: {
        id: 'fintech', name: '핀테크/세무 스크래핑', provider: 'CODEF', group: '금융/세무',
        envKey: 'CODEF_API_KEY', sandboxMode: true, health: 'OK', callsToday: 0, note: '샌드박스 전용'
    },
    // ── 기상 ────────────────────────────────────────
    weather: {
        id: 'weather', name: '실시간 기상 정보', provider: 'Open-Meteo', group: '기상',
        sandboxMode: false, health: 'OK', callsToday: 0, note: '완전 무료 - Key 불필요'
    },
    // ── 교통 - 도로 ─────────────────────────────────────
    traffic: {
        id: 'traffic', name: '국가 도로 교통 정보', provider: '국토교통부 ITS', group: '교통 - 도로',
        envKey: 'ITS_API_KEY', sandboxMode: false, health: 'OK', callsToday: 0
    },
    // ── 교통 - 대중교통 ──────────────────────────────────
    trains: {
        id: 'trains', name: 'KTX/일반열차 운행 정보', provider: '코레일', group: '교통 - 대중교통',
        envKey: 'KORAIL_API_KEY', sandboxMode: false, health: 'OK', callsToday: 0
    },
    subway_seoul: {
        id: 'subway_seoul', name: '서울 지하철 실시간', provider: '서울 열린데이터광장', group: '교통 - 대중교통',
        envKey: 'SEOUL_SUBWAY_API_KEY', sandboxMode: false, health: 'OK', callsToday: 0, note: '1~9호선 실시간 위치'
    },
    subway_metro: {
        id: 'subway_metro', name: '수도권 광역전철 정보', provider: '공공데이터포털 TAGO', group: '교통 - 대중교통',
        envKey: 'METRO_API_KEY', sandboxMode: false, health: 'OK', callsToday: 0, note: '수인분당·경의중앙·공항철도 포함'
    },
    // ── 교통 - 항공 ─────────────────────────────────────
    airport: {
        id: 'airport', name: '항공편 출도착 정보', provider: '인천/한국공항공사', group: '교통 - 항공',
        envKey: 'AIRPORT_API_KEY', sandboxMode: false, health: 'OK', callsToday: 0
    },
    // ── 생활편의 ────────────────────────────────────────
    restrooms: {
        id: 'restrooms', name: '개방 화장실 위치', provider: '행정안전부', group: '생활편의',
        envKey: 'RESTROOM_API_KEY', sandboxMode: false, health: 'OK', callsToday: 0
    },
    opinet: {
        id: 'opinet', name: '오피넷 최저가 주유소', provider: '한국석유공사', group: '생활편의',
        envKey: 'OPINET_API_KEY', sandboxMode: false, health: 'OK', callsToday: 0
    },
    // ── 문화행사 - 전국 ──────────────────────────────────
    events_kopis: {
        id: 'events_kopis', name: '공연예술 (KOPIS)', provider: '공연예술통합전산망', group: '문화행사 - 전국',
        envKey: 'KOPIS_API_KEY', sandboxMode: false, health: 'OK', callsToday: 0, note: '뮤지컬·연극·클래식 전국 공연'
    },
    events_culture: {
        id: 'events_culture', name: '전국 문화행사', provider: '한국문화정보원', group: '문화행사 - 전국',
        envKey: 'DATA_GO_KR_API_KEY', sandboxMode: false, health: 'OK', callsToday: 0, note: '공공데이터포털 통합키 사용'
    },
    // ── 문화행사 - 지역별 ────────────────────────────────
    events_seoul: {
        id: 'events_seoul', name: '서울시 문화행사', provider: '서울 열린데이터광장', group: '문화행사 - 지역별',
        envKey: 'SEOUL_OPEN_API_KEY', sandboxMode: false, health: 'OK', callsToday: 0, note: '서울시 주최 공연·전시·축제'
    },
    events_gyeonggi: {
        id: 'events_gyeonggi', name: '경기도 문화행사', provider: '경기데이터드림', group: '문화행사 - 지역별',
        envKey: 'GYEONGGI_API_KEY', sandboxMode: false, health: 'OK', callsToday: 0
    },
    events_busan: {
        id: 'events_busan', name: '부산시 관광/문화', provider: '부산 공공데이터', group: '문화행사 - 지역별',
        envKey: 'DATA_GO_KR_API_KEY', sandboxMode: false, health: 'OK', callsToday: 0, note: '공공데이터포털 통합키 사용'
    },
    events_incheon: {
        id: 'events_incheon', name: '인천시 문화행사', provider: '인천 공공데이터', group: '문화행사 - 지역별',
        envKey: 'DATA_GO_KR_API_KEY', sandboxMode: false, health: 'OK', callsToday: 0, note: '공공데이터포털 통합키 사용'
    },
    // ── 문화행사 - 목적별 ────────────────────────────────
    events_sports: {
        id: 'events_sports', name: '스포츠 경기 일정', provider: '공공데이터포털/KSPO', group: '문화행사 - 목적별',
        envKey: 'DATA_GO_KR_API_KEY', sandboxMode: false, health: 'OK', callsToday: 0, note: 'KBO·K리그·KBL 경기 종료 시간 감지'
    },
    events_concert: {
        id: 'events_concert', name: '대형 콘서트/페스티벌', provider: '공연예술통합전산망 + KOPIS', group: '문화행사 - 목적별',
        envKey: 'KOPIS_API_KEY', sandboxMode: false, health: 'OK', callsToday: 0, note: '수용인원 5000명↑ 대형 이벤트'
    },
    events_convention: {
        id: 'events_convention', name: '국제 전시/컨벤션', provider: '한국관광공사 TourAPI', group: '문화행사 - 목적별',
        envKey: 'TOUR_API_KEY', sandboxMode: false, health: 'OK', callsToday: 0, note: 'COEX·KINTEX·BEXCO 전시회'
    },
    events_outdoor: {
        id: 'events_outdoor', name: '야외 축제/행사', provider: '한국문화정보원', group: '문화행사 - 목적별',
        envKey: 'DATA_GO_KR_API_KEY', sandboxMode: false, health: 'OK', callsToday: 0, note: '공원·광장·한강 야외 행사'
    },
};
export function getApiStatusList() {
    return Object.values(configStore);
}
export function getApiStatusByGroup() {
    const grouped = {};
    for (const api of Object.values(configStore)) {
        if (!grouped[api.group])
            grouped[api.group] = [];
        grouped[api.group].push(api);
    }
    return grouped;
}
export function getApiStatus(id) {
    return configStore[id];
}
export function toggleSandboxMode(id, sandboxMode) {
    if (configStore[id]) {
        configStore[id].sandboxMode = sandboxMode;
    }
}
export function toggleGroupSandboxMode(group, sandboxMode) {
    for (const api of Object.values(configStore)) {
        if (api.group === group) {
            api.sandboxMode = sandboxMode;
        }
    }
}
export function recordApiCall(id, success) {
    if (configStore[id]) {
        configStore[id].callsToday += 1;
        configStore[id].health = success ? 'OK' : 'ERROR';
        configStore[id].lastChecked = new Date().toISOString();
    }
}
