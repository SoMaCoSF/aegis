// ==============================================================================
// file_id: SOM-SCR-0020-v1.0.0
// name: dmbt.ts
// description: DMBT (Delete Me | Block Them) database integration service
// project_id: AEGIS
// category: service
// tags: [dmbt, network, asn, firewall, blocking]
// created: 2025-12-08
// modified: 2025-12-08
// version: 1.0.0
// agent_id: AGENT-PRIME-001
// ==============================================================================

import Database from 'better-sqlite3'
import { join } from 'path'
import { existsSync } from 'fs'

// DMBT database path
const DMBT_DB_PATH = join(process.cwd(), '..', '..', 'DMBT', 'data', 'dmbt.sqlite')

export interface IPMapping {
  domain: string
  ip: string
  ip_version: number
  asn: string
  asn_name: string
  source: string
  seen_at: string
}

export interface ASNMapping {
  asn: string
  org_name: string
  first_seen: string
  last_seen: string
}

export interface PrefixMapping {
  prefix: string
  asn: string
  source: string
  first_seen: string
  last_seen: string
}

export interface BlocklistEntry {
  prefix: string
  asn: string
  reason: string
  added_at: string
}

export interface DMBTStats {
  totalDomains: number
  totalIPs: number
  totalASNs: number
  totalPrefixes: number
  blockedPrefixes: number
  recentIPMappings: IPMapping[]
  topASNs: Array<{
    asn: string
    org_name: string
    ip_count: number
    prefix_count: number
    blocked: boolean
  }>
  recentBlocks: BlocklistEntry[]
  isConnected: boolean
  dbPath: string
}

class DMBTService {
  private db: Database.Database | null = null
  private dbPath: string

  constructor() {
    this.dbPath = DMBT_DB_PATH
    this.connect()
  }

  private connect(): boolean {
    if (!existsSync(this.dbPath)) {
      console.log(`DMBT database not found at ${this.dbPath}`)
      return false
    }

    try {
      this.db = new Database(this.dbPath, { readonly: true })
      console.log(`Connected to DMBT database at ${this.dbPath}`)
      return true
    } catch (error) {
      console.error('Failed to connect to DMBT database:', error)
      return false
    }
  }

  isConnected(): boolean {
    return this.db !== null
  }

  getStats(): DMBTStats {
    if (!this.db) {
      return this.getEmptyStats()
    }

    try {
      // Count totals
      const domainCount = this.db.prepare('SELECT COUNT(DISTINCT domain) as count FROM ip_map').get() as { count: number }
      const ipCount = this.db.prepare('SELECT COUNT(*) as count FROM ip_map').get() as { count: number }
      const asnCount = this.db.prepare('SELECT COUNT(*) as count FROM asn_map').get() as { count: number }
      const prefixCount = this.db.prepare('SELECT COUNT(*) as count FROM prefix_map').get() as { count: number }
      const blockedCount = this.db.prepare('SELECT COUNT(*) as count FROM blocklist').get() as { count: number }

      // Recent IP mappings
      const recentIPMappings = this.db.prepare(`
        SELECT domain, ip, ip_version, asn, asn_name, source, seen_at
        FROM ip_map
        ORDER BY seen_at DESC
        LIMIT 20
      `).all() as IPMapping[]

      // Top ASNs by IP count
      const topASNs = this.db.prepare(`
        SELECT
          a.asn,
          a.org_name,
          COUNT(DISTINCT i.ip) as ip_count,
          COUNT(DISTINCT p.prefix) as prefix_count,
          CASE WHEN b.asn IS NOT NULL THEN 1 ELSE 0 END as blocked
        FROM asn_map a
        LEFT JOIN ip_map i ON i.asn = a.asn
        LEFT JOIN prefix_map p ON p.asn = a.asn
        LEFT JOIN (SELECT DISTINCT asn FROM blocklist) b ON b.asn = a.asn
        GROUP BY a.asn
        ORDER BY ip_count DESC
        LIMIT 15
      `).all() as Array<{
        asn: string
        org_name: string
        ip_count: number
        prefix_count: number
        blocked: number
      }>

      // Recent blocklist entries
      const recentBlocks = this.db.prepare(`
        SELECT prefix, asn, reason, added_at
        FROM blocklist
        ORDER BY added_at DESC
        LIMIT 10
      `).all() as BlocklistEntry[]

      return {
        totalDomains: domainCount.count,
        totalIPs: ipCount.count,
        totalASNs: asnCount.count,
        totalPrefixes: prefixCount.count,
        blockedPrefixes: blockedCount.count,
        recentIPMappings,
        topASNs: topASNs.map(a => ({
          ...a,
          blocked: a.blocked === 1
        })),
        recentBlocks,
        isConnected: true,
        dbPath: this.dbPath
      }
    } catch (error) {
      console.error('Error fetching DMBT stats:', error)
      return this.getEmptyStats()
    }
  }

  getIPMappings(limit: number = 100, domain?: string): IPMapping[] {
    if (!this.db) return []

    try {
      if (domain) {
        return this.db.prepare(`
          SELECT * FROM ip_map
          WHERE domain LIKE ?
          ORDER BY seen_at DESC
          LIMIT ?
        `).all(`%${domain}%`, limit) as IPMapping[]
      }
      return this.db.prepare(`
        SELECT * FROM ip_map
        ORDER BY seen_at DESC
        LIMIT ?
      `).all(limit) as IPMapping[]
    } catch (error) {
      console.error('Error fetching IP mappings:', error)
      return []
    }
  }

  getASNs(limit: number = 50): ASNMapping[] {
    if (!this.db) return []

    try {
      return this.db.prepare(`
        SELECT * FROM asn_map
        ORDER BY last_seen DESC
        LIMIT ?
      `).all(limit) as ASNMapping[]
    } catch (error) {
      console.error('Error fetching ASNs:', error)
      return []
    }
  }

  getPrefixes(asn?: string, limit: number = 100): PrefixMapping[] {
    if (!this.db) return []

    try {
      if (asn) {
        return this.db.prepare(`
          SELECT * FROM prefix_map
          WHERE asn = ?
          ORDER BY first_seen DESC
          LIMIT ?
        `).all(asn, limit) as PrefixMapping[]
      }
      return this.db.prepare(`
        SELECT * FROM prefix_map
        ORDER BY first_seen DESC
        LIMIT ?
      `).all(limit) as PrefixMapping[]
    } catch (error) {
      console.error('Error fetching prefixes:', error)
      return []
    }
  }

  getBlocklist(): BlocklistEntry[] {
    if (!this.db) return []

    try {
      return this.db.prepare(`
        SELECT * FROM blocklist
        ORDER BY added_at DESC
      `).all() as BlocklistEntry[]
    } catch (error) {
      console.error('Error fetching blocklist:', error)
      return []
    }
  }

  getASNDetails(asn: string): {
    asn: ASNMapping | null
    ips: IPMapping[]
    prefixes: PrefixMapping[]
    blocked: BlocklistEntry[]
  } {
    if (!this.db) {
      return { asn: null, ips: [], prefixes: [], blocked: [] }
    }

    try {
      const asnInfo = this.db.prepare('SELECT * FROM asn_map WHERE asn = ?').get(asn) as ASNMapping | undefined
      const ips = this.db.prepare('SELECT * FROM ip_map WHERE asn = ?').all(asn) as IPMapping[]
      const prefixes = this.db.prepare('SELECT * FROM prefix_map WHERE asn = ?').all(asn) as PrefixMapping[]
      const blocked = this.db.prepare('SELECT * FROM blocklist WHERE asn = ?').all(asn) as BlocklistEntry[]

      return {
        asn: asnInfo || null,
        ips,
        prefixes,
        blocked
      }
    } catch (error) {
      console.error('Error fetching ASN details:', error)
      return { asn: null, ips: [], prefixes: [], blocked: [] }
    }
  }

  private getEmptyStats(): DMBTStats {
    return {
      totalDomains: 0,
      totalIPs: 0,
      totalASNs: 0,
      totalPrefixes: 0,
      blockedPrefixes: 0,
      recentIPMappings: [],
      topASNs: [],
      recentBlocks: [],
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
let dmbtService: DMBTService | null = null

export function getDMBTService(): DMBTService {
  if (!dmbtService) {
    dmbtService = new DMBTService()
  }
  return dmbtService
}

export default DMBTService
