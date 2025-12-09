// ==============================================================================
// file_id: SOM-SCR-0021-v1.0.0
// name: ghost-shell.ts
// description: Ghost_Shell proxy database integration service
// project_id: AEGIS
// category: service
// tags: [ghost-shell, proxy, fingerprint, cookies, tracking]
// created: 2025-12-08
// modified: 2025-12-08
// version: 1.0.0
// agent_id: AGENT-PRIME-001
// ==============================================================================

import Database from 'better-sqlite3'
import { join } from 'path'
import { existsSync } from 'fs'

// Ghost_Shell database path
const GHOST_DB_PATH = join(process.cwd(), '..', '..', 'Ghost_Shell', 'data', 'ghost.db')

export interface TrackingDomain {
  id: number
  domain: string
  first_seen: string
  last_seen: string
  hit_count: number
  blocked: boolean
  category: string
  notes: string | null
}

export interface TrackingIP {
  id: number
  ip_address: string
  first_seen: string
  last_seen: string
  hit_count: number
  blocked: boolean
  associated_domain: string | null
  notes: string | null
}

export interface CookieTraffic {
  id: number
  timestamp: string
  domain: string
  cookie_name: string
  cookie_value: string
  ip_address: string
  request_url: string
  blocked: boolean
}

export interface FingerprintRotation {
  id: number
  timestamp: string
  user_agent: string
  platform: string
  accept_language: string
  accept_encoding: string
  referer_policy: string | null
  rotation_trigger: string
}

export interface RequestLog {
  id: number
  timestamp: string
  method: string
  url: string
  host: string
  ip_address: string
  fingerprint_id: number | null
  blocked: boolean
  block_reason: string | null
}

export interface WhitelistEntry {
  id: number
  domain: string
  added: string
  reason: string | null
}

export interface GhostShellStats {
  totalRequests: number
  blockedRequests: number
  totalCookies: number
  blockedCookies: number
  trackingDomains: number
  blockedDomains: number
  fingerprintRotations: number
  whitelistCount: number
  recentRequests: RequestLog[]
  topBlockedDomains: Array<{ domain: string; count: number }>
  recentCookies: CookieTraffic[]
  latestFingerprint: FingerprintRotation | null
  isConnected: boolean
  dbPath: string
}

class GhostShellService {
  private db: Database.Database | null = null
  private dbPath: string

  constructor() {
    this.dbPath = GHOST_DB_PATH
    this.connect()
  }

  private connect(): boolean {
    if (!existsSync(this.dbPath)) {
      console.log(`Ghost_Shell database not found at ${this.dbPath}`)
      return false
    }

    try {
      this.db = new Database(this.dbPath, { readonly: true })
      console.log(`Connected to Ghost_Shell database at ${this.dbPath}`)
      return true
    } catch (error) {
      console.error('Failed to connect to Ghost_Shell database:', error)
      return false
    }
  }

  isConnected(): boolean {
    return this.db !== null
  }

  getStats(): GhostShellStats {
    if (!this.db) {
      return this.getEmptyStats()
    }

    try {
      // Count totals - use try/catch for each query in case tables don't exist
      let totalRequests = 0, blockedRequests = 0, totalCookies = 0, blockedCookies = 0
      let trackingDomains = 0, blockedDomains = 0, fingerprintRotations = 0, whitelistCount = 0

      try {
        totalRequests = (this.db.prepare('SELECT COUNT(*) as count FROM request_log').get() as { count: number }).count
        blockedRequests = (this.db.prepare('SELECT COUNT(*) as count FROM request_log WHERE blocked = 1').get() as { count: number }).count
      } catch {}

      try {
        totalCookies = (this.db.prepare('SELECT COUNT(*) as count FROM cookie_traffic').get() as { count: number }).count
        blockedCookies = (this.db.prepare('SELECT COUNT(*) as count FROM cookie_traffic WHERE blocked = 1').get() as { count: number }).count
      } catch {}

      try {
        trackingDomains = (this.db.prepare('SELECT COUNT(*) as count FROM tracking_domains').get() as { count: number }).count
        blockedDomains = (this.db.prepare('SELECT COUNT(*) as count FROM tracking_domains WHERE blocked = 1').get() as { count: number }).count
      } catch {}

      try {
        fingerprintRotations = (this.db.prepare('SELECT COUNT(*) as count FROM fingerprint_rotations').get() as { count: number }).count
      } catch {}

      try {
        whitelistCount = (this.db.prepare('SELECT COUNT(*) as count FROM whitelist').get() as { count: number }).count
      } catch {}

      // Recent requests
      let recentRequests: RequestLog[] = []
      try {
        recentRequests = this.db.prepare(`
          SELECT * FROM request_log
          ORDER BY timestamp DESC
          LIMIT 20
        `).all() as RequestLog[]
      } catch {}

      // Top blocked domains
      let topBlockedDomains: Array<{ domain: string; count: number }> = []
      try {
        topBlockedDomains = this.db.prepare(`
          SELECT domain, COUNT(*) as count
          FROM cookie_traffic
          WHERE blocked = 1
          GROUP BY domain
          ORDER BY count DESC
          LIMIT 10
        `).all() as Array<{ domain: string; count: number }>
      } catch {}

      // Recent cookies
      let recentCookies: CookieTraffic[] = []
      try {
        recentCookies = this.db.prepare(`
          SELECT * FROM cookie_traffic
          ORDER BY timestamp DESC
          LIMIT 15
        `).all() as CookieTraffic[]
      } catch {}

      // Latest fingerprint
      let latestFingerprint: FingerprintRotation | null = null
      try {
        latestFingerprint = this.db.prepare(`
          SELECT * FROM fingerprint_rotations
          ORDER BY timestamp DESC
          LIMIT 1
        `).get() as FingerprintRotation | undefined || null
      } catch {}

      return {
        totalRequests,
        blockedRequests,
        totalCookies,
        blockedCookies,
        trackingDomains,
        blockedDomains,
        fingerprintRotations,
        whitelistCount,
        recentRequests,
        topBlockedDomains,
        recentCookies,
        latestFingerprint,
        isConnected: true,
        dbPath: this.dbPath
      }
    } catch (error) {
      console.error('Error fetching Ghost_Shell stats:', error)
      return this.getEmptyStats()
    }
  }

  getTrackingDomains(limit: number = 100, blockedOnly: boolean = false): TrackingDomain[] {
    if (!this.db) return []

    try {
      const whereClause = blockedOnly ? 'WHERE blocked = 1' : ''
      return this.db.prepare(`
        SELECT * FROM tracking_domains
        ${whereClause}
        ORDER BY hit_count DESC
        LIMIT ?
      `).all(limit) as TrackingDomain[]
    } catch (error) {
      console.error('Error fetching tracking domains:', error)
      return []
    }
  }

  getTrackingIPs(limit: number = 100): TrackingIP[] {
    if (!this.db) return []

    try {
      return this.db.prepare(`
        SELECT * FROM tracking_ips
        ORDER BY hit_count DESC
        LIMIT ?
      `).all(limit) as TrackingIP[]
    } catch (error) {
      console.error('Error fetching tracking IPs:', error)
      return []
    }
  }

  getCookieTraffic(limit: number = 100, domain?: string): CookieTraffic[] {
    if (!this.db) return []

    try {
      if (domain) {
        return this.db.prepare(`
          SELECT * FROM cookie_traffic
          WHERE domain LIKE ?
          ORDER BY timestamp DESC
          LIMIT ?
        `).all(`%${domain}%`, limit) as CookieTraffic[]
      }
      return this.db.prepare(`
        SELECT * FROM cookie_traffic
        ORDER BY timestamp DESC
        LIMIT ?
      `).all(limit) as CookieTraffic[]
    } catch (error) {
      console.error('Error fetching cookie traffic:', error)
      return []
    }
  }

  getFingerprints(limit: number = 50): FingerprintRotation[] {
    if (!this.db) return []

    try {
      return this.db.prepare(`
        SELECT * FROM fingerprint_rotations
        ORDER BY timestamp DESC
        LIMIT ?
      `).all(limit) as FingerprintRotation[]
    } catch (error) {
      console.error('Error fetching fingerprints:', error)
      return []
    }
  }

  getRequestLog(limit: number = 100, blockedOnly: boolean = false): RequestLog[] {
    if (!this.db) return []

    try {
      const whereClause = blockedOnly ? 'WHERE blocked = 1' : ''
      return this.db.prepare(`
        SELECT * FROM request_log
        ${whereClause}
        ORDER BY timestamp DESC
        LIMIT ?
      `).all(limit) as RequestLog[]
    } catch (error) {
      console.error('Error fetching request log:', error)
      return []
    }
  }

  getWhitelist(): WhitelistEntry[] {
    if (!this.db) return []

    try {
      return this.db.prepare('SELECT * FROM whitelist ORDER BY added DESC').all() as WhitelistEntry[]
    } catch (error) {
      console.error('Error fetching whitelist:', error)
      return []
    }
  }

  private getEmptyStats(): GhostShellStats {
    return {
      totalRequests: 0,
      blockedRequests: 0,
      totalCookies: 0,
      blockedCookies: 0,
      trackingDomains: 0,
      blockedDomains: 0,
      fingerprintRotations: 0,
      whitelistCount: 0,
      recentRequests: [],
      topBlockedDomains: [],
      recentCookies: [],
      latestFingerprint: null,
      isConnected: false,
      dbPath: this.dbPath
    }
  }

  close(): void {
    if (this.db) {
      this.db.close()
      this.db = null
    }
  }
}

// Singleton instance
let ghostShellService: GhostShellService | null = null

export function getGhostShellService(): GhostShellService {
  if (!ghostShellService) {
    ghostShellService = new GhostShellService()
  }
  return ghostShellService
}

export default GhostShellService
