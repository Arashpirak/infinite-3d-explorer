import { promises as fs } from 'fs'
import path from 'path'
import crypto from 'crypto'
import { db } from './db'

type CodedEntry = {
  c: string // coded hash
  u: string // userId
  s: 'active' | 'deleted'
  t: number // updatedAt epoch ms
}

type CacheEntry = {
  d: string // domain
  u: string // userId
  s: 'active' | 'deleted'
  lastSeen: number
  addedAt: number
}

type CacheState = {
  entries: CacheEntry[]
  ttlHours: number
}

const DOMAINS_DIR = path.join(process.cwd(), 'generated', 'domains')
const CODED_PATH = path.join(DOMAINS_DIR, 'domains-coded.json')
const CACHE_PATH = path.join(DOMAINS_DIR, 'domains-cache.json')
const DEFAULT_TTL_HOURS = 6

async function ensureDirs() {
  await fs.mkdir(DOMAINS_DIR, { recursive: true })
}

export function normalizeDomain(input: string): string {
  const lower = input.trim().toLowerCase()
  return lower.replace(/^https?:\/\//, '').replace(/\/$/, '')
}

export function normalizeOriginToDomain(origin?: string | null): string | null {
  if (!origin) return null
  try {
    const url = new URL(origin)
    return normalizeDomain(url.host)
  } catch {
    return normalizeDomain(origin)
  }
}

function mapDomainToCodeString(domain: string): string {
  // Map each character to a two-digit code for obscurity
  const table: Record<string, number> = {}
  const alphabet = 'abcdefghijklmnopqrstuvwxyz0123456789.-'
  for (let i = 0; i < alphabet.length; i++) table[alphabet[i]] = i + 11
  let out = ''
  for (const ch of domain) {
    const code = table[ch] ?? 99
    out += code.toString().padStart(2, '0')
  }
  return out
}

export function computeDomainCode(domain: string): string {
  const salt = process.env.DOMAIN_CODE_SALT
  if (!salt) throw new Error('DOMAIN_CODE_SALT is required')
  const mapped = mapDomainToCodeString(domain)
  const h = crypto.createHmac('sha256', salt).update(mapped).digest()
  // base64url short code
  return h.toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '').slice(0, 48)
}

async function readJsonSafe<T>(filePath: string, fallback: T): Promise<T> {
  try {
    const buf = await fs.readFile(filePath, 'utf8')
    return JSON.parse(buf) as T
  } catch {
    return fallback
  }
}

async function writeJson(filePath: string, data: any) {
  try {
    await ensureDirs()
    await fs.writeFile(filePath, JSON.stringify(data, null, 2), 'utf8')
  } catch (error: any) {
    // Handle read-only filesystem (e.g., Vercel serverless)
    if (error.code === 'EROFS' || error.code === 'EACCES') {
      console.warn('Cannot write to filesystem (read-only), skipping registry file update:', filePath)
      return
    }
    throw error
  }
}

export async function loadCodedRegistry(): Promise<CodedEntry[]> {
  return readJsonSafe<CodedEntry[]>(CODED_PATH, [])
}

export async function saveCodedRegistry(entries: CodedEntry[]): Promise<void> {
  await writeJson(CODED_PATH, entries)
}

export async function loadCacheRegistry(): Promise<CacheState> {
  const state = await readJsonSafe<CacheState>(CACHE_PATH, { entries: [], ttlHours: DEFAULT_TTL_HOURS })
  const ttlMs = (state.ttlHours ?? DEFAULT_TTL_HOURS) * 3600 * 1000
  const now = Date.now()
  state.entries = state.entries.filter(e => e.lastSeen > now - ttlMs && e.s === 'active')
  return state
}

export async function saveCacheRegistry(state: CacheState): Promise<void> {
  await writeJson(CACHE_PATH, state)
}

export async function upsertDomainInRegistries(userId: string, domain: string, status: 'active' | 'deleted' = 'active') {
  const d = normalizeDomain(domain)
  const code = computeDomainCode(d)
  const now = Date.now()

  // coded registry
  try {
    const coded = await loadCodedRegistry()
    const idx = coded.findIndex(e => e.c === code)
    if (idx >= 0) coded[idx] = { c: code, u: userId, s: status, t: now }
    else coded.push({ c: code, u: userId, s: status, t: now })
    await saveCodedRegistry(coded)
  } catch (error) {
    console.warn('Failed to update coded registry:', error)
  }

  // cache registry
  try {
    const cache = await loadCacheRegistry()
    const cidx = cache.entries.findIndex(e => e.d === d)
    if (status === 'active') {
      if (cidx >= 0) cache.entries[cidx] = { ...cache.entries[cidx], u: userId, s: 'active', lastSeen: now }
      else cache.entries.push({ d, u: userId, s: 'active', lastSeen: now, addedAt: now })
    } else {
      if (cidx >= 0) cache.entries.splice(cidx, 1)
    }
    await saveCacheRegistry(cache)
  } catch (error) {
    console.warn('Failed to update cache registry:', error)
  }
}

export async function isDomainAllowed(domainOrOrigin: string): Promise<{ ok: boolean, userId?: string, domain?: string }> {
  const d = normalizeOriginToDomain(domainOrOrigin) || normalizeDomain(domainOrOrigin)
  if (!d) return { ok: false }

  // 1) Try cache first (if filesystem is writable)
  try {
    const cache = await loadCacheRegistry()
    const now = Date.now()
    const ce = cache.entries.find(e => e.d === d && e.s === 'active')
    if (ce) {
      ce.lastSeen = now
      try {
        await saveCacheRegistry(cache)
      } catch {
        // Ignore filesystem write errors, continue with cached result
      }
      return { ok: true, userId: ce.u, domain: d }
    }
  } catch {
    // Cache read failed, continue to other checks
  }

  // 2) Try coded registry (if filesystem is readable)
  try {
    const code = computeDomainCode(d)
    const coded = await loadCodedRegistry()
    const entry = coded.find(e => e.c === code && e.s === 'active')
    if (entry) {
      // Try to hydrate cache, but don't fail if filesystem is read-only
      try {
        const cache = await loadCacheRegistry()
        cache.entries.push({ d, u: entry.u, s: 'active', lastSeen: Date.now(), addedAt: Date.now() })
        await saveCacheRegistry(cache)
      } catch {
        // Ignore cache write errors
      }
      return { ok: true, userId: entry.u, domain: d }
    }
  } catch {
    // missing salt or filesystem read error → skip coded check
  }

  // 3) DB fallback (always works)
  try {
    const dbDomain = await db.userDomain.findFirst({ where: { domain: d, status: 'active' } })
    if (dbDomain) {
      // Try to mirror into registries, but don't fail if filesystem is read-only
      try {
        await upsertDomainInRegistries(dbDomain.userId, d, 'active')
      } catch {
        // Ignore registry sync errors
      }
      return { ok: true, userId: dbDomain.userId, domain: d }
    }
  } catch (error) {
    console.error('Database fallback failed:', error)
  }

  return { ok: false }
}


