import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import { z } from 'zod'
import { app } from './agents/workflow.js'
import { UserQuerySchema } from './schemas/validation.js'
import {
  saveDriverProfile,
  getDriverProfile,
  getDailyLuckyCard,
  saveDailyLuckyCard,
  getRecommendedCourse,
  saveRecommendedCourse,
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
  getAuditLogs
} from './utils/db.js'


dotenv.config()

const server = express()
const PORT = process.env.PORT || 3001

server.use(cors())
server.use(express.json())

// ----------------------------------------------------
// Drivers Profile Routes
// ----------------------------------------------------
const DriverProfileInputSchema = z.object({
  birthDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "YYYY-MM-DD 형식"),
  birthTime: z.string().regex(/^\d{2}:\d{2}$/, "HH:MM 형식"),
  businessType: z.enum(["PRIVATE", "PREMIUM"]),
  homeTaxId: z.string().min(4),
  naviPreference: z.enum(["TMAP", "KAKAONAVI"]).optional()
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
      navi_preference: validated.naviPreference || 'TMAP'
    })
    res.json({ success: true, message: 'Profile saved successfully.' })
  } catch (err: any) {
    res.status(400).json({ error: err.message || err })
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
      naviPreference: profile.navi_preference || 'TMAP'
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

    const todayStr = new Date().toISOString().slice(0, 10)

    // 1. Get or generate Lucky Card
    let luckyCard = await getDailyLuckyCard(driverId, todayStr)
    if (!luckyCard) {
      // Deterministic Saju generation based on birth date and today's date
      const fortune = getFortune(profile.birth_date, todayStr)
      luckyCard = {
        id: Math.random().toString(36).substring(7),
        driver_id: driverId,
        lucky_date: todayStr,
        fortune_grade: fortune.grade,
        fortune_comment: fortune.comment
      }
      await saveDailyLuckyCard(luckyCard)
    }

    // 2. Get or generate Recommended Course
    let course = await getRecommendedCourse(driverId, todayStr)
    if (!course) {
      course = {
        id: Math.random().toString(36).substring(7),
        driver_id: driverId,
        target_date: todayStr,
        destination_name: '김포공항 방면',
        route_summary: '현재 올림픽대로 여의도 부근 정체가 극심하므로 가양대교 우회 경로를 추천합니다.',
        tmap_intent_url: 'tmap://route?goalname=김포공항&goallat=37.558&goallon=126.802'
      }
      await saveRecommendedCourse(course)
    }

    res.json({
      profile: {
        birthDate: profile.birth_date,
        birthTime: profile.birth_time,
        businessType: profile.business_type
      },
      luckyCard: {
        grade: luckyCard.fortune_grade,
        comment: luckyCard.fortune_comment
      },
      course: {
        destinationName: course.destination_name,
        routeSummary: course.route_summary,
        tmapIntentUrl: course.tmap_intent_url
      }
    })
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
    
    // Simulate OCR scanning process and match with card payment details
    const ocrRecord = {
      id: Math.random().toString(36).substring(7),
      target_date: todayStr,
      driver_name: driverName || '서울 개인 1010',
      route_summary: '서울역 → 인천공항 T1',
      price: '54,200원',
      rank: 1
    }

    // Insert record in leaderboard
    await saveLeaderboardRecord(ocrRecord)
    res.json({
      success: true,
      ocrAmount: 54200,
      officialAmount: 54200,
      route: ocrRecord.route_summary,
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
      navi_preference: validated.naviPreference || 'TMAP'
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
    const resultState = await app.invoke({ userQuery: query })

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

server.listen(PORT, () => {
  console.log(`[Server] UNSU API Server running at http://localhost:${PORT}`)
})

