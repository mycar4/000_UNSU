import pg from 'pg'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { encrypt, decrypt, hashHometaxId } from './crypto.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const LOCAL_DB_PATH = path.join(__dirname, 'local_db.json')

export interface Driver {
  id: string
  birth_date: string
  birth_time: string
  business_type: 'PRIVATE' | 'PREMIUM'
  hometax_id: string
  navi_preference?: 'TMAP' | 'KAKAONAVI'
}

export interface AuditLog {
  id: string
  admin_email: string
  action_type: string
  target_identifier: string
  description: string
  created_at: string
}


export interface DailyLuckyCard {
  id: string
  driver_id: string
  lucky_date: string
  fortune_grade: 'BEST' | 'GOOD' | 'NORMAL' | 'BAD'
  fortune_comment: string
}

export interface RecommendedCourse {
  id: string
  driver_id: string
  target_date: string
  destination_name: string
  route_summary: string
  tmap_intent_url: string
  tmap_sent_at?: string
}

export interface HotZone {
  id: number
  zone_name: string
  latitude: number
  longitude: number
  status: 'HIGH' | 'NORMAL' | 'LOW'
  wait_minutes: number
  description: string
}

export interface RevenueLeaderboard {
  id: string
  target_date: string
  driver_name: string
  route_summary: string
  price: string
  rank: number
}

export interface AdminAccount {
  email: string
  name: string
  role: string
  created_at: string
}

const INITIAL_DATA = {
  drivers: [] as Driver[],
  daily_lucky_cards: [] as DailyLuckyCard[],
  recommended_courses: [] as RecommendedCourse[],
  hot_zones: [
    { id: 1, zone_name: '강남역 사거리', latitude: 37.498, longitude: 127.027, status: 'HIGH', wait_minutes: 15, description: '기상 악화로 현재 강남 일대 택시 수요가 평소 대비 230% 급증하고 있습니다.' },
    { id: 2, zone_name: '김포공항 국내선', latitude: 37.558, longitude: 126.802, status: 'HIGH', wait_minutes: 5, description: '제주발 항공기 3편이 연속 연착되어 입국장에 승객 대기열이 길게 형성되어 있습니다.' }
  ] as HotZone[],
  revenue_leaderboards: [
    { id: '1', target_date: '2026-06-19', driver_name: '서울 개인 9882', route_summary: '강남역 → 판교 테크노', price: '48,500원', rank: 1 },
    { id: '2', target_date: '2026-06-19', driver_name: '인천 개인 1204', route_summary: '청라국제도시 → 김포공항', price: '32,000원', rank: 2 },
    { id: '3', target_date: '2026-06-19', driver_name: '경기 개인 5530', route_summary: '수원 영통 → 가산디지털', price: '29,400원', rank: 3 }
  ] as RevenueLeaderboard[],
  admin_accounts: [
    { email: 'admin@unsu-platform.com', name: '최고관리자', role: 'Super Admin', created_at: '2026-06-19' }
  ] as AdminAccount[],
  admin_audit_logs: [] as AuditLog[],
  withdrawn_drivers: [] as Array<{ hometax_hash: string; withdrawn_at: string }>
}

let pool: pg.Pool | null = null
const databaseUrl = process.env.DATABASE_URL || process.env.PG_CONNECTION_STRING

async function runMigrations() {
  if (!pool) return
  try {
    // 1. Add navi_preference column if not exists
    await pool.query(`
      ALTER TABLE public.drivers ADD COLUMN IF NOT EXISTS navi_preference VARCHAR(20) DEFAULT 'TMAP';
    `)
    // 2. Create withdrawn_drivers table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS public.withdrawn_drivers (
        hometax_hash VARCHAR(64) PRIMARY KEY,
        withdrawn_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
      );
    `)
    // 3. Create admin_audit_logs table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS public.admin_audit_logs (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        admin_email VARCHAR(100) NOT NULL,
        action_type VARCHAR(50) NOT NULL,
        target_identifier VARCHAR(100) NOT NULL,
        description TEXT NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
      );
    `)
    console.log('[DB] PostgreSQL schema migrations completed.')
  } catch (err) {
    console.warn('[DB] Migration failed or already applied:', err)
  }
}

if (databaseUrl) {
  try {
    pool = new pg.Pool({
      connectionString: databaseUrl,
      ssl: { rejectUnauthorized: false }
    })
    console.log('[DB] PostgreSQL connection pool initialized.')
    runMigrations()
  } catch (err) {
    console.error('[DB] Failed to initialize PostgreSQL pool:', err)
  }
} else {
  console.log('[DB] No database credentials. Local file fallback active.')
}

function readLocalDB(): typeof INITIAL_DATA {
  if (!fs.existsSync(LOCAL_DB_PATH)) {
    fs.writeFileSync(LOCAL_DB_PATH, JSON.stringify(INITIAL_DATA, null, 2))
    return INITIAL_DATA
  }
  try {
    return JSON.parse(fs.readFileSync(LOCAL_DB_PATH, 'utf-8'))
  } catch (err) {
    console.error('[DB] Local DB read error, using initial defaults', err)
    return INITIAL_DATA
  }
}

function writeLocalDB(data: typeof INITIAL_DATA) {
  try {
    fs.writeFileSync(LOCAL_DB_PATH, JSON.stringify(data, null, 2))
  } catch (err) {
    console.error('[DB] Local DB write error:', err)
  }
}

// ----------------------------------------------------
// Driver Profile CRUD
// ----------------------------------------------------
export async function saveDriverProfile(driver: Driver): Promise<void> {
  const encryptedHometax = encrypt(driver.hometax_id)
  const naviPref = driver.navi_preference || 'TMAP'
  if (pool) {
    try {
      await pool.query(
        `INSERT INTO public.drivers (id, birth_date, birth_time, business_type, hometax_id, navi_preference)
         VALUES ($1, $2, $3, $4, $5, $6)
         ON CONFLICT (id) 
         DO UPDATE SET birth_date = $2, birth_time = $3, business_type = $4, hometax_id = $5, navi_preference = $6`,
        [driver.id, driver.birth_date, driver.birth_time, driver.business_type, encryptedHometax, naviPref]
      )
      return
    } catch (err) {
      console.warn('[DB] PostgreSQL saveDriverProfile failed. Falling back.', err)
    }
  }

  const local = readLocalDB()
  const encryptedDriver = { ...driver, hometax_id: encryptedHometax, navi_preference: naviPref }
  const idx = local.drivers.findIndex(d => d.id === driver.id)
  if (idx > -1) {
    local.drivers[idx] = encryptedDriver
  } else {
    local.drivers.push(encryptedDriver)
  }
  writeLocalDB(local)
}

export async function getDriverProfile(id: string): Promise<Driver | null> {
  if (pool) {
    try {
      const res = await pool.query('SELECT * FROM public.drivers WHERE id = $1', [id])
      if (res.rows.length > 0) {
        const row = res.rows[0]
        return {
          id: row.id,
          birth_date: row.birth_date ? new Date(row.birth_date).toISOString().slice(0, 10) : '',
          birth_time: row.birth_time || '',
          business_type: row.business_type,
          hometax_id: decrypt(row.hometax_id),
          navi_preference: row.navi_preference || 'TMAP'
        }
      }
      return null
    } catch (err) {
      console.warn('[DB] PostgreSQL getDriverProfile failed. Falling back.', err)
    }
  }

  const local = readLocalDB()
  const found = local.drivers.find(d => d.id === id)
  if (found) {
    return {
      ...found,
      hometax_id: decrypt(found.hometax_id),
      navi_preference: found.navi_preference || 'TMAP'
    }
  }
  return null
}

// ----------------------------------------------------
// Daily Lucky Cards (Gillog)
// ----------------------------------------------------
export async function getDailyLuckyCard(driverId: string, date: string): Promise<DailyLuckyCard | null> {
  if (pool) {
    try {
      const res = await pool.query(
        'SELECT * FROM public.daily_lucky_cards WHERE driver_id = $1 AND lucky_date = $2',
        [driverId, date]
      )
      if (res.rows.length > 0) {
        return res.rows[0]
      }
      return null
    } catch (err) {
      console.warn('[DB] PostgreSQL getDailyLuckyCard failed. Falling back.', err)
    }
  }

  const local = readLocalDB()
  return local.daily_lucky_cards.find(c => c.driver_id === driverId && c.lucky_date === date) || null
}

export async function saveDailyLuckyCard(card: DailyLuckyCard): Promise<void> {
  if (pool) {
    try {
      await pool.query(
        `INSERT INTO public.daily_lucky_cards (id, driver_id, lucky_date, fortune_grade, fortune_comment)
         VALUES ($1, $2, $3, $4, $5)
         ON CONFLICT (driver_id, lucky_date) DO NOTHING`,
        [card.id, card.driver_id, card.lucky_date, card.fortune_grade, card.fortune_comment]
      )
      return
    } catch (err) {
      console.warn('[DB] PostgreSQL saveDailyLuckyCard failed. Falling back.', err)
    }
  }

  const local = readLocalDB()
  const exists = local.daily_lucky_cards.some(c => c.driver_id === card.driver_id && c.lucky_date === card.lucky_date)
  if (!exists) {
    local.daily_lucky_cards.push(card)
    writeLocalDB(local)
  }
}

// ----------------------------------------------------
// Recommended Courses (Gillog)
// ----------------------------------------------------
export async function getRecommendedCourse(driverId: string, date: string): Promise<RecommendedCourse | null> {
  if (pool) {
    try {
      const res = await pool.query(
        'SELECT * FROM public.recommended_courses WHERE driver_id = $1 AND target_date = $2',
        [driverId, date]
      )
      if (res.rows.length > 0) {
        return res.rows[0]
      }
      return null
    } catch (err) {
      console.warn('[DB] PostgreSQL getRecommendedCourse failed. Falling back.', err)
    }
  }

  const local = readLocalDB()
  return local.recommended_courses.find(c => c.driver_id === driverId && c.target_date === date) || null
}

export async function saveRecommendedCourse(course: RecommendedCourse): Promise<void> {
  if (pool) {
    try {
      await pool.query(
        `INSERT INTO public.recommended_courses (id, driver_id, target_date, destination_name, route_summary, tmap_intent_url)
         VALUES ($1, $2, $3, $4, $5, $6)
         ON CONFLICT DO NOTHING`,
        [course.id, course.driver_id, course.target_date, course.destination_name, course.route_summary, course.tmap_intent_url]
      )
      return
    } catch (err) {
      console.warn('[DB] PostgreSQL saveRecommendedCourse failed. Falling back.', err)
    }
  }

  const local = readLocalDB()
  const exists = local.recommended_courses.some(c => c.driver_id === course.driver_id && c.target_date === course.target_date)
  if (!exists) {
    local.recommended_courses.push(course)
    writeLocalDB(local)
  }
}

// ----------------------------------------------------
// Hot Zones (G-PAN)
// ----------------------------------------------------
export async function getHotZones(): Promise<HotZone[]> {
  if (pool) {
    try {
      const res = await pool.query('SELECT * FROM public.hot_zones')
      return res.rows.map(r => ({
        id: r.id,
        zone_name: r.zone_name,
        latitude: parseFloat(r.latitude),
        longitude: parseFloat(r.longitude),
        status: r.status === 'HIGH' ? 'HIGH' : r.status === 'LOW' ? 'LOW' : 'NORMAL',
        wait_minutes: r.wait_minutes,
        description: r.description
      }))
    } catch (err) {
      console.warn('[DB] PostgreSQL getHotZones failed. Falling back.', err)
    }
  }

  const local = readLocalDB()
  return local.hot_zones
}

export async function updateHotZoneTime(id: number, waitMinutes: number): Promise<void> {
  if (pool) {
    try {
      await pool.query('UPDATE public.hot_zones SET wait_minutes = $2, updated_at = now() WHERE id = $1', [id, waitMinutes])
      return
    } catch (err) {
      console.warn('[DB] PostgreSQL updateHotZoneTime failed. Falling back.', err)
    }
  }

  const local = readLocalDB()
  const idx = local.hot_zones.findIndex(z => z.id === id)
  if (idx > -1) {
    local.hot_zones[idx].wait_minutes = waitMinutes
    writeLocalDB(local)
  }
}

// ----------------------------------------------------
// Revenue Leaderboards (Roadboarder)
// ----------------------------------------------------
export async function getLeaderboard(date: string): Promise<RevenueLeaderboard[]> {
  if (pool) {
    try {
      const res = await pool.query('SELECT * FROM public.revenue_leaderboards WHERE target_date = $1 ORDER BY rank ASC', [date])
      return res.rows
    } catch (err) {
      console.warn('[DB] PostgreSQL getLeaderboard failed. Falling back.', err)
    }
  }

  const local = readLocalDB()
  return local.revenue_leaderboards.filter(l => l.target_date === date).sort((a, b) => a.rank - b.rank)
}

export async function saveLeaderboardRecord(record: RevenueLeaderboard): Promise<void> {
  if (pool) {
    try {
      await pool.query(
        `INSERT INTO public.revenue_leaderboards (id, target_date, driver_name, route_summary, price, rank)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [record.id, record.target_date, record.driver_name, record.route_summary, record.price, record.rank]
      )
      return
    } catch (err) {
      console.warn('[DB] PostgreSQL saveLeaderboardRecord failed. Falling back.', err)
    }
  }

  const local = readLocalDB()
  // Push and re-sort ranks locally
  local.revenue_leaderboards = local.revenue_leaderboards.filter(
    l => !(l.driver_name === record.driver_name && l.target_date === record.target_date)
  )
  local.revenue_leaderboards.push(record)
  writeLocalDB(local)
}

// ----------------------------------------------------
// Admin Accounts (BO)
// ----------------------------------------------------
export async function getAdmins(): Promise<AdminAccount[]> {
  if (pool) {
    try {
      const res = await pool.query('SELECT * FROM public.admin_accounts')
      return res.rows
    } catch (err) {
      console.warn('[DB] PostgreSQL getAdmins failed. Falling back.', err)
    }
  }

  const local = readLocalDB()
  return local.admin_accounts
}

export async function saveAdmin(admin: AdminAccount): Promise<void> {
  if (pool) {
    try {
      await pool.query(
        `INSERT INTO public.admin_accounts (email, name, role)
         VALUES ($1, $2, $3)
         ON CONFLICT (email) DO NOTHING`,
        [admin.email, admin.name, admin.role]
      )
      return
    } catch (err) {
      console.warn('[DB] PostgreSQL saveAdmin failed. Falling back.', err)
    }
  }

  const local = readLocalDB()
  const exists = local.admin_accounts.some(a => a.email === admin.email)
  if (!exists) {
    local.admin_accounts.push(admin)
    writeLocalDB(local)
  }
}

export async function deleteAdmin(email: string): Promise<void> {
  if (pool) {
    try {
      await pool.query('DELETE FROM public.admin_accounts WHERE email = $1', [email])
      return
    } catch (err) {
      console.warn('[DB] PostgreSQL deleteAdmin failed. Falling back.', err)
    }
  }

  const local = readLocalDB()
  local.admin_accounts = local.admin_accounts.filter(a => a.email !== email)
  writeLocalDB(local)
}

export async function updateAdmin(email: string, name: string, role: string): Promise<void> {
  if (pool) {
    try {
      await pool.query(
        'UPDATE public.admin_accounts SET name = $2, role = $3 WHERE email = $1',
        [email, name, role]
      )
      return
    } catch (err) {
      console.warn('[DB] PostgreSQL updateAdmin failed. Falling back.', err)
    }
  }

  const local = readLocalDB()
  const idx = local.admin_accounts.findIndex(a => a.email === email)
  if (idx > -1) {
    local.admin_accounts[idx].name = name
    local.admin_accounts[idx].role = role
    writeLocalDB(local)
  }
}

// ----------------------------------------------------
// Driver Withdrawal & 3-Day Restriction
// ----------------------------------------------------
export async function withdrawDriver(driverId: string): Promise<boolean> {
  const profile = await getDriverProfile(driverId)
  if (!profile) return false
  
  const hometaxHash = hashHometaxId(profile.hometax_id)
  
  if (pool) {
    try {
      // 1. Save withdrawal log
      await pool.query(
        `INSERT INTO public.withdrawn_drivers (hometax_hash, withdrawn_at)
         VALUES ($1, now())
         ON CONFLICT (hometax_hash) DO UPDATE SET withdrawn_at = now()`,
        [hometaxHash]
      )
      // 2. Delete driver (cascades daily cards, courses, etc.)
      await pool.query('DELETE FROM public.drivers WHERE id = $1', [driverId])
      return true
    } catch (err) {
      console.warn('[DB] PostgreSQL withdrawDriver failed. Falling back.', err)
    }
  }
  
  const local = readLocalDB()
  if (!local.withdrawn_drivers) {
    local.withdrawn_drivers = []
  }
  local.withdrawn_drivers = local.withdrawn_drivers.filter(w => w.hometax_hash !== hometaxHash)
  local.withdrawn_drivers.push({ hometax_hash: hometaxHash, withdrawn_at: new Date().toISOString() })
  
  local.drivers = local.drivers.filter(d => d.id !== driverId)
  writeLocalDB(local)
  return true
}

export async function isRejoinRestricted(hometaxId: string): Promise<{ restricted: boolean; withdrawnAt?: string }> {
  const hometaxHash = hashHometaxId(hometaxId)
  const threeDaysAgo = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000)
  
  if (pool) {
    try {
      const res = await pool.query(
        'SELECT withdrawn_at FROM public.withdrawn_drivers WHERE hometax_hash = $1 AND withdrawn_at > $2',
        [hometaxHash, threeDaysAgo]
      )
      if (res.rows.length > 0) {
        return { restricted: true, withdrawnAt: res.rows[0].withdrawn_at }
      }
      return { restricted: false }
    } catch (err) {
      console.warn('[DB] PostgreSQL check restriction failed. Falling back.', err)
    }
  }
  
  const local = readLocalDB()
  const list = local.withdrawn_drivers || []
  const found = list.find(w => w.hometax_hash === hometaxHash)
  if (found) {
    const withdrawnTime = new Date(found.withdrawn_at).getTime()
    if (Date.now() - withdrawnTime < 3 * 24 * 60 * 60 * 1000) {
      return { restricted: true, withdrawnAt: found.withdrawn_at }
    }
  }
  return { restricted: false }
}

// ----------------------------------------------------
// Admin Audit Trail Logs
// ----------------------------------------------------
export async function saveAuditLog(
  adminEmail: string,
  actionType: string,
  targetIdentifier: string,
  description: string
): Promise<void> {
  const createdAt = new Date().toISOString()
  if (pool) {
    try {
      await pool.query(
        `INSERT INTO public.admin_audit_logs (admin_email, action_type, target_identifier, description)
         VALUES ($1, $2, $3, $4)`,
        [adminEmail, actionType, targetIdentifier, description]
      )
      return
    } catch (err) {
      console.warn('[DB] PostgreSQL saveAuditLog failed. Falling back.', err)
    }
  }

  const local = readLocalDB()
  if (!local.admin_audit_logs) {
    local.admin_audit_logs = []
  }
  local.admin_audit_logs.push({
    id: Math.random().toString(36).substring(7),
    admin_email: adminEmail,
    action_type: actionType,
    target_identifier: targetIdentifier,
    description,
    created_at: createdAt
  })
  writeLocalDB(local)
}

export async function getAuditLogs(): Promise<AuditLog[]> {
  if (pool) {
    try {
      const res = await pool.query('SELECT * FROM public.admin_audit_logs ORDER BY created_at DESC')
      return res.rows.map(r => ({
        id: r.id,
        admin_email: r.admin_email,
        action_type: r.action_type,
        target_identifier: r.target_identifier,
        description: r.description,
        created_at: r.created_at
      }))
    } catch (err) {
      console.warn('[DB] PostgreSQL getAuditLogs failed. Falling back.', err)
    }
  }

  const local = readLocalDB()
  return local.admin_audit_logs || []
}

