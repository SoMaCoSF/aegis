// ==============================================================================
// file_id: SOM-SCR-0016-v1.0.0
// name: analyze-history.ts
// description: Analyze Firefox browsing history for meaningful AEGIS enhancements
// project_id: AEGIS
// category: script
// tags: [browser, history, analysis, insights]
// created: 2025-12-08
// modified: 2025-12-08
// version: 1.0.0
// agent_id: AGENT-PRIME-001
// execution: npx tsx src/analyze-history.ts <history-json>
// ==============================================================================

import { readFileSync } from 'fs'
import { createLogger, LogLevel } from '@aegis/core'
import { join } from 'path'

const logger = createLogger('HistoryAnalyzer', {
  logDir: join(process.cwd(), '..', '..', 'logs'),
  level: LogLevel.INFO,
})

interface HistoryEntry {
  id: string
  url: string
  title: string | null
  lastVisitTime: number
  visitCount: number
}

interface DomainStats {
  domain: string
  visits: number
  uniquePages: number
  lastVisit: Date
  category: string
  examples: string[]
}

interface AnalysisResult {
  totalEntries: number
  uniqueDomains: number
  dateRange: { start: Date; end: Date }
  topDomains: DomainStats[]
  categoryBreakdown: Record<string, number>
  suggestedFeatures: string[]
  discoveredServices: string[]
  potentialAccounts: string[]
}

// Category detection
function inferCategory(domain: string, title: string | null): string {
  const lower = (domain + ' ' + (title || '')).toLowerCase()

  const categories: Record<string, string[]> = {
    'Development': ['github', 'gitlab', 'stackoverflow', 'npm', 'vercel', 'netlify', 'docker', 'localhost', 'code', 'dev'],
    'AI/ML': ['claude', 'openai', 'chatgpt', 'anthropic', 'huggingface', 'colab', 'jupyter'],
    'Social': ['twitter', 'x.com', 'facebook', 'instagram', 'linkedin', 'reddit', 'discord', 'threads'],
    'Email': ['gmail', 'proton', 'outlook', 'yahoo', 'mail'],
    'Cloud Storage': ['drive.google', 'dropbox', 'onedrive', 'box.com', 'icloud'],
    'Finance': ['bank', 'paypal', 'venmo', 'coinbase', 'robinhood', 'alpaca', 'trading'],
    'Shopping': ['amazon', 'ebay', 'walmart', 'target', 'etsy', 'shop'],
    'Entertainment': ['youtube', 'netflix', 'hulu', 'disney', 'spotify', 'twitch'],
    'Search': ['google.com/search', 'duckduckgo', 'bing.com/search'],
    'News': ['news', 'cnn', 'bbc', 'reuters', 'nytimes'],
    'Maps': ['maps.google', 'openstreetmap'],
    'Government': ['.gov'],
    'Library': ['library', 'saclibrary'],
    'Documentation': ['docs', 'learn.microsoft', 'developer.mozilla'],
    'Security': ['pentester', 'security', 'cve', 'exploit'],
  }

  for (const [category, keywords] of Object.entries(categories)) {
    if (keywords.some(kw => lower.includes(kw))) {
      return category
    }
  }
  return 'Other'
}

// Extract domain from URL
function extractDomain(url: string): string {
  try {
    const parsed = new URL(url)
    return parsed.hostname.replace(/^www\./, '')
  } catch {
    return url.split('/')[0].replace(/^www\./, '')
  }
}

// Check if URL might indicate an account/service
function isAccountIndicator(url: string, title: string | null): boolean {
  const indicators = [
    '/login', '/signin', '/auth', '/account', '/profile',
    '/settings', '/dashboard', '/billing', '/subscription',
    'oauth', 'callback', 'device/success'
  ]
  const lower = url.toLowerCase() + ' ' + (title || '').toLowerCase()
  return indicators.some(ind => lower.includes(ind))
}

// Analyze history
async function analyzeHistory(filePath: string): Promise<AnalysisResult> {
  logger.info(`Analyzing history file: ${filePath}`)

  const content = readFileSync(filePath, 'utf-8')
  const entries: HistoryEntry[] = JSON.parse(content)

  logger.info(`Loaded ${entries.length} history entries`)

  // Domain statistics
  const domainMap = new Map<string, DomainStats>()
  const categoryCount: Record<string, number> = {}
  const discoveredServices = new Set<string>()
  const potentialAccounts = new Set<string>()

  let minTime = Infinity
  let maxTime = 0

  for (const entry of entries) {
    const domain = extractDomain(entry.url)
    const category = inferCategory(domain, entry.title)

    // Track date range
    if (entry.lastVisitTime < minTime) minTime = entry.lastVisitTime
    if (entry.lastVisitTime > maxTime) maxTime = entry.lastVisitTime

    // Category counting
    categoryCount[category] = (categoryCount[category] || 0) + 1

    // Domain stats
    if (!domainMap.has(domain)) {
      domainMap.set(domain, {
        domain,
        visits: 0,
        uniquePages: 0,
        lastVisit: new Date(entry.lastVisitTime),
        category,
        examples: []
      })
    }
    const stats = domainMap.get(domain)!
    stats.visits += entry.visitCount
    stats.uniquePages++
    if (entry.lastVisitTime > stats.lastVisit.getTime()) {
      stats.lastVisit = new Date(entry.lastVisitTime)
    }
    if (stats.examples.length < 3 && entry.title) {
      stats.examples.push(entry.title.substring(0, 60))
    }

    // Discover services
    if (isAccountIndicator(entry.url, entry.title)) {
      potentialAccounts.add(domain)
    }

    // Track significant services
    if (entry.visitCount >= 2 || isAccountIndicator(entry.url, entry.title)) {
      discoveredServices.add(domain)
    }
  }

  // Sort domains by visits
  const topDomains = Array.from(domainMap.values())
    .sort((a, b) => b.visits - a.visits)
    .slice(0, 30)

  // Generate feature suggestions based on browsing patterns
  const suggestedFeatures: string[] = []

  if (categoryCount['AI/ML'] > 5) {
    suggestedFeatures.push('AI Usage Tracker: Monitor Claude/ChatGPT usage and costs')
  }
  if (categoryCount['Development'] > 10) {
    suggestedFeatures.push('GitHub Integration: Track repos, issues, and contributions')
  }
  if (categoryCount['Social'] > 5) {
    suggestedFeatures.push('Social Media Monitor: Track accounts and privacy settings')
  }
  if (categoryCount['Finance'] > 2) {
    suggestedFeatures.push('Financial Dashboard: Aggregate trading/banking account views')
  }
  if (categoryCount['Cloud Storage'] > 2) {
    suggestedFeatures.push('Cloud Storage Auditor: Track files across Google Drive, Dropbox')
  }
  if (categoryCount['Library'] > 0) {
    suggestedFeatures.push('Library Card Manager: Track library accounts and events')
  }
  if (categoryCount['Search'] > 10) {
    suggestedFeatures.push('Search History Analyzer: Pattern recognition in search queries')
  }
  if (potentialAccounts.size > 5) {
    suggestedFeatures.push('Account Discovery: Import detected accounts from browsing')
  }
  if (categoryCount['Security'] > 0) {
    suggestedFeatures.push('Security Research Tracker: Log security tools and sites visited')
  }

  return {
    totalEntries: entries.length,
    uniqueDomains: domainMap.size,
    dateRange: {
      start: new Date(minTime),
      end: new Date(maxTime)
    },
    topDomains,
    categoryBreakdown: categoryCount,
    suggestedFeatures,
    discoveredServices: Array.from(discoveredServices).slice(0, 50),
    potentialAccounts: Array.from(potentialAccounts)
  }
}

async function main() {
  const filePath = process.argv[2] || '../../firefox_history.json'

  console.log(`
╔═══════════════════════════════════════════════════════════════════════════════╗
║                    AEGIS Browser History Analyzer                             ║
╚═══════════════════════════════════════════════════════════════════════════════╝
`)

  try {
    const result = await analyzeHistory(filePath)

    console.log(`\n📊 ANALYSIS SUMMARY`)
    console.log('═'.repeat(60))
    console.log(`Total History Entries: ${result.totalEntries}`)
    console.log(`Unique Domains: ${result.uniqueDomains}`)
    console.log(`Date Range: ${result.dateRange.start.toLocaleDateString()} - ${result.dateRange.end.toLocaleDateString()}`)

    console.log(`\n\n📈 TOP 20 DOMAINS BY VISITS`)
    console.log('═'.repeat(60))
    console.log(`${'Domain'.padEnd(35)} ${'Visits'.padStart(8)} ${'Category'.padStart(15)}`)
    console.log('-'.repeat(60))
    result.topDomains.slice(0, 20).forEach(d => {
      console.log(`${d.domain.padEnd(35)} ${String(d.visits).padStart(8)} ${d.category.padStart(15)}`)
    })

    console.log(`\n\n📂 CATEGORY BREAKDOWN`)
    console.log('═'.repeat(60))
    const sortedCategories = Object.entries(result.categoryBreakdown)
      .sort((a, b) => b[1] - a[1])
    sortedCategories.forEach(([cat, count]) => {
      const bar = '█'.repeat(Math.min(count / 5, 30))
      console.log(`${cat.padEnd(20)} ${String(count).padStart(5)} ${bar}`)
    })

    console.log(`\n\n🔍 POTENTIAL ACCOUNTS DETECTED (${result.potentialAccounts.length})`)
    console.log('═'.repeat(60))
    result.potentialAccounts.forEach(account => {
      console.log(`  • ${account}`)
    })

    console.log(`\n\n💡 SUGGESTED AEGIS FEATURES`)
    console.log('═'.repeat(60))
    if (result.suggestedFeatures.length === 0) {
      console.log('  No specific suggestions based on browsing patterns.')
    } else {
      result.suggestedFeatures.forEach((feature, i) => {
        console.log(`  ${i + 1}. ${feature}`)
      })
    }

    console.log(`\n\n🌐 TOP DISCOVERED SERVICES (for import)`)
    console.log('═'.repeat(60))
    const significantServices = result.discoveredServices
      .filter(d => !d.includes('localhost') && !d.match(/^\d+\.\d+\.\d+\.\d+$/))
      .slice(0, 30)

    console.log(significantServices.join(', '))

    logger.info('Analysis complete', {
      totalEntries: result.totalEntries,
      uniqueDomains: result.uniqueDomains,
      categories: Object.keys(result.categoryBreakdown).length,
      potentialAccounts: result.potentialAccounts.length
    })

    // Return for programmatic use
    return result

  } catch (err) {
    logger.error('Analysis failed', err)
    console.error('Error:', err)
    process.exit(1)
  }
}

main()
