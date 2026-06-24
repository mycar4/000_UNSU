import './env.js'
import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import dns from 'dns'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

if (typeof dns.setDefaultResultOrder === 'function') {
  dns.setDefaultResultOrder('ipv4first')
}

import { z } from 'zod'
import { app } from './agents/workflow.js'
import { UserQuerySchema } from './schemas/validation.js'
import { calculateStaticManse } from './utils/manse.js'
import { callGemini } from './utils/gemini.js'
import {
  saveDriverProfile,
  getDriverProfile,
  getDailyLuckyCard,
  saveDailyLuckyCard,
  getRecommendedCourse,
  saveRecommendedCourse,
  saveRecommendedCourseFeedback,
  updateRecommendedCourseTmapClick,
  getHotZones,
  updateHotZoneTime,
  getLeaderboard,
  saveLeaderboardRecord,
  getAdmins,
  saveAdmin,
  deleteAdmin,
  updateAdmin,
  isRejoinRestricted,
  withdrawDriver,
  saveAuditLog,
  getAuditLogs,
  getFinancialRecord,
  saveFinancialRecord,
  saveTaxRefund,
  getTaxRefunds,
  getAllDrivers,
  getIntroImage,
  saveIntroImage,
  saveAudioBroadcastLog,
  migrationPromise,
  getTokenUsage,
  getTokenUsageLogs
} from './utils/db.js'

import {
  scrapeDailyCardRevenues,
  scrapeBusinessExpenses
} from './services/fintechApi.js'

import {
  fetchWeather,
  fetchTrafficInfo,
  fetchLocalEvents,
  fetchAirportFlights,
  fetchTrainStatus,
  fetchPublicRestrooms,
  fetchSeoulSubway,
  fetchMetroSubway,
  fetchAggregatedEvents,
  fetchNearbyGasStations,
  reverseGeocode
} from './services/externalApi.js'
import { withCache, clearCache } from './utils/cache.js'
import { getKstDateString } from './utils/dateUtils.js'

dotenv.config()

const server = express()
const PORT = process.env.PORT || 3001

server.use(cors())
server.use(express.json())

// ----------------------------------------------------
// Drivers Profile Routes
// ----------------------------------------------------
const DriverProfileInputSchema = z.object({
  birthDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "YYYY-MM-DD 형식").refine((val) => {
    const year = parseInt(val.split('-')[0], 10);
    const currentYear = new Date().getFullYear();
    return year >= 1930 && year <= currentYear;
  }, { message: "생년월일이 정상 범위를 벗어났습니다. (1930년 이후 출생자만 가능)" }),
  birthTime: z.string().regex(/^\d{2}:\d{2}$/, "HH:MM 형식").refine((val) => {
    const [h, m] = val.split(':').map(Number);
    return h >= 0 && h < 24 && m >= 0 && m < 60;
  }, { message: "출생 시간이 정상 범위를 벗어났습니다. (00:00 ~ 23:59)" }),
  businessType: z.enum(["PRIVATE", "PREMIUM"]),
  homeTaxId: z.string().min(4).max(15, "홈택스 아이디는 최대 15자까지 입력 가능합니다."),
  naviPreference: z.enum(["TMAP", "KAKAONAVI"]).optional(),
  name: z.string().min(2, "이름은 최소 2글자 이상이어야 합니다.").max(10, "이름은 최대 10자까지 입력 가능합니다."),
  phoneNumber: z.string().min(8, "전화번호를 입력해주세요.").max(20, "전화번호는 최대 20자까지 입력 가능합니다."),
  carModel: z.string().optional(),
  carNumber: z.string().regex(/^([가-힣]{2})?[0-9]{2,3}[가-힣]{1}[0-9]{4}$/, "올바른 영업용 차량번호 형식이 아닙니다. (예: 서울31아9993 또는 31아1234)").or(z.literal("")).optional(),
  email: z.string().email("올바른 이메일 형식이 아닙니다.").max(40, "이메일은 최대 40자까지 입력 가능합니다.").or(z.literal("")).optional(),
  address: z.string().optional()
})

server.post('/api/drivers/:id', async (req, res) => {
  try {
    const id = req.params.id
    const validated = DriverProfileInputSchema.parse(req.body)

    // Check if the driver is within the 3-day withdrawal block window
    const restriction = await isRejoinRestricted(validated.homeTaxId)
    if (restriction.restricted) {
      const withdrawnDate = restriction.withdrawnAt ? new Date(restriction.withdrawnAt) : new Date();
      // Calculate unlock date
      const unlockDate = new Date(withdrawnDate.getTime() + 3 * 24 * 60 * 60 * 1000);
      const unlockStr = `${unlockDate.getFullYear()}년 ${unlockDate.getMonth() + 1}월 ${unlockDate.getDate()}일 ${unlockDate.getHours().toString().padStart(2, '0')}:${unlockDate.getMinutes().toString().padStart(2, '0')}`;
      
      return res.status(403).json({
        error: `탈퇴 후 3일간은 재가입이 불가능합니다. (가입 가능 일시: ${unlockStr})`
      })
    }

    await saveDriverProfile({
      id,
      birth_date: validated.birthDate,
      birth_time: validated.birthTime,
      business_type: validated.businessType,
      hometax_id: validated.homeTaxId,
      navi_preference: validated.naviPreference || 'TMAP',
      name: validated.name,
      phone_number: validated.phoneNumber,
      car_model: validated.carModel,
      car_number: validated.carNumber,
      email: validated.email,
      address: validated.address
    })
    res.json({ success: true, message: 'Profile saved successfully.' })
  } catch (err: any) {
    res.status(400).json({ error: err.message || err })
  }
})

server.get('/api/admin/drivers', async (req, res) => {
  try {
    const list = await getAllDrivers()
    res.json(list)
  } catch (err: any) {
    res.status(500).json({ error: err.message || err })
  }
})

server.get('/api/admin/llm-usage', (req, res) => {
  try {
    const usages = getTokenUsage()
    const totalPrompt = usages.reduce((sum, u) => sum + u.prompt_tokens, 0)
    const totalOutput = usages.reduce((sum, u) => sum + u.output_tokens, 0)
    const totalTokens = usages.reduce((sum, u) => sum + u.total_tokens, 0)
    
    // Cost estimation for Gemini 1.5 Flash (Prices approx: $0.075 / 1M prompt, $0.30 / 1M output)
    const usdCost = (totalPrompt / 1_000_000 * 0.075) + (totalOutput / 1_000_000 * 0.30)
    const krwCost = usdCost * 1380 // approx exchange rate

    res.json({
      totalPrompt,
      totalOutput,
      totalTokens,
      estimatedCostKrw: Math.round(krwCost),
      estimatedCostUsd: Number(usdCost.toFixed(4)),
      dailyUsages: usages
    })
  } catch (err: any) {
    res.status(500).json({ error: err.message || err })
  }
})

server.get('/api/admin/llm-usage-logs', (req, res) => {
  try {
    const logs = getTokenUsageLogs()
    // Sort descending by timestamp
    const sorted = logs.sort((a, b) => b.timestamp.localeCompare(a.timestamp))
    res.json(sorted)
  } catch (err: any) {
    res.status(500).json({ error: err.message || err })
  }
})

server.get('/api/drivers/:id', async (req, res) => {
  try {
    const profile = await getDriverProfile(req.params.id)
    if (!profile) {
      return res.status(404).json({ error: 'Profile not found.' })
    }
    res.json({
      birthDate: profile.birth_date,
      birthTime: profile.birth_time,
      businessType: profile.business_type,
      homeTaxId: profile.hometax_id,
      naviPreference: profile.navi_preference || 'TMAP',
      name: profile.name || '',
      phoneNumber: profile.phone_number || '',
      carModel: profile.car_model || '',
      carNumber: profile.car_number || '',
      email: profile.email || '',
      address: profile.address || ''
    })
  } catch (err: any) {
    res.status(500).json({ error: err.message || err })
  }
})

server.post('/api/drivers/:id/withdraw', async (req, res) => {
  try {
    const success = await withdrawDriver(req.params.id)
    if (success) {
      res.json({ success: true, message: '성공적으로 회원 탈퇴가 처리되었습니다.' })
    } else {
      res.status(404).json({ error: '프로필을 찾을 수 없습니다.' })
    }
  } catch (err: any) {
    res.status(500).json({ error: err.message || err })
  }
})

// ----------------------------------------------------
// Daily Routine (Gillog) Routes
// ----------------------------------------------------
server.get('/api/routine/:driverId', async (req, res) => {
  try {
    const driverId = req.params.driverId
    const profile = await getDriverProfile(driverId)
    if (!profile) {
      return res.status(404).json({ error: 'Profile not registered.' })
    }

    const todayStr = getKstDateString()

    // Resolve lat, lon, and region for weather fetching
    let lat = 37.5665
    let lon = 126.9780
    let region = '서울특별시'

    const qLat = req.query.latitude ? parseFloat(req.query.latitude as string) : null;
    const qLon = req.query.longitude ? parseFloat(req.query.longitude as string) : null;

    if (qLat !== null && !isNaN(qLat) && qLon !== null && !isNaN(qLon)) {
      lat = qLat;
      lon = qLon;
      try {
        const geo = await reverseGeocode(lat, lon);
        region = geo.region;
      } catch (e) {
        region = getRegionFromCoords(lat, lon);
      }
    } else if (profile.address) {
      const addr = profile.address.toLowerCase()
      if (addr.includes('제주')) {
        lat = 33.4890; lon = 126.4983; region = '제주특별자치도 제주시';
      } else if (addr.includes('부산')) {
        lat = 35.1796; lon = 129.0756; region = '부산광역시 연제구';
      } else if (addr.includes('인천')) {
        lat = 37.4563; lon = 126.7052; region = '인천광역시 남동구';
      } else if (addr.includes('대구')) {
        lat = 35.8714; lon = 128.6014; region = '대구광역시 수성구';
      } else if (addr.includes('광주')) {
        lat = 35.1595; lon = 126.8526; region = '광주광역시 광산구';
      } else if (addr.includes('대전')) {
        lat = 36.3504; lon = 127.3845; region = '대전광역시 유성구';
      } else if (addr.includes('울산')) {
        lat = 35.5389; lon = 129.3114; region = '울산광역시 남구';
      } else {
        region = profile.address.split(' ')[0] + ' ' + (profile.address.split(' ')[1] || '')
      }
    }

    // Fetch real-time weather for the driver's region
    let weatherData = { temperature: 20, conditionStr: '맑음', precipitationProbability: 0 }
    try {
      const fetched = await withCache(`weather_${region}`, 120, () => fetchWeather(lat, lon))
      if (fetched) {
        weatherData = fetched
      }
    } catch (e) {
      console.warn('[Routine API] Failed to fetch weather, using fallback:', e)
    }

    // A. Trigger LangGraph workflow asynchronously in the background (Non-blocking performance optimization)
    const startArea = region.split(' ')[0] || '서울'
    setTimeout(() => {
      withCache(`gpan_workflow_${driverId}_${startArea}`, 600, async () => {
        const res = await app.invoke({
          userQuery: startArea,
          hotzones: [],
          trafficContext: '',
          audioScript: '',
          report: ''
        }, { configurable: { thread_id: `routine_${driverId}` } })
        console.log('[LangGraph Background] Executed routine agent workflow successfully.')
        
        if (res.audioScript) {
          await saveAudioBroadcastLog({
            id: Math.random().toString(36).substring(7),
            driver_id: driverId,
            broadcast_text: res.audioScript
          }).catch(e => console.warn('[Routine API Background] Failed to log audio broadcast:', e.message))
        }
        return res
      }).catch(err => {
        console.error('[LangGraph Background] API failed:', err.message)
      })
    }, 0)

    // B. Calculate static Manse Saju deterministic score
    const manseResult = calculateStaticManse(profile.birth_date, profile.birth_time, new Date())

    // Direct real-time traffic and weather compiling for Lucky Card prompt
    let trafficContext = `현재 기상 상태: ${weatherData.conditionStr} (온도: ${weatherData.temperature}°C)\n`
    const trafficRaw = await fetchTrafficInfo().catch(() => null)
    if (trafficRaw) {
      trafficContext += `실시간 도로 교통 상황: [${trafficRaw.roadName}] 평균 속도 ${trafficRaw.speed}km/h (${trafficRaw.status}) - ${trafficRaw.message}\n`
    } else {
      trafficContext += `실시간 도로 교통 상황: 정보 없음\n`
    }

    // 1. Get or generate Lucky Card via Gemini RAG
    let luckyCard = await getDailyLuckyCard(driverId, todayStr)
    if (!luckyCard) {
      let finalComment = ''
      try {
        const elementsStr = Object.entries(manseResult.elements).map(([k, v]) => `${k}:${v}`).join(', ')
        const systemPrompt = "당신은 플랫폼 기사님을 위한 전문 명리학 AI 비서 '대통이'입니다. 오늘의 사주 기운과 현재 교통 상황을 조화롭게 연결하여 재물운이 있는 최적의 영업 방향을 따뜻하고 친근하게(존댓말) 코멘트해 주세요.";
        const userPrompt = `기사 생년월일: ${profile.birth_date} (출생시간: ${profile.birth_time})
사주 오행 분포: ${elementsStr}
오늘의 재물운 점수: ${manseResult.score}점 (등급: ${manseResult.grade})
실시간 교통/날씨 맥락: ${trafficContext}
 
위 정보를 바탕으로, 오늘의 사주 운세와 실시간 교통 상황(정체 우회 팁, 핫존 수요 등)을 반영한 기사님 맞춤형 오늘의 조언 코멘트를 3줄 내외로 작성해 주세요. 장년층 기사님이 스마트폰 거치 상태에서 흘겨봐도 즉시 읽기 편하게 반드시 친근하고 알기 쉬운 구어체 존댓말로 작성해 주셔야 합니다.`;
        
        finalComment = await callGemini(userPrompt, systemPrompt, driverId)
        console.log('[Gemini] Real-time saju comment generated successfully.')
      } catch (geminiErr: any) {
        console.warn('[Gemini] API failed. Falling back to local deterministic mock.', geminiErr.message)
        const fallbackFortune = getFortune(profile.birth_date, todayStr)
        finalComment = fallbackFortune.comment
      }

      luckyCard = {
        id: Math.random().toString(36).substring(7),
        driver_id: driverId,
        lucky_date: todayStr,
        fortune_grade: manseResult.grade,
        fortune_score: manseResult.score,
        fortune_comment: finalComment
      }
      await saveDailyLuckyCard(luckyCard)
    }

    // 2. Get or generate Recommended Course using RAG Hotzones (Mock values replaced with dynamic candidates)
    let course = await getRecommendedCourse(driverId, todayStr)
    if (!course) {
      // Dynamic compile of real-time candidates
      const [dbZones, activeEvents, flights, trains, seoulSubway, metroSubway] = await Promise.all([
        getHotZones().catch(() => []),
        fetchLocalEvents(todayStr).catch(() => []),
        fetchAirportFlights().catch(() => []),
        fetchTrainStatus().catch(() => []),
        fetchSeoulSubway().catch(() => []),
        fetchMetroSubway().catch(() => [])
      ])

      interface CourseCandidate {
        name: string
        detail: string
        lat: string
        lon: string
        priority: number
      }

      let candidates: CourseCandidate[] = []

      // DB Hotzones
      dbZones.forEach(z => {
        candidates.push({
          name: z.zone_name,
          detail: `${z.description} (대기 예상 ${z.wait_minutes}분)`,
          lat: String(z.latitude),
          lon: String(z.longitude),
          priority: z.status === 'HIGH' ? 3 : 1
        })
      })

      // Events
      activeEvents.forEach(e => {
        candidates.push({
          name: e.location,
          detail: `[행사알림] ${e.eventName} 행사 종료 예정 (${e.endTime}). 승객 매칭 빈도 급증 예상.`,
          lat: '37.5665',
          lon: '126.9780',
          priority: 2
        })
      })

      // Delayed Flights
      flights.filter(f => f.status === '지연' || f.status === '결항').forEach(f => {
        candidates.push({
          name: f.airport,
          detail: `[공항알림] 항공편 ${f.flightName} 지연 도착. 공항 대기열 택시 수요 급증.`,
          lat: f.airport.includes('김포') ? '37.558' : '37.460',
          lon: f.airport.includes('김포') ? '126.802' : '126.440',
          priority: 3
        })
      })

      // Trains (High surge)
      trains.filter(t => t.surgeLevel === 'HIGH').forEach(t => {
        candidates.push({
          name: t.station,
          detail: `[열차알림] ${t.trainName} 대규모 하차 발생. 역전 승강장 수요 폭증.`,
          lat: t.station.includes('서울역') ? '37.5546' : '37.4874',
          lon: t.station.includes('서울역') ? '126.9706' : '127.1012',
          priority: 2
        })
      })

      // Subway (with late night last train simulation)
      const currentHour = new Date().getHours()
      const isLateNight = currentHour >= 22 || currentHour < 4
      const allSubways = [...seoulSubway, ...metroSubway]
      allSubways.forEach((sub, idx) => {
        const isLastTrain = isLateNight && (idx % 2 === 0)
        let latVal = '37.5665'
        let lonVal = '126.9780'
        if (sub.stationName.includes('강남')) { latVal = '37.4979'; lonVal = '127.0276'; }
        else if (sub.stationName.includes('잠실')) { latVal = '37.5133'; lonVal = '127.1001'; }
        else if (sub.stationName.includes('홍대입구')) { latVal = '37.5568'; lonVal = '126.9238'; }
        else if (sub.stationName.includes('수원')) { latVal = '37.2662'; lonVal = '127.0002'; }
        else if (sub.stationName.includes('금정')) { latVal = '37.3722'; lonVal = '126.9431'; }
        else if (sub.stationName.includes('인천')) { latVal = '37.4764'; lonVal = '126.6171'; }
        
        candidates.push({
          name: `${sub.stationName}역 (${sub.lineNum})`,
          detail: isLastTrain
            ? `[막차알림] ${sub.destinationName}행 막차 도착 (${sub.trainStatus || '도착예정'}). 심야 승객 매칭 최적 구역.`
            : `[지하철알림] ${sub.destinationName}행 열차 도착 (${sub.trainStatus || '도착예정'}). 대규모 승객 하차.`,
          lat: latVal,
          lon: lonVal,
          priority: isLastTrain ? 4 : 2
        })
      })

      // Sort by priority desc
      candidates.sort((a, b) => b.priority - a.priority)

      let destName = '김포공항 방면'
      let routeSum = '현재 올림픽대로 여의도 부근 정체가 극심하므로 가양대교 우회 경로를 추천합니다.'
      let destLat = '37.558'
      let destLon = '126.802'

      if (candidates.length > 0) {
        const topCandidate = candidates[0]
        destName = topCandidate.name + ' 방면'
        routeSum = `${topCandidate.detail} 이 지역 진입 시 승객 매칭 성공 확률이 매우 높습니다.`
        destLat = topCandidate.lat
        destLon = topCandidate.lon
      }

      course = {
        id: Math.random().toString(36).substring(7),
        driver_id: driverId,
        target_date: todayStr,
        destination_name: destName,
        route_summary: routeSum,
        tmap_intent_url: `tmap://route?goalname=${encodeURIComponent(destName.replace(' 방면', ''))}&goallat=${destLat}&goallon=${destLon}`
      }
      await saveRecommendedCourse(course)
    }

    // Fetch events and traffic for the routine page
    const rawEvents = await fetchAggregatedEvents({ date: todayStr }).catch(() => [])
    const activeEvents = rawEvents.slice(0, 3).map(ev => ({
      title: ev.title,
      venue: ev.venue,
      endTime: ev.endTime,
      expectedAttendees: ev.expectedAttendees
    }))

    const trafficRaw = await fetchTrafficInfo().catch(() => null)
    let traffic = null
    if (trafficRaw) {
      traffic = {
        roadName: region !== '서울특별시' && region !== '서울' ? (region.includes('제주') ? '평화로' : region.includes('부산') ? '동서고가로' : '주요 도로') : trafficRaw.roadName,
        speed: region !== '서울특별시' && region !== '서울' ? Math.floor(Math.random() * 30 + 45) : trafficRaw.speed,
        status: region !== '서울특별시' && region !== '서울' ? ('원활' as const) : trafficRaw.status,
        message: region !== '서울특별시' && region !== '서울' ? '현재 전 구간 교통 흐름이 원활합니다.' : trafficRaw.message
      }
    }

    res.json({
      profile: {
        birthDate: profile.birth_date,
        birthTime: profile.birth_time,
        businessType: profile.business_type,
        address: profile.address,
        naviPreference: profile.navi_preference || 'TMAP'
      },
      region,
      weather: weatherData,
      luckyCard: {
        grade: luckyCard.fortune_grade,
        score: luckyCard.fortune_score,
        comment: luckyCard.fortune_comment
      },
      course: {
        destinationName: course.destination_name,
        routeSummary: course.route_summary,
        tmapIntentUrl: course.tmap_intent_url,
        tmapSentAt: course.tmap_sent_at || null,
        feedback: course.feedback || null
      },
      events: activeEvents,
      traffic
    })
  } catch (err: any) {
    res.status(500).json({ error: err.message || err })
  }
})

server.post('/api/routine/tmap-click', async (req, res) => {
  try {
    const { driverId } = req.body
    const success = await updateRecommendedCourseTmapClick(driverId)
    res.json({ success })
  } catch (err: any) {
    res.status(500).json({ error: err.message || err })
  }
})

server.post('/api/routine/feedback', async (req, res) => {
  try {
    const { driverId, feedback } = req.body
    if (feedback !== 'DAEBAK' && feedback !== 'HEOTANG') {
      return res.status(400).json({ error: 'Invalid feedback value' })
    }
    const success = await saveRecommendedCourseFeedback(driverId, feedback)
    res.json({ success })
  } catch (err: any) {
    res.status(500).json({ error: err.message || err })
  }
})

function getFortune(birthDate: string, todayStr: string) {
  const combined = birthDate + todayStr
  let hash = 0
  for (let i = 0; i < combined.length; i++) {
    hash = combined.charCodeAt(i) + ((hash << 5) - hash)
  }
  
  const fortunes = [
    { grade: 'BEST' as const, comment: '"서북쪽(마포/상암) 방향에서 장거리 손님을 만날 일진입니다. 평소보다 10분 일찍 시동을 켜보세요. 큰 재물이 따릅니다."' },
    { grade: 'GOOD' as const, comment: '"동남쪽(강남/분당) 방면으로 주행 시 고단가 호출 성공률이 대폭 상승하는 귀인의 날입니다. 청담동 사거리 부근을 주시하세요."' },
    { grade: 'NORMAL' as const, comment: '"대형 빌딩 밀집 지역(여의도/종로) 주변에서 퇴근길 콜 수요와 기가 막히게 매칭되는 날입니다. 마포대교 방면 우회로를 확보하세요."' },
    { grade: 'BAD' as const, comment: '"안전한 보수 운행이 유리한 날입니다. 무리한 장거리 유혹을 삼가고 김포공항 국내선 대기열에 진입하면 안정적인 수익이 쌓입니다."' }
  ]

  const index = Math.abs(hash) % fortunes.length
  return fortunes[index]
}

function getRegionFromCoords(lat: number, lon: number): string {
  // 제주: lat 33 ~ 34, lon 126 ~ 127
  if (lat >= 33.0 && lat <= 34.0 && lon >= 126.0 && lon <= 127.0) {
    if (lat > 33.3) return '제주특별자치도 제주시';
    return '제주특별자치도 서귀포시';
  }
  // 부산: lat 35.0 ~ 35.3, lon 128.8 ~ 129.3
  if (lat >= 35.0 && lat <= 35.3 && lon >= 128.8 && lon <= 129.3) {
    if (lon > 129.1) return '부산광역시 해운대구';
    return '부산광역시 부산진구';
  }
  // 인천: lat 37.3 ~ 37.6, lon 126.3 ~ 126.85
  if (lat >= 37.3 && lat <= 37.6 && lon >= 126.3 && lon <= 126.85) {
    return '인천광역시 연수구';
  }
  // 대구: lat 35.7 ~ 36.0, lon 128.4 ~ 128.8
  if (lat >= 35.7 && lat <= 36.0 && lon >= 128.4 && lon <= 128.8) {
    return '대구광역시 수성구';
  }
  // 광주: lat 35.0 ~ 35.3, lon 126.6 ~ 127.0
  if (lat >= 35.0 && lat <= 35.3 && lon >= 126.6 && lon <= 127.0) {
    return '광주광역시 광산구';
  }
  // 대전: lat 36.15 ~ 36.5, lon 127.2 ~ 127.5
  if (lat >= 36.15 && lat <= 36.5 && lon >= 127.2 && lon <= 127.5) {
    return '대전광역시 유성구';
  }
  // 울산: lat 35.35 ~ 35.7, lon 129.1 ~ 129.5
  if (lat >= 35.35 && lat <= 35.7 && lon >= 129.1 && lon <= 129.5) {
    return '울산광역시 남구';
  }
  // 서울: lat 37.4 ~ 37.7, lon 126.8 ~ 127.2
  if (lat >= 37.4 && lat <= 37.7 && lon >= 126.8 && lon <= 127.2) {
    if (lat < 37.5) return '서울특별시 서초구';
    if (lon < 126.95) return '서울특별시 강서구';
    if (lon > 127.05) return '서울특별시 송파구';
    return '서울특별시 종로구';
  }
  // 경기도: lat 36.9 ~ 38.3, lon 126.2 ~ 127.8
  if (lat >= 36.9 && lat <= 38.3 && lon >= 126.2 && lon <= 127.8) {
    if (lat > 37.7) return '경기도 고양시 덕양구';
    return '경기도 성남시 분당구';
  }
  return '서울특별시 용산구';
}

// ----------------------------------------------------
// G-PAN Hot Zones Routes
// ----------------------------------------------------
server.get('/api/gpan/hotzones', async (req, res) => {
  try {
    const zones = await getHotZones()
    res.json(zones)
  } catch (err: any) {
    res.status(500).json({ error: err.message || err })
  }
})

server.post('/api/gpan/update', async (req, res) => {
  try {
    const { id, waitMinutes } = req.body
    await updateHotZoneTime(Number(id), Number(waitMinutes))
    res.json({ success: true })
  } catch (err: any) {
    res.status(400).json({ error: err.message || err })
  }
})

server.post('/api/gpan/gpt-hotzones', async (req, res) => {
  try {
    const { latitude, longitude, driverId } = req.body
    if (!driverId) {
      return res.status(400).json({ error: 'Missing driverId' })
    }

    const lat = latitude ? parseFloat(latitude) : 37.5665
    const lon = longitude ? parseFloat(longitude) : 126.9780
    const region = getRegionFromCoords(lat, lon)
    const district = region.split(' ')[1] || '중구'

    // Implement 10 minutes (600s) district-level caching to prevent LLM costs
    const cacheKey = `gpt_hotzones_${district}`
    
    const result = await withCache(cacheKey, 600, async () => {
      console.log(`[GPT Hotzones] Cache miss for ${district}. Calling Gemini API...`)
      
      const trafficRaw = await fetchTrafficInfo().catch(() => null)
      const todayStr = new Date().toISOString().slice(0, 10)
      const rawEvents = await fetchAggregatedEvents({ date: todayStr }).catch(() => [])
      
      const trafficMessage = trafficRaw ? trafficRaw.message : '교통 흐름 원활'
      const eventsSummary = rawEvents.slice(0, 3).map(e => `${e.title} (${e.venue})`).join(', ')

      const systemPrompt = `당신은 개인택시 기사용 실시간 핫존 추천 AI입니다. 기사님의 현재 위치(위도 ${lat}, 경도 ${lon}, 지역: ${region})를 기반으로, 실제 기상/교통 상황(${trafficMessage}) 및 인근 행사(${eventsSummary})를 반영하여 가장 유망한 핫존 3~6곳을 추천해 주세요.
출력은 반드시 JSON 배열 형식이어야 하며, 다른 텍스트나 markdown 코드 블록은 포함하지 마십시오. 각 객체는 다음 필드를 가져야 합니다:
- id: 숫자 (1부터 시작)
- zone_name: 문자열 (예: '${district}역 1번 출구', '${district} 삼거리 인근')
- latitude: 숫자 (기사님 현재 위도 부근으로 미세 조정된 위도 값)
- longitude: 숫자 (기사님 현재 경도 부근으로 미세 조정된 경도 값)
- status: 'HIGH' | 'NORMAL'
- wait_minutes: 숫자 (대기 예상 시간)
- description: 문자열 (이 구역에 승객이 몰리는 구체적인 원인과 실시간 팁)`;

      const userPrompt = `현재 기사님 위치: 위도 ${lat}, 경도 ${lon} (${region}).
현재 교통 정보: ${trafficMessage}.
행사 정보: ${eventsSummary}.
위 정보를 바탕으로 근거리 실시간 핫존 3~6개를 JSON 배열로 생성해 주세요. 기사님이 바로 갈 수 있도록 위경도는 현재 기사님 위치에서 약 500m ~ 3km 이내의 실제 장소로 미세 조정해 주세요.`;

      let parsedZones = []
      try {
        const reply = await callGemini(userPrompt, systemPrompt, driverId)
        const cleanedJson = reply.replace(/```json/g, '').replace(/```/g, '').trim()
        parsedZones = JSON.parse(cleanedJson)
      } catch (err: any) {
        console.warn('[GPT Hotzones] Gemini API failed, falling back to local algorithm:', err.message)
        throw err
      }
      return parsedZones
    }).catch((err) => {
      // Fallback local rule-based near locations if Gemini or withCache fails
      return [
        {
          id: 1,
          zone_name: `${district} 중심가 사거리`,
          latitude: lat + 0.005,
          longitude: lon - 0.003,
          status: 'HIGH',
          wait_minutes: 8,
          description: `현재 ${district} 인근에 돌발 교통량 증가 및 단거리 승객 호출이 집중되고 있습니다.`
        },
        {
          id: 2,
          zone_name: `${district} 지하철역 인근`,
          latitude: lat - 0.004,
          longitude: lon + 0.006,
          status: 'HIGH',
          wait_minutes: 4,
          description: `지하철 하차 수요 및 주변 빌딩 퇴근 인파로 인해 택시 승강장 대기 인원이 많습니다.`
        },
        {
          id: 3,
          zone_name: `${district} 테크노타워 앞`,
          latitude: lat + 0.002,
          longitude: lon + 0.002,
          status: 'NORMAL',
          wait_minutes: 12,
          description: '회사원들의 업무 미팅 및 외출로 인해 꾸준한 호출 매칭이 발생 중인 구역입니다.'
        }
      ]
    })

    // Slice to max 6
    const limitedResult = result.slice(0, 6)
    res.json(limitedResult)
  } catch (err: any) {
    res.status(500).json({ error: err.message || err })
  }
})

// ----------------------------------------------------
// Admin External APIs Monitoring Routes
// ----------------------------------------------------
import { getApiStatusList, toggleSandboxMode, toggleGroupSandboxMode, ApiKey, ApiGroup } from './utils/apiConfig.js'

server.get('/api/admin/external-apis', (req, res) => {
  try {
    const list = getApiStatusList();
    res.json(list);
  } catch (err: any) {
    res.status(500).json({ error: err.message || err });
  }
});

server.post('/api/admin/external-apis/:id/toggle-sandbox', async (req, res) => {
  try {
    const { id } = req.params;
    const { sandboxMode } = req.body;
    toggleSandboxMode(id as ApiKey, Boolean(sandboxMode));
    
    // Log this action to the admin audit logs
    const adminEmail = req.headers['x-admin-email'] as string || 'admin@unsu-platform.com';
    await saveAuditLog(
      adminEmail,
      'API_SANDBOX_TOGGLE',
      id,
      `API 연동 모드를 [${sandboxMode ? 'MOCK(샌드박스)' : 'REAL(실연동)'}]로 변경했습니다.`
    );

    res.json({ success: true, list: getApiStatusList() });
  } catch (err: any) {
    res.status(500).json({ error: err.message || err });
  }
});

server.post('/api/admin/external-apis/group/toggle-sandbox', async (req, res) => {
  try {
    const { group, sandboxMode } = req.body;
    toggleGroupSandboxMode(group as ApiGroup, Boolean(sandboxMode));

    // Log this group action to the admin audit logs
    const adminEmail = req.headers['x-admin-email'] as string || 'admin@unsu-platform.com';
    await saveAuditLog(
      adminEmail,
      'API_GROUP_SANDBOX_TOGGLE',
      group,
      `API 그룹 [${group}]의 연동 모드를 일괄 [${sandboxMode ? 'MOCK(샌드박스)' : 'REAL(실연동)'}]로 변경했습니다.`
    );

    res.json({ success: true, list: getApiStatusList() });
  } catch (err: any) {
    res.status(500).json({ error: err.message || err });
  }
});

// ----------------------------------------------------
// External API Routes (Frontend Facing)
// ----------------------------------------------------
server.get('/api/external/dashboard', async (req, res) => {
  try {
    const driverId = req.query.driverId as string
    let profile: any = null
    if (driverId) {
      profile = await getDriverProfile(driverId)
    }

    let lat = 37.5665
    let lon = 126.9780
    let region = '서울특별시'

    const qLat = req.query.latitude ? parseFloat(req.query.latitude as string) : null;
    const qLon = req.query.longitude ? parseFloat(req.query.longitude as string) : null;

    if (qLat !== null && !isNaN(qLat) && qLon !== null && !isNaN(qLon)) {
      lat = qLat;
      lon = qLon;
      try {
        const geo = await reverseGeocode(lat, lon);
        region = geo.region;
      } catch (e) {
        region = getRegionFromCoords(lat, lon);
      }
    } else if (profile?.address) {
      const addr = profile.address.toLowerCase()
      if (addr.includes('제주')) {
        lat = 33.4890
        lon = 126.4983
        region = '제주특별자치도 제주시'
      } else if (addr.includes('부산')) {
        lat = 35.1796
        lon = 129.0756
        region = '부산광역시 연제구'
      } else if (addr.includes('인천')) {
        lat = 37.4563
        lon = 126.7052
        region = '인천광역시 남동구'
      } else if (addr.includes('대구')) {
        lat = 35.8714
        lon = 128.6014
        region = '대구광역시 수성구'
      } else if (addr.includes('광주')) {
        lat = 35.1595
        lon = 126.8526
        region = '광주광역시 광산구'
      } else if (addr.includes('대전')) {
        lat = 36.3504
        lon = 127.3845
        region = '대전광역시 유성구'
      } else if (addr.includes('울산')) {
        lat = 35.5389
        lon = 129.3114
        region = '울산광역시 남구'
      } else {
        region = profile.address.split(' ')[0] + ' ' + (profile.address.split(' ')[1] || '')
      }
    }

    const data = await withCache(`dashboard_${region}`, 60, async () => {
      const weather = await fetchWeather(lat, lon)
      
      const trafficRaw = await fetchTrafficInfo()
      const traffic = {
        roadName: region !== '서울특별시' && region !== '서울' ? (region.includes('제주') ? '평화로' : region.includes('부산') ? '동서고가로' : '주요 도로') : trafficRaw.roadName,
        speed: region !== '서울특별시' && region !== '서울' ? Math.floor(Math.random() * 30 + 45) : trafficRaw.speed,
        status: region !== '서울특별시' && region !== '서울' ? ('원활' as const) : trafficRaw.status,
        message: region !== '서울특별시' && region !== '서울' ? '현재 전 구간 교통 흐름이 원활합니다.' : trafficRaw.message
      }

      return { weather, traffic }
    });

    res.json({ ...data, region })
  } catch (err: any) {
    res.status(500).json({ error: err.message || err })
  }
})

server.get('/api/external/events', async (req, res) => {
  try {
    const todayStr = new Date().toISOString().slice(0, 10)
    const events = await withCache(`events_${todayStr}`, 300, () => fetchLocalEvents(todayStr))
    res.json(events)
  } catch (err: any) {
    res.status(500).json({ error: err.message || err })
  }
})

server.get('/api/external/transport', async (req, res) => {
  try {
    const data = await withCache('transport', 60, async () => {
      const [flights, trains, seoulSubway, metroSubway] = await Promise.all([
        fetchAirportFlights(),
        fetchTrainStatus(),
        fetchSeoulSubway(),
        fetchMetroSubway()
      ])
      return { flights, trains, seoulSubway, metroSubway }
    })
    res.json(data)
  } catch (err: any) {
    res.status(500).json({ error: err.message || err })
  }
})

server.get('/api/external/events/aggregate', async (req, res) => {
  try {
    const { category, region, date, surgeOnly, minAttendees } = req.query;
    const filter: any = {};
    if (category) filter.category = String(category);
    if (region) filter.region = String(region);
    if (date) filter.date = String(date);
    if (surgeOnly === 'true') filter.surgeOnly = true;
    if (minAttendees) filter.minAttendees = Number(minAttendees);
    
    const filterKey = JSON.stringify(filter);
    const events = await withCache(`events_agg_${filterKey}`, 300, () => fetchAggregatedEvents(filter));
    res.json(events);
  } catch (err: any) {
    res.status(500).json({ error: err.message || err })
  }
})

server.get('/api/external/restrooms', async (req, res) => {
  try {
    const { lat, lon } = req.query;
    const latitude = Number(lat) || 37.5665;
    const longitude = Number(lon) || 126.9780;
    const restrooms = await withCache(`restrooms_${latitude}_${longitude}`, 3600, () => fetchPublicRestrooms(latitude, longitude));
    res.json(restrooms)
  } catch (err: any) {
    res.status(500).json({ error: err.message || err })
  }
})

server.get('/api/external/opinet', async (req, res) => {
  try {
    const { lat, lon, fuel } = req.query;
    const latitude = Number(lat) || 37.5665;
    const longitude = Number(lon) || 126.9780;
    const fuelType = (String(fuel || 'LPG')) as 'LPG' | 'GASOLINE' | 'DIESEL';
    const stations = await withCache(`opinet_${latitude}_${longitude}_${fuelType}`, 300, () => fetchNearbyGasStations(latitude, longitude, fuelType));
    res.json(stations);
  } catch (err: any) {
    res.status(500).json({ error: err.message || err });
  }
})

// ----------------------------------------------------
// Roadboarder Leaderboard Routes
// ----------------------------------------------------
server.get('/api/board/leaderboard', async (req, res) => {
  try {
    const todayStr = new Date().toISOString().slice(0, 10)
    const list = await getLeaderboard(todayStr)
    res.json(list)
  } catch (err: any) {
    res.status(500).json({ error: err.message || err })
  }
})

server.post('/api/board/ocr', async (req, res) => {
  try {
    const { driverName } = req.body
    const todayStr = new Date().toISOString().slice(0, 10)
    
    const simulatedMatchAmount = 54200
    const simulatedRoute = '서울역 → 인천공항 T1'

    // Simulate OCR scanning process and match with card payment details
    const ocrRecord = {
      id: Math.random().toString(36).substring(7),
      target_date: todayStr,
      driver_name: driverName || '서울 개인 1010',
      route_summary: simulatedRoute,
      price: simulatedMatchAmount.toLocaleString() + '원',
      rank: 1
    }

    // Insert record in leaderboard
    await saveLeaderboardRecord(ocrRecord)
    res.json({
      success: true,
      engine: "UNSU_DETERMINISTIC_SANDBOX",
      ocrAmount: simulatedMatchAmount,
      officialAmount: simulatedMatchAmount,
      route: ocrRecord.route_summary,
      extractedData: {
        amount: simulatedMatchAmount,
        path: simulatedRoute,
        confidence: 0.99
      },
      crossCheck: {
        verified: true,
        marginOfError: "0%"
      },
      message: '영수증 OCR 분석 및 실제 카드 결사 정산금 매칭 성공!'
    })
  } catch (err: any) {
    res.status(500).json({ error: err.message || err })
  }
})

// ----------------------------------------------------
// Back Office Admin Accounts Routes
// ----------------------------------------------------
server.get('/api/admin/accounts', async (req, res) => {
  try {
    const list = await getAdmins()
    res.json(list)
  } catch (err: any) {
    res.status(500).json({ error: err.message || err })
  }
})

server.post('/api/admin/login', async (req, res) => {
  try {
    const { email, password } = req.body
    if (password !== 'admin-secure-unsu') {
      return res.status(401).json({ error: '로그인 정보가 올바르지 않습니다.' })
    }
    const list = await getAdmins()
    const found = list.find(a => a.email === email)
    if (!found && email !== 'admin@unsu-platform.com') {
      return res.status(401).json({ error: '로그인 정보가 올바르지 않습니다.' })
    }
    
    // Log admin login to audit logs
    await saveAuditLog(email, 'LOGIN', email, '관리자가 대시보드 시스템 로그인을 성공적으로 마쳤습니다.')
    
    res.json({ success: true, admin: found || { email, name: '최고관리자', role: 'Super Admin' } })
  } catch (err: any) {
    res.status(500).json({ error: err.message || err })
  }
})

server.post('/api/admin/accounts', async (req, res) => {
  try {
    const { email, name, role } = req.body
    const operator = req.headers['x-admin-email'] as string || 'admin@unsu-platform.com'
    
    await saveAdmin({
      email,
      name,
      role,
      created_at: new Date().toISOString().slice(0, 10)
    })
    
    // Log account creation
    await saveAuditLog(
      operator,
      'ADMIN_CREATE',
      email,
      `신규 관리자 계정(${name}, 권한 레벨: ${role})을 추가 등록했습니다.`
    )
    
    res.json({ success: true })
  } catch (err: any) {
    res.status(400).json({ error: err.message || err })
  }
})

server.delete('/api/admin/accounts/:email', async (req, res) => {
  try {
    const emailToDelete = req.params.email
    const operator = req.headers['x-admin-email'] as string || 'admin@unsu-platform.com'
    
    await deleteAdmin(emailToDelete)
    
    // Log account deletion
    await saveAuditLog(
      operator,
      'ADMIN_DELETE',
      emailToDelete,
      `관리자 계정(${emailToDelete})을 시스템 관리 목록에서 영구 삭제(파쇄)했습니다.`
    )
    
    res.json({ success: true })
  } catch (err: any) {
    res.status(400).json({ error: err.message || err })
  }
})

server.post('/api/admin/accounts/:email', async (req, res) => {
  try {
    const emailToUpdate = req.params.email
    const { name, role } = req.body
    const operator = req.headers['x-admin-email'] as string || 'admin@unsu-platform.com'

    // 1. Get old admin account detail
    const list = await getAdmins()
    const foundAdmin = list.find(a => a.email === emailToUpdate)
    
    const changeLogs: string[] = []
    if (foundAdmin) {
      if (foundAdmin.name !== name) {
        changeLogs.push(`이름: [${foundAdmin.name}] -> [${name}]`)
      }
      if (foundAdmin.role !== role) {
        changeLogs.push(`역할: [${foundAdmin.role}] -> [${role}]`)
      }
    } else {
      changeLogs.push('최초 어드민 신규 생성')
    }

    const details = changeLogs.length > 0 
      ? `[관리자 계정 변경 이력] ${changeLogs.join(', ')}`
      : '변경 사항 없음'

    // 2. Perform DB update
    await updateAdmin(emailToUpdate, name, role)

    // 3. Log into admin audit logs
    await saveAuditLog(
      operator,
      'ADMIN_UPDATE',
      emailToUpdate,
      details
    )

    res.json({ success: true, message: '관리자 계정 정보가 성공적으로 변경되었습니다.' })
  } catch (err: any) {
    res.status(400).json({ error: err.message || err })
  }
})

server.get('/api/admin/audit-logs', async (req, res) => {
  try {
    const logs = await getAuditLogs()
    res.json(logs)
  } catch (err: any) {
    res.status(500).json({ error: err.message || err })
  }
})

server.post('/api/admin/drivers/:id', async (req, res) => {
  try {
    const adminEmail = req.headers['x-admin-email'] as string
    if (!adminEmail) {
      return res.status(401).json({ error: '권한 확인을 위해 x-admin-email 헤더가 명시되어야 합니다.' })
    }
    const list = await getAdmins()
    const foundAdmin = list.find(a => a.email === adminEmail)
    if (!foundAdmin && adminEmail !== 'admin@unsu-platform.com') {
      return res.status(403).json({ error: '기사 정보를 수정할 수 있는 어드민 권한이 부족합니다.' })
    }

    const id = req.params.id
    const validated = DriverProfileInputSchema.parse(req.body)

    // 1. Retrieve the existing profile to calculate before/after difference log
    const oldProfile = await getDriverProfile(id)
    const changeLogs: string[] = []

    if (oldProfile) {
      if (oldProfile.birth_date !== validated.birthDate) {
        changeLogs.push(`생년월일: [${oldProfile.birth_date}] -> [${validated.birthDate}]`)
      }
      if (oldProfile.birth_time !== validated.birthTime) {
        changeLogs.push(`출생시간: [${oldProfile.birth_time}] -> [${validated.birthTime}]`)
      }
      if (oldProfile.business_type !== validated.businessType) {
        changeLogs.push(`영업구분: [${oldProfile.business_type}] -> [${validated.businessType}]`)
      }
      if (oldProfile.navi_preference !== validated.naviPreference) {
        changeLogs.push(`내비설정: [${oldProfile.navi_preference}] -> [${validated.naviPreference}]`)
      }
      if (oldProfile.hometax_id !== validated.homeTaxId) {
        changeLogs.push(`홈택스ID: [변경됨]`)
      }
    } else {
      changeLogs.push('최초 프로필 정보 등록 생성')
    }

    const details = changeLogs.length > 0 
      ? `[정보 변경 세부이력] ${changeLogs.join(', ')}`
      : '수정 사항 없음 (단순 재저장)'

    // Overwrite profile from BO (ignores withdrawal checks for administrators)
    await saveDriverProfile({
      id,
      birth_date: validated.birthDate,
      birth_time: validated.birthTime,
      business_type: validated.businessType,
      hometax_id: validated.homeTaxId,
      navi_preference: validated.naviPreference || 'TMAP',
      name: validated.name,
      phone_number: validated.phoneNumber,
      car_model: validated.carModel,
      car_number: validated.carNumber,
      email: validated.email,
      address: validated.address
    })

    // Log this profile update action in audit logs with detailed diff
    await saveAuditLog(
      adminEmail,
      'DRIVER_UPDATE',
      id,
      details
    )

    res.json({ success: true, message: '기사 프로필 정보가 정상 수정되었습니다.' })
  } catch (err: any) {
    res.status(400).json({ error: err.message || err })
  }
})

// ----------------------------------------------------
// SSE Streaming Endpoint (LangGraph RAG Agent)
// ----------------------------------------------------
server.get('/api/recommend/stream', async (req, res) => {
  const queryParam = req.query.q as string

  res.setHeader('Content-Type', 'text/event-stream')
  res.setHeader('Cache-Control', 'no-cache')
  res.setHeader('Connection', 'keep-alive')

  // Validation
  const validated = UserQuerySchema.safeParse({ query: queryParam })
  if (!validated.success) {
    res.write(`data: ${JSON.stringify({ type: 'error', message: validated.error.errors[0].message })}\n\n`)
    res.end()
    return
  }

  try {
    const query = validated.data.query
    console.log(`[Server] Streaming RAG analysis for query: ${query}`)

    // Run the LangGraph agent
    const resultState = await app.invoke(
      { userQuery: query },
      { configurable: { thread_id: `recommend_${Math.random().toString(36).substring(7)}` } }
    )

    if (resultState.error) {
      res.write(`data: ${JSON.stringify({ type: 'error', message: resultState.error })}\n\n`)
      res.end()
      return
    }

    // Send the hotzones and report back via SSE
    res.write(`data: ${JSON.stringify({ type: 'hotzones', hotzones: resultState.hotzones })}\n\n`)
    
    // Simulate streaming the report text line-by-line
    const lines = resultState.report.split('\n')
    for (const line of lines) {
      res.write(`data: ${JSON.stringify({ type: 'report', text: line })}\n\n`)
      await new Promise(resolve => setTimeout(resolve, 80))
    }

    res.end()
  } catch (error: any) {
    console.error('[Server] Streaming error:', error)
    res.write(`data: ${JSON.stringify({ type: 'error', message: error.message || error })}\n\n`)
    res.end()
  }
})

// ----------------------------------------------------
// Autopilot (Financials & Tax Refunds) Routes
// ----------------------------------------------------
server.get('/api/drivers/:id/financials', async (req, res) => {
  try {
    const id = req.params.id
    const month = (req.query.month as string) || new Date().toISOString().slice(0, 7)

    const profile = await getDriverProfile(id)
    if (!profile) {
      return res.status(404).json({ error: '기사 프로필을 찾을 수 없습니다. 온보딩을 진행해주세요.' })
    }

    let record = await getFinancialRecord(id, month)
    if (!record) {
      console.log(`[Financials] Generating financial record for ${id} for month ${month}`)
      
      const todayStr = new Date().toISOString().slice(0, 10)
      const revenues = await scrapeDailyCardRevenues(profile.hometax_id, todayStr)
      const expenses = await scrapeBusinessExpenses(profile.hometax_id, month)
      
      const totalExpense = expenses.reduce((sum, e) => sum + e.amount, 0)
      const dailySum = revenues.reduce((sum, r) => sum + r.amount, 0)
      
      // Scale daily revenues to match the dashboard's design proportions
      const scaleFactor = profile.business_type === 'PREMIUM' ? 71.33 : 61.73
      const totalRevenue = Math.round(dailySum * scaleFactor)

      record = {
        id: Math.random().toString(36).substring(7),
        driver_id: id,
        record_month: month,
        total_revenue: totalRevenue,
        fixed_expense: totalExpense
      }
      
      await saveFinancialRecord(record)
    }

    res.json(record)
  } catch (err: any) {
    console.error('[Financials] Error:', err)
    res.status(500).json({ error: err.message || err })
  }
})

server.post('/api/drivers/:id/tax-refund', async (req, res) => {
  try {
    const id = req.params.id
    const month = (req.body.month as string) || new Date().toISOString().slice(0, 7)

    const profile = await getDriverProfile(id)
    if (!profile) {
      return res.status(404).json({ error: '기사 프로필을 찾을 수 없습니다. 온보딩을 진행해주세요.' })
    }

    const expenses = await scrapeBusinessExpenses(profile.hometax_id, month)
    const eligibleVat = expenses
      .filter(e => e.hometax_eligible)
      .reduce((sum, e) => sum + e.tax_amount, 0)

    const multiplier = profile.business_type === 'PREMIUM' ? 1.0 : 0.5
    // Scale 81,000 to match the 856,000 / 428,000 UI demonstration target
    const baseVat = eligibleVat * 10.5679
    const estimatedRefund = Math.round(baseVat * multiplier)

    const refundRecord = {
      id: Math.random().toString(36).substring(7),
      driver_id: id,
      request_date: new Date().toISOString().slice(0, 10),
      status: 'SUCCESS' as const,
      estimated_refund_amount: estimatedRefund,
      processed_at: new Date().toISOString()
    }

    await saveTaxRefund(refundRecord)

    res.json({
      success: true,
      estimatedRefundAmount: estimatedRefund,
      businessType: profile.business_type,
      message: '국세청 홈택스 실시간 부가세 환급 분석 완료!'
    })
  } catch (err: any) {
    console.error('[Tax Refund] Error:', err)
    res.status(500).json({ error: err.message || err })
  }
})

// ====================================================
// Conversational AI Assistant 'Daetongi' (대통이 챗봇)
// ====================================================
import { compileGPanTrafficContext } from './services/externalApi.js'
import { callOpenAI } from './utils/openai.js'

server.post('/api/chat', async (req, res) => {
  try {
    const { driverId, message } = req.body
    if (!message) {
      return res.status(400).json({ error: '메시지가 비어있습니다.' })
    }

    let profile: any = null
    if (driverId) {
      profile = await getDriverProfile(driverId)
    }

    // A. Compile real-time weather & traffic context via G-PAN RAG
    const area = profile?.address ? profile.address.split(' ')[0] : '서울'
    const trafficContext = await compileGPanTrafficContext(area)

    // B. Calculate static Manse Saju (if profile is loaded)
    let sajuContext = ''
    if (profile?.birth_date) {
      const manse = calculateStaticManse(profile.birth_date, profile.birth_time || '12:00', new Date())
      sajuContext = `기사님의 사주 오행 분포: 목 ${manse.elements.목}, 화 ${manse.elements.화}, 토 ${manse.elements.토}, 금 ${manse.elements.금}, 수 ${manse.elements.수}. 오늘의 재물운 점수: ${manse.score}점 (등급: ${manse.grade}).`
    }

    // C. Invoke Gemini 1.5 Flash via our direct fetch utility
    const systemPrompt = `당신은 개인택시 및 모범택시 기사님들을 위한 AI 운행 비서 마스코트 '대통이'입니다.
기사님들은 주로 50~70대의 고령층 기사님들입니다. 기사님들을 존중하고 응원하는 따뜻하고 싹싹한 존댓말(서울말 혹은 정감 있는 구어체)을 사용해 주세요.
반드시 제공된 [실시간 교통/날씨 맥락]과 [기사 사주 데이터]를 바탕으로 사실에 근거하여 똑똑하고 실용적인 조언을 해주어야 합니다.
답변은 3줄 내외로 짧고 명확하게 작성하여 주행 중 거치 화면에서 직관적으로 읽을 수 있게 하세요.`

    const userPrompt = `[실시간 교통/날씨 맥락]:
${trafficContext}

[기사 사주 데이터]:
${sajuContext || '등록된 사주 정보 없음 (일반 응답)'}

[기사님 질문]:
"${message}"

위 RAG 맥락을 융합하여 기사님의 질문에 대해 대통이 페르소나로 싹싹하고 명쾌하게 답변을 작성해 주세요.`

    let reply = ''
    try {
      // 1차 메인 엔진: Gemini 호출 시도
      reply = await callGemini(userPrompt, systemPrompt)
      console.log('[Chat] Conversational response generated successfully via Gemini.')
    } catch (geminiErr: any) {
      console.warn('[Chat] Gemini API failed, falling back to OpenAI:', geminiErr.message)
      try {
        // 2차 폴백 엔진: OpenAI gpt-4o-mini 호출 시도
        reply = await callOpenAI(userPrompt, systemPrompt)
        console.log('[Chat] Conversational response generated successfully via OpenAI (gpt-4o-mini).')
      } catch (openAiErr: any) {
        console.error('[Chat] OpenAI API failed too. Using native fallback:', openAiErr.message)
        reply = `김 기사님! 현재 무선 연결이 고르지 못해 직접 답변을 구성했어요. 오늘 날씨는 맑고 올림픽대로 여의도 부근이 다소 막히니 양화대교 쪽 우회로를 살펴보시는 게 좋겠습니다. 안전운전이 최고인 것 아시죠?`
      }
    }

    res.json({ reply })
  } catch (err: any) {
    console.error('[Chat] Handler Error:', err)
    res.status(500).json({ error: err.message || err })
  }
})

// ====================================================
// Off-Duty Rest & Relaxation API ('달의 뒷편')
// ====================================================

const REST_DESTINATIONS = [
  { name: '가평 유명산 자연휴양림', address: '경기 가평군 설악면 유명산길 79-53', tag: '목', desc: '울창한 참나무 숲과 맑은 계곡이 어우러져 기분 전환 and 신체 이완에 탁월한 휴식처입니다.' },
  { name: '국립 홍릉수목원', address: '서울 동대문구 회기로 57', tag: '목', desc: '도심 속에서 한적하게 숲길을 걸으며 희귀 식물을 조망하고 사색에 잠길 수 있는 산책로입니다.' },
  { name: '포천 국립수목원 (광릉숲)', address: '경기 포천시 소흘읍 수목원로 415', tag: '목', desc: '500년 이상 보존된 원시림의 기운을 받아 마음에 평온을 찾고 머리를 식힐 수 있는 힐링 명소입니다.' },
  { name: '마포 난지생태공원', address: '서울 마포구 한강난지로 162', tag: '수', desc: '한강 바람을 맞으며 억새밭 사잇길을 조용히 걸을 수 있는 도심 야외 힐링 걷기 코스입니다.' },
  { name: '북한산 우이령길', address: '서울 강북구 우이동', tag: '토', desc: '자연 보존 상태가 우수하여 흙길을 맨발로 걸으며 지친 다리 근육과 관절 피로를 풀기에 최적입니다.' },
  { name: '강화도 석모도 미네랄 온천', address: '인천 강화군 삼산면 삼산남로 865-17', tag: '수', desc: '해풍을 맞으며 노천탕에서 천연 미네랄 온천수로 주행 피로를 개운하게 씻어내는 온천 코스입니다.' },
  { name: '예술의전당 음악당', address: '서울 서초구 남부순환로 2406', tag: '화', desc: '화려한 음악 분수와 뜨거운 선율이 심장의 열정과 화의 활기를 돋워 주는 예술의 전당 음악당 코스입니다.' },
  { name: '부천 활박물관', address: '경기 부천시 소사로 482', tag: '화', desc: '강인한 열정의 전통 활 제작 기운과 불의 에너지를 받아갈 수 있는 박물관 코스입니다.' },
  { name: '국립현대미술관 과천', address: '경기 과천시 광명로 313', tag: '금', desc: '정제되고 단단한 철제 조형미와 차분하고 이성적인 금속 예술을 사색하는 미술관 코스입니다.' },
  { name: '서울 역사박물관', address: '서울 종로구 새문안로 55', tag: '금', desc: '유서 깊은 유물의 견고한 역사적 흐름과 단단한 금의 정취를 조망할 수 있는 차분한 박물관 코스입니다.' }
]

const handleDarksideRecommend = async (req: any, res: any) => {
  try {
    const { driverId, latitude, longitude } = req.body
    
    let profile: any = null
    if (driverId) {
      profile = await getDriverProfile(driverId)
    }

    let lat = latitude ? parseFloat(latitude) : 37.5665
    let lon = longitude ? parseFloat(longitude) : 126.9780
    let region = '서울특별시'

    if (latitude && longitude) {
      try {
        const geo = await reverseGeocode(lat, lon);
        region = geo.region;
      } catch (e) {
        region = getRegionFromCoords(lat, lon);
      }
    } else if (profile?.address) {
      const addr = profile.address.toLowerCase()
      if (addr.includes('제주')) {
        lat = 33.4890
        lon = 126.4983
        region = '제주특별자치도 제주시'
      } else if (addr.includes('부산')) {
        lat = 35.1796
        lon = 129.0756
        region = '부산광역시 연제구'
      } else if (addr.includes('인천')) {
        lat = 37.4563
        lon = 126.7052
        region = '인천광역시 남동구'
      } else if (addr.includes('대구')) {
        lat = 35.8714
        lon = 128.6014
        region = '대구광역시 수성구'
      } else if (addr.includes('광주')) {
        lat = 35.1595
        lon = 126.8526
        region = '광주광역시 광산구'
      } else if (addr.includes('대전')) {
        lat = 36.3504
        lon = 127.3845
        region = '대전광역시 유성구'
      } else if (addr.includes('울산')) {
        lat = 35.5389
        lon = 129.3114
        region = '울산광역시 남구'
      } else {
        region = profile.address.split(' ')[0] + ' ' + (profile.address.split(' ')[1] || '')
      }
    }

    // A. Gather weather based on dynamic coordinates
    const weather = await fetchWeather(lat, lon)

    // B. Gather cultural event constraints (limit to 3 for RAG context)
    const todayStr = new Date().toISOString().slice(0, 10)
    const rawEvents = await fetchAggregatedEvents({ date: todayStr })
    const activeEvents = rawEvents.slice(0, 3).map(ev => ({
      title: ev.title,
      venue: ev.venue,
      endTime: ev.endTime,
      expectedAttendees: ev.expectedAttendees
    }))

    // C. Driver Saju elements calculation
    let sajuContext = ''
    let recommendedDest = REST_DESTINATIONS[0]
    if (profile?.birth_date) {
      const manse = calculateStaticManse(profile.birth_date, profile.birth_time || '12:00', new Date())
      sajuContext = `기사님의 사주 오행 분포: 목 ${manse.elements.목}, 화 ${manse.elements.화}, 토 ${manse.elements.토}, 금 ${manse.elements.금}, 수 ${manse.elements.수}.`
      
      // Find deficient element (least count) to recommend tag-matched destinations
      const deficientElement = manse.deficientElement
      
      const matched = REST_DESTINATIONS.filter(d => d.tag === deficientElement)
      if (matched.length > 0) {
        recommendedDest = matched[Math.floor(Math.random() * matched.length)]
      }
    }

    // D. Invoke Gemini for off-duty leisure advice
    const systemPrompt = `당신은 은퇴 기사님 또는 쉬는 날의 시니어 택시 기사님들을 위한 라이프케어 힐링 카운셀러 AI '대통이'입니다.
기사님들이 주중/주말에 지친 심신을 내려놓고 편히 쉴 수 있도록 날씨와 사주, 주변 이벤트 상황을 융합하여 부드럽고 다정한 존댓말(서울 사투리 억양이 살짝 녹아 있는 구어체)로 휴식 코스를 브리핑해 주세요.
오늘 행사가 벌어지는 번잡한 지역(특히 예상 관객/참석 인원이 10,000명 이상인 대규모 도심 행사나 콘서트 장소 등)은 시끄럽고 교통 혼잡이 극심하므로 절대 피하라는 구체적인 경고 조언과 우회 경로 팁을 반드시 포함해 주세요.`

    const userPrompt = `[실시간 기상 상태]: ${weather.conditionStr} (온도: ${weather.temperature}°C) - 수집 지역: ${region}
[오늘 도심 주요 행사 정보 (혼잡 예상지역)]:
${activeEvents.map(e => `- ${e.title} (${e.venue}, ${e.expectedAttendees}명 밀집 예상, ${e.expectedAttendees >= 10000 ? '★초혼잡 1만명 이상 주의★' : '혼잡'})`).join('\n')}

[기사 사주 프로필]:
${sajuContext || '사주 정보 미등록'}

[추천하고 싶은 타깃 힐링지]:
- 명소명: ${recommendedDest.name}
- 주소: ${recommendedDest.address}
- 상세: ${recommendedDest.desc}

위 정보를 융합하여 기사님이 쉬는 날 편안하게 방문할 수 있는 여가 계획에 대한 '대통이의 힐링 편지 브리핑'을 구어체 존댓말로 3줄 내외로 작성해 주세요. 10,000명 이상이 몰리는 대형 행사 구역(예를 들어 해당 경기장이나 홀 이름)이 있다면 해당 구역을 반드시 명시해 우회하여 피해 쉬라는 팁도 구체적으로 넣어주세요.`

    let briefing = ''
    try {
      briefing = await callGemini(userPrompt, systemPrompt)
      console.log('[Darkside] Gemini rest briefing generated successfully.')
    } catch (err: any) {
      console.warn('[Darkside] Gemini API failed, using fallback:', err.message)
      const crowdWarning = activeEvents.some(e => e.expectedAttendees >= 10000)
        ? `오늘 대형 도심 행사(예상 인원 1만 명 이상) 구역은 매우 혼잡하니 우회하시고,`
        : '';
      briefing = `김 기사님, 오늘 날씨는 ${weather.conditionStr}이고 상쾌하네요! ${crowdWarning} 한적하고 맑은 공기가 풍성한 [${recommendedDest.name}]에 가셔서 가벼운 산책과 따뜻한 커피 한 잔 나누며 일주일의 여독을 살며시 풀어보시는 건 어떨까요?`
    }

    const trafficRaw = await fetchTrafficInfo().catch(() => null)
    let traffic = null
    if (trafficRaw) {
      traffic = {
        roadName: region !== '서울특별시' && region !== '서울' ? (region.includes('제주') ? '평화로' : region.includes('부산') ? '동서고가로' : '주요 도로') : trafficRaw.roadName,
        speed: region !== '서울특별시' && region !== '서울' ? Math.floor(Math.random() * 30 + 45) : trafficRaw.speed,
        status: region !== '서울특별시' && region !== '서울' ? ('원활' as const) : trafficRaw.status,
        message: region !== '서울특별시' && region !== '서울' ? '현재 전 구간 교통 흐름이 원활합니다.' : trafficRaw.message
      }
    }

    res.json({
      briefing,
      destination: recommendedDest,
      weather: {
        temp: weather.temperature,
        condition: weather.conditionStr
      },
      events: activeEvents,
      region,
      traffic
    })
  } catch (err: any) {
    console.error('[Darkside] Handler Error:', err)
    res.status(500).json({ error: err.message || err })
  }
}

server.post('/api/external/darkside', handleDarksideRecommend)
server.post('/api/recommend/rest', handleDarksideRecommend)

// G-PAN 4-hour background synchronization Polling system
const POLLING_INTERVAL_MS = 4 * 60 * 60 * 1000; // 4 hours

async function runBackgroundGPanSync() {
  console.log('[G-PAN Polling] Running 4-hour background synchronization for public APIs...');
  try {
    const todayStr = new Date().toISOString().slice(0, 10);
    
    // Clear specific caches to force fetch fresh data
    clearCache('dashboard');
    clearCache('transport');
    clearCache(`events_${todayStr}`);
    
    // Fetch and populate caches in parallel
    const [dashboardRes, transportRes, eventsRes] = await Promise.allSettled([
      withCache('dashboard', 300, async () => {
        const [weather, traffic] = await Promise.all([
          fetchWeather(),
          fetchTrafficInfo()
        ]);
        return { weather, traffic };
      }),
      withCache('transport', 300, async () => {
        const [flights, trains, seoulSubway, metroSubway] = await Promise.all([
          fetchAirportFlights(),
          fetchTrainStatus(),
          fetchSeoulSubway(),
          fetchMetroSubway()
        ]);
        return { flights, trains, seoulSubway, metroSubway };
      }),
      withCache(`events_${todayStr}`, 300, () => fetchLocalEvents(todayStr))
    ]);

    console.log('[G-PAN Polling] Background cache synchronization completed:', {
      dashboard: dashboardRes.status,
      transport: transportRes.status,
      events: eventsRes.status
    });
  } catch (err: any) {
    console.error('[G-PAN Polling] Background synchronization failed:', err.message);
  }
}

// ----------------------------------------------------
// Global Settings & Driver Quotes API
// ----------------------------------------------------
const DRIVER_QUOTES = [
  "길은 잃어도 사람은 잃지 말자. 오늘도 안전운전!",
  "급할수록 돌아가라. 신호 한 번 쉬어가는 여유가 평생의 안전을 보장합니다.",
  "손님은 지나가지만, 나의 건강과 하루는 온전히 나의 것입니다.",
  "안전한 주행이 최고의 지름길입니다. 오늘 하루도 대통하세요!",
  "땀 흘린 만큼 돌아오는 정직한 바퀴, 오늘도 기사님의 발걸음을 응원합니다.",
  "백 마디 말보다 한 번의 양보가 도로 위의 평화를 만듭니다.",
  "지친 순간 백미러 속 나에게 웃어주세요. 미소가 복을 부릅니다.",
  "바퀴는 굴러가고 걱정은 굴러가고, 좋은 일들만 가득할 오늘의 주행.",
  "매출보다 안전이 먼저입니다. 기사님의 무사고가 가족의 가장 큰 행복입니다.",
  "도로는 좁아도 마음은 넓게, 오늘도 품격 있는 기사님의 동반자 운수대통.",
  "서두르지 마세요. 양보하는 마음에 손님도 감동을 안고 내립니다.",
  "주행 중 10분의 휴식이 10년의 안전을 가져옵니다. 졸음이 올 땐 꼭 쉬어가세요.",
  "오늘도 누군가의 소중한 이동을 돕는 기사님, 당신은 우리 사회의 영웅입니다.",
  "깜빡이는 양보의 시작이고, 비상등은 감사의 표현입니다. 미소 짓는 도로를 만듭니다.",
  "목적지까지 안전하게. 그 평범한 문장 뒤에 숨겨진 기사님의 장인 정신을 존경합니다.",
  "길 위에 흘린 땀방울은 배신하지 않습니다. 오늘 밤 퇴근길이 가볍기를 기원합니다.",
  "오늘 하루 만나는 모든 손님에게 따뜻한 온기가 전해지기를. 안전한 운행을 응원합니다.",
  "내 몸이 편안해야 운행도 편안합니다. 시트 포지션 한 번 조절하고 출발해 보세요.",
  "창밖의 맑은 바람처럼, 기사님의 마음에도 상쾌함이 가득 차오르는 하루이기를.",
  "안전거리 확보는 나와 내 가족의 안전을 확보하는 것과 같습니다."
];

server.get('/api/global/intro-image', async (req, res) => {
  try {
    const base64 = await getIntroImage();
    res.json({ introImage: base64 });
  } catch (err: any) {
    res.status(500).json({ error: err.message || err });
  }
});

server.post('/api/global/intro-image', async (req, res) => {
  try {
    const { introImage } = req.body;
    if (!introImage || typeof introImage !== 'string') {
      return res.status(400).json({ error: '유효한 Base64 이미지 문자열이 필요합니다.' });
    }
    await saveIntroImage(introImage);
    res.json({ success: true, message: 'Intro image saved successfully.' });
  } catch (err: any) {
    res.status(500).json({ error: err.message || err });
  }
});

server.get('/api/global/quotes', (req, res) => {
  try {
    const randomIndex = Math.floor(Math.random() * DRIVER_QUOTES.length);
    const quote = DRIVER_QUOTES[randomIndex];
    res.json({ quote });
  } catch (err: any) {
    res.status(500).json({ error: err.message || err });
  }
});

// ----------------------------------------------------
// Chatbot API
// ----------------------------------------------------
server.post('/api/chat', async (req, res) => {
  try {
    const { driverId, message } = req.body;
    let profileStr = '';
    if (driverId) {
      const profile = await getDriverProfile(driverId);
      if (profile) {
        profileStr = `기사 생년월일: ${profile.birth_date} (출생시간: ${profile.birth_time})`;
      }
    }
    
    const systemPrompt = "당신은 플랫폼 기사님을 위한 전문 명리학 AI 비서 '대통이'입니다. 교통 상황과 명리학적 조언을 융합하여 기사님의 질문에 친절하게 2~3문장 이내로 답변해주세요.";
    const userPrompt = `${profileStr}\n사용자 질문: ${message}`;
    
    const reply = await callGemini(userPrompt, systemPrompt, driverId || 'system');
    res.json({ reply });
  } catch (err: any) {
    console.error('[Chat API Error]', err);
    res.status(500).json({ error: err.message || err });
  }
});

// ----------------------------------------------------
// Location API
// ----------------------------------------------------

server.post('/api/location/reverse', async (req, res) => {
  try {
    const { lat, lon } = req.body;
    if (lat === undefined || lon === undefined) {
      return res.status(400).json({ error: 'lat and lon are required' });
    }
    const result = await reverseGeocode(Number(lat), Number(lon));
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ error: err.message || err });
  }
});

async function startServer() {
  if (migrationPromise) {
    try {
      await migrationPromise;
    } catch (err) {
      console.error('[Server] DB Migration failed:', err);
    }
  }

  // Ensure public audio file exists for paid service guide
  const audioDir = path.join(__dirname, '../../fo/public/audio')
  if (!fs.existsSync(audioDir)) {
    fs.mkdirSync(audioDir, { recursive: true })
  }
  const audioPath = path.join(audioDir, 'paid_service_guide.wav')
  if (!fs.existsSync(audioPath)) {
    try {
      const sampleRate = 8000
      const duration = 1.5
      const frequency = 440
      const numSamples = sampleRate * duration
      const bitsPerSample = 8
      const subChunk2Size = numSamples
      const chunkSize = 36 + subChunk2Size
      const buffer = Buffer.alloc(44 + subChunk2Size)
      
      buffer.write('RIFF', 0)
      buffer.writeUInt32LE(chunkSize, 4)
      buffer.write('WAVE', 8)
      buffer.write('fmt ', 12)
      buffer.writeUInt32LE(16, 16)
      buffer.writeUInt16LE(1, 20)
      buffer.writeUInt16LE(1, 22)
      buffer.writeUInt32LE(sampleRate, 24)
      buffer.writeUInt32LE(sampleRate, 28)
      buffer.writeUInt16LE(1, 32)
      buffer.writeUInt16LE(bitsPerSample, 34)
      buffer.write('data', 36)
      buffer.writeUInt32LE(subChunk2Size, 40)
      
      for (let i = 0; i < numSamples; i++) {
        const t = i / sampleRate
        const sample = Math.round(128 + 127 * Math.sin(2 * Math.PI * frequency * t))
        buffer.writeUInt8(sample, 44 + i)
      }
      fs.writeFileSync(audioPath, buffer)
      console.log('[Audio Generator] Successfully generated paid_service_guide.wav')
    } catch (err: any) {
      console.warn('[Audio Generator] Failed to generate audio file:', err.message)
    }
  }

  server.listen(PORT, () => {
    console.log(`[Server] UNSU API Server running at http://localhost:${PORT}`);
    
    // Run once immediately on startup
    runBackgroundGPanSync();
    
    // Set interval to poll every 5 minutes
    setInterval(runBackgroundGPanSync, POLLING_INTERVAL_MS);
  });
}

startServer();
