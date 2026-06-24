import pg from 'pg'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import dotenv from 'dotenv'
import { encrypt, decrypt, hashHometaxId } from './crypto.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
dotenv.config({ path: path.join(__dirname, '../../../.env') })

const LOCAL_DB_PATH = path.join(__dirname, 'local_db.json')

export interface Driver {
  id: string
  birth_date: string
  birth_time: string
  business_type: 'PRIVATE' | 'PREMIUM'
  hometax_id: string
  navi_preference?: 'TMAP' | 'KAKAONAVI'
  name?: string
  phone_number?: string
  car_model?: string
  car_number?: string
  email?: string
  address?: string
}

export interface AuditLog {
  id: string
  operator_email: string
  action_type: string
  target_id: string
  details: string
  created_at: string
}

export interface AudioBroadcastLog {
  id: string
  driver_id: string
  broadcast_text: string
  sent_at: string
}


export interface DailyLuckyCard {
  id: string
  driver_id: string
  lucky_date: string
  fortune_grade: 'BEST' | 'GOOD' | 'NORMAL' | 'BAD'
  fortune_score: number
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
  audio_broadcast_logs: [] as AudioBroadcastLog[],
  withdrawn_drivers: [] as Array<{ hometax_hash: string; withdrawn_at: string }>,
  financial_records: [] as FinancialRecord[],
  tax_refunds: [] as TaxRefund[],
  global_settings: [] as Array<{ key: string; value: string }>
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
    // Add additional info columns if not exists
    await pool.query(`
      ALTER TABLE public.drivers ADD COLUMN IF NOT EXISTS name VARCHAR(50);
      ALTER TABLE public.drivers ADD COLUMN IF NOT EXISTS phone_number VARCHAR(20);
      ALTER TABLE public.drivers ADD COLUMN IF NOT EXISTS car_model VARCHAR(50);
      ALTER TABLE public.drivers ADD COLUMN IF NOT EXISTS car_number VARCHAR(20);
      ALTER TABLE public.drivers ADD COLUMN IF NOT EXISTS email VARCHAR(100);
      ALTER TABLE public.drivers ADD COLUMN IF NOT EXISTS address TEXT;
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

    // Create audio_broadcast_logs table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS public.audio_broadcast_logs (
        id VARCHAR(100) PRIMARY KEY,
        driver_id VARCHAR(100) NOT NULL REFERENCES public.drivers(id) ON DELETE CASCADE,
        broadcast_text TEXT NOT NULL,
        sent_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
      );
    `)

    // 4. Seed default admin account if empty
    const adminCheck = await pool.query('SELECT COUNT(*) FROM public.admin_accounts')
    if (parseInt(adminCheck.rows[0].count, 10) === 0) {
      console.log('[DB] Seeding default admin account...')
      await pool.query(`
        INSERT INTO public.admin_accounts (email, name, role, password_hash)
        VALUES ('admin@unsu-platform.com', '최고관리자', 'Super Admin', '07e60086c7cfc5ffdfa6a1c8f121d5a864a7c8c3e80c6be4a0b27b9c97b83be1')
      `)
    }

    // 5. Seed default hot zones if empty
    const hzCheck = await pool.query('SELECT COUNT(*) FROM public.hot_zones')
    if (parseInt(hzCheck.rows[0].count, 10) === 0) {
      console.log('[DB] Seeding default hot zones...')
      for (const zone of INITIAL_DATA.hot_zones) {
        await pool.query(`
          INSERT INTO public.hot_zones (id, zone_name, latitude, longitude, status, wait_minutes, description)
          VALUES ($1, $2, $3, $4, $5, $6, $7)
        `, [zone.id, zone.zone_name, zone.latitude, zone.longitude, zone.status, zone.wait_minutes, zone.description])
      }
    }

    // 6. Seed default leaderboard records if empty
    const lbCheck = await pool.query('SELECT COUNT(*) FROM public.revenue_leaderboards')
    if (parseInt(lbCheck.rows[0].count, 10) === 0) {
      console.log('[DB] Seeding default leaderboard records...')
      for (const record of INITIAL_DATA.revenue_leaderboards) {
        await pool.query(`
          INSERT INTO public.revenue_leaderboards (id, target_date, driver_name, route_summary, price, rank)
          VALUES ($1, $2, $3, $4, $5, $6)
        `, [record.id, record.target_date, record.driver_name, record.route_summary, record.price, record.rank])
      }
    }

    // 7. Create global_settings table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS public.global_settings (
        key VARCHAR(100) PRIMARY KEY,
        value TEXT NOT NULL
      );
    `)

    console.log('[DB] PostgreSQL schema migrations and seeding completed.')
  } catch (err) {
    console.warn('[DB] Migration/seeding failed or already applied:', err)
  }
}

export let migrationPromise: Promise<void> | null = null;

if (databaseUrl) {
  try {
    pool = new pg.Pool({
      connectionString: databaseUrl,
      ssl: { rejectUnauthorized: false }
    })
    console.log('[DB] PostgreSQL connection pool initialized.')
    migrationPromise = runMigrations()
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
        `INSERT INTO public.drivers (id, birth_date, birth_time, business_type, hometax_id, navi_preference, name, phone_number, car_model, car_number, email, address)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
         ON CONFLICT (id) 
         DO UPDATE SET birth_date = $2, birth_time = $3, business_type = $4, hometax_id = $5, navi_preference = $6, name = $7, phone_number = $8, car_model = $9, car_number = $10, email = $11, address = $12`,
        [
          driver.id,
          driver.birth_date,
          driver.birth_time,
          driver.business_type,
          encryptedHometax,
          naviPref,
          driver.name || null,
          driver.phone_number || null,
          driver.car_model || null,
          driver.car_number || null,
          driver.email || null,
          driver.address || null
        ]
      )
      return
    } catch (err) {
      console.warn('[DB] PostgreSQL saveDriverProfile failed. Falling back.', err)
    }
  }

  const local = readLocalDB()
  const encryptedDriver = {
    ...driver,
    hometax_id: encryptedHometax,
    navi_preference: naviPref,
    name: driver.name || '',
    phone_number: driver.phone_number || '',
    car_model: driver.car_model || '',
    car_number: driver.car_number || '',
    email: driver.email || '',
    address: driver.address || ''
  }
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
        
        // Safety format for DATE to avoid timezone shifting
        let formattedDate = ''
        if (row.birth_date) {
          const d = new Date(row.birth_date)
          const year = d.getFullYear()
          const month = String(d.getMonth() + 1).padStart(2, '0')
          const day = String(d.getDate()).padStart(2, '0')
          formattedDate = `${year}-${month}-${day}`
        }

        return {
          id: row.id,
          birth_date: formattedDate,
          birth_time: row.birth_time ? row.birth_time.slice(0, 5) : '', // Slice HH:MM:SS -> HH:MM
          business_type: row.business_type,
          hometax_id: decrypt(row.hometax_id),
          navi_preference: row.navi_preference || 'TMAP',
          name: row.name || '',
          phone_number: row.phone_number || '',
          car_model: row.car_model || '',
          car_number: row.car_number || '',
          email: row.email || '',
          address: row.address || ''
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
      navi_preference: found.navi_preference || 'TMAP',
      name: found.name || '',
      phone_number: found.phone_number || '',
      car_model: found.car_model || '',
      car_number: found.car_number || '',
      email: found.email || '',
      address: found.address || ''
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
        `INSERT INTO public.daily_lucky_cards (id, driver_id, lucky_date, fortune_grade, fortune_score, fortune_comment)
         VALUES ($1, $2, $3, $4, $5, $6)
         ON CONFLICT (driver_id, lucky_date) DO NOTHING`,
        [card.id, card.driver_id, card.lucky_date, card.fortune_grade, card.fortune_score, card.fortune_comment]
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
        `INSERT INTO public.admin_accounts (email, name, role, password_hash)
         VALUES ($1, $2, $3, $4)
         ON CONFLICT (email) DO NOTHING`,
        [admin.email, admin.name, admin.role, '07e60086c7cfc5ffdfa6a1c8f121d5a864a7c8c3e80c6be4a0b27b9c97b83be1']
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

  // Obsidian Integration: Save audit log to markdown in z_history/audit_logs/
  try {
    const timestampStr = new Date().toISOString().replace(/[:.]/g, '-')
    const logFilename = `audit_${timestampStr}.md`
    const logDir = path.resolve(__dirname, '..', '..', '..', 'z_history', 'audit_logs')
    if (!fs.existsSync(logDir)) {
      fs.mkdirSync(logDir, { recursive: true })
    }
    const logPath = path.join(logDir, logFilename)
    const mdContent = `---
type: audit-log
admin_email: "${adminEmail}"
action_type: "${actionType}"
target_identifier: "${targetIdentifier}"
date: "${createdAt}"
---

# UNSU 플랫폼 시스템 감사 로그

* **작업자**: ${adminEmail}
* **작업 분류**: ${actionType}
* **대상 식별자**: ${targetIdentifier}
* **발생 일시**: ${createdAt}

## 작업 세부 내역
${description}
`
    fs.writeFileSync(logPath, mdContent, 'utf8')
    console.log(`[Obsidian] Saved audit log: ${logFilename}`)
  } catch (fileErr: any) {
    console.warn('[Obsidian] Failed to save audit log markdown:', fileErr.message)
  }

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
    operator_email: adminEmail,
    action_type: actionType,
    target_id: targetIdentifier,
    details: description,
    created_at: createdAt
  } as AuditLog)
  writeLocalDB(local)
}

export async function getAuditLogs(): Promise<AuditLog[]> {
  if (pool) {
    try {
      const res = await pool.query('SELECT * FROM public.admin_audit_logs ORDER BY created_at DESC')
      return res.rows.map(r => ({
        id: r.id,
        operator_email: r.admin_email,
        action_type: r.action_type,
        target_id: r.target_identifier,
        details: r.description,
        created_at: r.created_at
      }))
    } catch (err) {
      console.warn('[DB] PostgreSQL getAuditLogs failed. Falling back.', err)
    }
  }

  const local = readLocalDB()
  const list = local.admin_audit_logs || []
  return list.map((log: any) => ({
    id: log.id,
    operator_email: log.operator_email || log.admin_email,
    action_type: log.action_type,
    target_id: log.target_id || log.target_identifier,
    details: log.details || log.description,
    created_at: log.created_at
  }))
}

// ----------------------------------------------------
// Autopilot (Financials & Tax Refunds)
// ----------------------------------------------------
export interface FinancialRecord {
  id: string
  driver_id: string
  record_month: string
  total_revenue: number
  fixed_expense: number
}

export interface TaxRefund {
  id: string
  driver_id: string
  request_date: string
  status: 'PENDING' | 'SUCCESS' | 'FAILED'
  estimated_refund_amount: number
  processed_at?: string
}

export async function getFinancialRecord(driverId: string, month: string): Promise<FinancialRecord | null> {
  if (pool) {
    try {
      const res = await pool.query(
        'SELECT * FROM public.financial_records WHERE driver_id = $1 AND record_month = $2',
        [driverId, month]
      )
      if (res.rows.length > 0) {
        return {
          id: res.rows[0].id,
          driver_id: res.rows[0].driver_id,
          record_month: res.rows[0].record_month,
          total_revenue: Number(res.rows[0].total_revenue),
          fixed_expense: Number(res.rows[0].fixed_expense)
        }
      }
      return null
    } catch (err) {
      console.warn('[DB] PostgreSQL getFinancialRecord failed. Falling back.', err)
    }
  }

  const local = readLocalDB()
  if (!local.financial_records) {
    local.financial_records = []
  }
  return local.financial_records.find(r => r.driver_id === driverId && r.record_month === month) || null;
}

export async function saveFinancialRecord(record: FinancialRecord): Promise<void> {
  if (pool) {
    try {
      await pool.query(
        `INSERT INTO public.financial_records (id, driver_id, record_month, total_revenue, fixed_expense)
         VALUES ($1, $2, $3, $4, $5)
         ON CONFLICT (driver_id, record_month) 
         DO UPDATE SET total_revenue = $4, fixed_expense = $5`,
        [record.id, record.driver_id, record.record_month, record.total_revenue, record.fixed_expense]
      )
      return
    } catch (err) {
      console.warn('[DB] PostgreSQL saveFinancialRecord failed. Falling back.', err)
    }
  }

  const local = readLocalDB()
  if (!local.financial_records) {
    local.financial_records = []
  }
  const idx = local.financial_records.findIndex(r => r.driver_id === record.driver_id && r.record_month === record.record_month)
  if (idx > -1) {
    local.financial_records[idx] = record
  } else {
    local.financial_records.push(record)
  }
  writeLocalDB(local)
}

export async function saveTaxRefund(refund: TaxRefund): Promise<void> {
  if (pool) {
    try {
      await pool.query(
        `INSERT INTO public.tax_refunds (id, driver_id, request_date, status, estimated_refund_amount, processed_at)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [refund.id, refund.driver_id, refund.request_date, refund.status, refund.estimated_refund_amount, refund.processed_at || null]
      )
      return
    } catch (err) {
      console.warn('[DB] PostgreSQL saveTaxRefund failed. Falling back.', err)
    }
  }

  const local = readLocalDB()
  if (!local.tax_refunds) {
    local.tax_refunds = []
  }
  local.tax_refunds.push(refund)
  writeLocalDB(local)
}

export async function getTaxRefunds(driverId: string): Promise<TaxRefund[]> {
  if (pool) {
    try {
      const res = await pool.query(
        'SELECT * FROM public.tax_refunds WHERE driver_id = $1 ORDER BY request_date DESC',
        [driverId]
      )
      return res.rows.map(r => ({
        id: r.id,
        driver_id: r.driver_id,
        request_date: r.request_date,
        status: r.status,
        estimated_refund_amount: Number(r.estimated_refund_amount),
        processed_at: r.processed_at
      }))
    } catch (err) {
      console.warn('[DB] PostgreSQL getTaxRefunds failed. Falling back.', err)
    }
  }

  const local = readLocalDB()
  if (!local.tax_refunds) {
    return []
  }
  return local.tax_refunds.filter(r => r.driver_id === driverId)
}

export async function getAllDrivers(): Promise<Driver[]> {
  if (pool) {
    try {
      const res = await pool.query('SELECT * FROM public.drivers ORDER BY created_at DESC')
      return res.rows.map(row => {
        let formattedDate = ''
        if (row.birth_date) {
          const d = new Date(row.birth_date)
          const year = d.getFullYear()
          const month = String(d.getMonth() + 1).padStart(2, '0')
          const day = String(d.getDate()).padStart(2, '0')
          formattedDate = `${year}-${month}-${day}`
        }
        return {
          id: row.id,
          birth_date: formattedDate,
          birth_time: row.birth_time ? row.birth_time.slice(0, 5) : '',
          business_type: row.business_type,
          hometax_id: decrypt(row.hometax_id),
          navi_preference: row.navi_preference || 'TMAP',
          name: row.name || '',
          phone_number: row.phone_number || '',
          car_model: row.car_model || '',
          car_number: row.car_number || '',
          email: row.email || '',
          address: row.address || ''
        }
      })
    } catch (err) {
      console.warn('[DB] PostgreSQL getAllDrivers failed. Falling back.', err)
    }
  }

  const local = readLocalDB()
  return (local.drivers || []).map(d => ({
    ...d,
    hometax_id: decrypt(d.hometax_id)
  }))
}

// ----------------------------------------------------
// Global Settings (Intro Image etc.)
// ----------------------------------------------------
export async function getIntroImage(): Promise<string> {
  if (pool) {
    try {
      const res = await pool.query('SELECT value FROM public.global_settings WHERE key = $1', ['intro_image'])
      if (res.rows.length > 0) {
        return res.rows[0].value
      }
      return ''
    } catch (err) {
      console.warn('[DB] PostgreSQL getIntroImage failed. Falling back.', err)
    }
  }

  const local = readLocalDB()
  if (!local.global_settings) {
    local.global_settings = []
  }
  const found = local.global_settings.find(s => s.key === 'intro_image')
  return found ? found.value : ''
}

export async function saveIntroImage(base64: string): Promise<void> {
  if (pool) {
    try {
      await pool.query(
        `INSERT INTO public.global_settings (key, value)
         VALUES ($1, $2)
         ON CONFLICT (key) DO UPDATE SET value = $2`,
        ['intro_image', base64]
      )
      return
    } catch (err) {
      console.warn('[DB] PostgreSQL saveIntroImage failed. Falling back.', err)
    }
  }

  const local = readLocalDB()
  if (!local.global_settings) {
    local.global_settings = []
  }
  const idx = local.global_settings.findIndex(s => s.key === 'intro_image')
  if (idx > -1) {
    local.global_settings[idx].value = base64
  } else {
    local.global_settings.push({ key: 'intro_image', value: base64 })
  }
  writeLocalDB(local)
}

export async function saveAudioBroadcastLog(log: { id: string; driver_id: string; broadcast_text: string }): Promise<void> {
  const sentAt = new Date().toISOString()
  if (pool) {
    try {
      await pool.query(
        `INSERT INTO public.audio_broadcast_logs (id, driver_id, broadcast_text, sent_at)
         VALUES ($1, $2, $3, $4)`,
        [log.id, log.driver_id, log.broadcast_text, sentAt]
      )
      return
    } catch (err) {
      console.warn('[DB] PostgreSQL saveAudioBroadcastLog failed. Falling back.', err)
    }
  }

  const local = readLocalDB()
  if (!local.audio_broadcast_logs) {
    local.audio_broadcast_logs = []
  }
  local.audio_broadcast_logs.push({
    id: log.id,
    driver_id: log.driver_id,
    broadcast_text: log.broadcast_text,
    sent_at: sentAt
  })
  writeLocalDB(local)
}

export async function getAudioBroadcastLogs(driverId: string): Promise<AudioBroadcastLog[]> {
  if (pool) {
    try {
      const res = await pool.query(
        'SELECT * FROM public.audio_broadcast_logs WHERE driver_id = $1 ORDER BY sent_at DESC',
        [driverId]
      )
      return res.rows
    } catch (err) {
      console.warn('[DB] PostgreSQL getAudioBroadcastLogs failed. Falling back.', err)
    }
  }

  const local = readLocalDB()
  if (!local.audio_broadcast_logs) {
    return []
  }
  return local.audio_broadcast_logs.filter(l => l.driver_id === driverId).sort((a, b) => b.sent_at.localeCompare(a.sent_at))
}

export interface TokenUsage {
  id: string
  date: string
  prompt_tokens: number
  output_tokens: number
  total_tokens: number
}

export function recordTokenUsage(prompt: number, output: number, total: number) {
  const local = readLocalDB()
  if (!local.token_usage) {
    local.token_usage = []
  }
  
  const todayStr = new Date().toISOString().slice(0, 10)
  const existingIndex = local.token_usage.findIndex((t: TokenUsage) => t.date === todayStr)
  
  if (existingIndex >= 0) {
    local.token_usage[existingIndex].prompt_tokens += prompt
    local.token_usage[existingIndex].output_tokens += output
    local.token_usage[existingIndex].total_tokens += total
  } else {
    local.token_usage.push({
      id: Math.random().toString(36).substr(2, 9),
      date: todayStr,
      prompt_tokens: prompt,
      output_tokens: output,
      total_tokens: total
    })
  }
  
  writeLocalDB(local)
}

export function getTokenUsage(): TokenUsage[] {
  const local = readLocalDB()
  return local.token_usage || []
}

export interface TokenUsageLog {
  id: string
  timestamp: string
  driver_id: string
  prompt_tokens: number
  output_tokens: number
  total_tokens: number
}

export function recordTokenUsageLog(driverId: string, prompt: number, output: number, total: number) {
  const local = readLocalDB()
  if (!local.token_usage_logs) {
    local.token_usage_logs = []
  }
  
  local.token_usage_logs.push({
    id: Math.random().toString(36).substr(2, 9),
    timestamp: new Date().toISOString(),
    driver_id: driverId,
    prompt_tokens: prompt,
    output_tokens: output,
    total_tokens: total
  })
  
  // Keep only the last 1000 logs to prevent memory bloat
  if (local.token_usage_logs.length > 1000) {
    local.token_usage_logs = local.token_usage_logs.slice(-1000)
  }
  
  writeLocalDB(local)
}

export function getTokenUsageLogs(): TokenUsageLog[] {
  const local = readLocalDB()
  return local.token_usage_logs || []
}
