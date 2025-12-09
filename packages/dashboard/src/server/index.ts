// ==============================================================================
// file_id: SOM-SCR-0010-v1.0.0
// name: index.ts
// description: AEGIS Dashboard API Server v1.0 - Full Privacy Suite Integration
// project_id: AEGIS
// category: script
// tags: [api, server, express, dashboard, dmbt, ghost-shell, privacy]
// created: 2024-01-15
// modified: 2025-12-08
// version: 1.0.0
// agent_id: AGENT-PRIME-001
// execution: npm run dev:server
// ==============================================================================

import express from 'express'
import cors from 'cors'
import { PrismaClient } from '@prisma/client'
import { createLogger, LogLevel } from '@aegis/core'
import { join } from 'path'
import { spawn, ChildProcess } from 'child_process'
import { existsSync } from 'fs'

// Import privacy suite services
import { getDMBTService, DMBTStats } from './services/dmbt'
import { getGhostShellService, GhostShellStats } from './services/ghost-shell'

// Initialize logger
const logger = createLogger('AEGISServer', {
  logDir: join(process.cwd(), '..', '..', 'logs'),
  level: process.env.LOG_LEVEL === 'debug' ? LogLevel.DEBUG : LogLevel.INFO,
})

const app = express()
const prisma = new PrismaClient()
const PORT = 4243

// Service instances
const dmbtService = getDMBTService()
const ghostShellService = getGhostShellService()

// Track running processes
const runningProcesses: Map<string, ChildProcess> = new Map()

app.use(cors())
app.use(express.json())

// Request logging middleware
app.use((req, _res, next) => {
  logger.info(`${req.method} ${req.path}`)
  next()
})

// ============================================================================
// HEALTH & STATUS
// ============================================================================

app.get('/api/health', (_req, res) => {
  res.json({
    status: 'ok',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    services: {
      dmbt: dmbtService.isConnected(),
      ghostShell: ghostShellService.isConnected()
    }
  })
})

// Full system status
app.get('/api/status', async (_req, res) => {
  const dmbtStats = dmbtService.getStats()
  const ghostStats = ghostShellService.getStats()

  // Check if processes are running
  let dmbtAgentRunning = false
  let ghostProxyRunning = false

  try {
    const dmbtCheck = await fetch('http://localhost:8088/health', { signal: AbortSignal.timeout(1000) })
    dmbtAgentRunning = dmbtCheck.ok
  } catch {}

  try {
    // Ghost_Shell proxy health check (mitmproxy doesn't have health endpoint, check port)
    ghostProxyRunning = runningProcesses.has('ghost_proxy')
  } catch {}

  res.json({
    aegis: {
      version: '1.0.0',
      uptime: process.uptime(),
      memory: process.memoryUsage()
    },
    dmbt: {
      connected: dmbtStats.isConnected,
      agentRunning: dmbtAgentRunning,
      stats: {
        domains: dmbtStats.totalDomains,
        ips: dmbtStats.totalIPs,
        asns: dmbtStats.totalASNs,
        prefixes: dmbtStats.totalPrefixes,
        blocked: dmbtStats.blockedPrefixes
      }
    },
    ghostShell: {
      connected: ghostStats.isConnected,
      proxyRunning: ghostProxyRunning,
      stats: {
        requests: ghostStats.totalRequests,
        blockedRequests: ghostStats.blockedRequests,
        cookies: ghostStats.totalCookies,
        blockedCookies: ghostStats.blockedCookies,
        fingerprints: ghostStats.fingerprintRotations
      }
    }
  })
})

// ============================================================================
// DASHBOARD STATS
// ============================================================================

app.get('/api/dashboard/stats', async (_req, res) => {
  logger.debug('Fetching dashboard stats')
  try {
    const [
      accountCount,
      subscriptionCount,
      breachCount,
      githubCount,
      privacyCount,
      subscriptions,
      accountsByCategory
    ] = await Promise.all([
      prisma.account.count(),
      prisma.subscription.count({ where: { status: 'active' } }),
      prisma.breachExposure.count(),
      prisma.gitHubIntegration.count(),
      prisma.privacyExposure.count(),
      prisma.subscription.findMany({ where: { status: 'active' } }),
      prisma.account.groupBy({
        by: ['category'],
        _count: { category: true }
      })
    ])

    // Get DMBT and Ghost_Shell stats
    const dmbtStats = dmbtService.getStats()
    const ghostStats = ghostShellService.getStats()

    const monthlySpend = subscriptions.reduce((sum, s) => {
      if (s.billingCycle === 'yearly') return sum + (s.cost / 12)
      return sum + s.cost
    }, 0)

    const categoryBreakdown = accountsByCategory.map(c => ({
      name: c.category,
      count: c._count.category
    }))

    const subscriptionsByCategory: { name: string; value: number }[] = []
    const categoryMap: Record<string, number> = {}

    for (const sub of subscriptions) {
      const cat = inferCategory(sub.name)
      categoryMap[cat] = (categoryMap[cat] || 0) + sub.cost
    }

    for (const [name, value] of Object.entries(categoryMap)) {
      subscriptionsByCategory.push({ name, value })
    }

    res.json({
      accounts: accountCount,
      subscriptions: subscriptionCount,
      monthlySpend,
      yearlySpend: monthlySpend * 12,
      breaches: breachCount,
      githubIntegrations: githubCount,
      privacyExposures: privacyCount,
      categoryBreakdown,
      subscriptionsByCategory,
      recentActivity: await getRecentActivity(),
      // Privacy Suite stats
      networkProtection: {
        asnsDiscovered: dmbtStats.totalASNs,
        prefixesBlocked: dmbtStats.blockedPrefixes,
        connected: dmbtStats.isConnected
      },
      proxyProtection: {
        requestsBlocked: ghostStats.blockedRequests,
        cookiesBlocked: ghostStats.blockedCookies,
        fingerprintRotations: ghostStats.fingerprintRotations,
        connected: ghostStats.isConnected
      }
    })
  } catch (error) {
    logger.error('Dashboard stats error', error)
    res.status(500).json({ error: 'Failed to fetch dashboard stats' })
  }
})

// ============================================================================
// DMBT NETWORK PROTECTION ENDPOINTS
// ============================================================================

app.get('/api/dmbt/stats', (_req, res) => {
  const stats = dmbtService.getStats()
  res.json(stats)
})

app.get('/api/dmbt/ips', (req, res) => {
  const limit = parseInt(req.query.limit as string) || 100
  const domain = req.query.domain as string | undefined
  const ips = dmbtService.getIPMappings(limit, domain)
  res.json(ips)
})

app.get('/api/dmbt/asns', (req, res) => {
  const limit = parseInt(req.query.limit as string) || 50
  const asns = dmbtService.getASNs(limit)
  res.json(asns)
})

app.get('/api/dmbt/asns/:asn', (req, res) => {
  const details = dmbtService.getASNDetails(req.params.asn)
  res.json(details)
})

app.get('/api/dmbt/prefixes', (req, res) => {
  const limit = parseInt(req.query.limit as string) || 100
  const asn = req.query.asn as string | undefined
  const prefixes = dmbtService.getPrefixes(asn, limit)
  res.json(prefixes)
})

app.get('/api/dmbt/blocklist', (_req, res) => {
  const blocklist = dmbtService.getBlocklist()
  res.json(blocklist)
})

// Start DMBT collector
app.post('/api/dmbt/collector/start', async (_req, res) => {
  const collectorPath = join(process.cwd(), '..', '..', 'DMBT', 'collector', 'collector.py')

  if (!existsSync(collectorPath)) {
    return res.status(404).json({ error: 'DMBT collector not found' })
  }

  if (runningProcesses.has('dmbt_collector')) {
    return res.status(400).json({ error: 'Collector already running' })
  }

  try {
    const proc = spawn('python', [collectorPath], {
      cwd: join(process.cwd(), '..', '..', 'DMBT'),
      stdio: 'pipe'
    })

    runningProcesses.set('dmbt_collector', proc)

    proc.on('close', () => {
      runningProcesses.delete('dmbt_collector')
    })

    res.json({ status: 'started', pid: proc.pid })
  } catch (error) {
    res.status(500).json({ error: 'Failed to start collector' })
  }
})

// ============================================================================
// GHOST_SHELL PROXY ENDPOINTS
// ============================================================================

app.get('/api/ghost/stats', (_req, res) => {
  const stats = ghostShellService.getStats()
  res.json(stats)
})

app.get('/api/ghost/domains', (req, res) => {
  const limit = parseInt(req.query.limit as string) || 100
  const blockedOnly = req.query.blocked === 'true'
  const domains = ghostShellService.getTrackingDomains(limit, blockedOnly)
  res.json(domains)
})

app.get('/api/ghost/ips', (req, res) => {
  const limit = parseInt(req.query.limit as string) || 100
  const ips = ghostShellService.getTrackingIPs(limit)
  res.json(ips)
})

app.get('/api/ghost/cookies', (req, res) => {
  const limit = parseInt(req.query.limit as string) || 100
  const domain = req.query.domain as string | undefined
  const cookies = ghostShellService.getCookieTraffic(limit, domain)
  res.json(cookies)
})

app.get('/api/ghost/fingerprints', (req, res) => {
  const limit = parseInt(req.query.limit as string) || 50
  const fingerprints = ghostShellService.getFingerprints(limit)
  res.json(fingerprints)
})

app.get('/api/ghost/requests', (req, res) => {
  const limit = parseInt(req.query.limit as string) || 100
  const blockedOnly = req.query.blocked === 'true'
  const requests = ghostShellService.getRequestLog(limit, blockedOnly)
  res.json(requests)
})

app.get('/api/ghost/whitelist', (_req, res) => {
  const whitelist = ghostShellService.getWhitelist()
  res.json(whitelist)
})

// Start Ghost_Shell proxy
app.post('/api/ghost/proxy/start', async (_req, res) => {
  const launcherPath = join(process.cwd(), '..', '..', 'Ghost_Shell', 'ghost_shell', 'launcher.py')

  if (!existsSync(launcherPath)) {
    return res.status(404).json({ error: 'Ghost_Shell launcher not found' })
  }

  if (runningProcesses.has('ghost_proxy')) {
    return res.status(400).json({ error: 'Proxy already running' })
  }

  try {
    const proc = spawn('python', [launcherPath], {
      cwd: join(process.cwd(), '..', '..', 'Ghost_Shell'),
      stdio: 'pipe'
    })

    runningProcesses.set('ghost_proxy', proc)

    proc.on('close', () => {
      runningProcesses.delete('ghost_proxy')
    })

    res.json({ status: 'started', pid: proc.pid })
  } catch (error) {
    res.status(500).json({ error: 'Failed to start proxy' })
  }
})

// ============================================================================
// COMBINED NETWORK STATS (Legacy compatibility)
// ============================================================================

app.get('/api/network/stats', async (_req, res) => {
  const dmbtStats = dmbtService.getStats()
  const ghostStats = ghostShellService.getStats()

  // Determine protection status
  let connectionStatus: 'protected' | 'partial' | 'unprotected' = 'unprotected'
  if (dmbtStats.isConnected && ghostStats.isConnected) {
    connectionStatus = 'protected'
  } else if (dmbtStats.isConnected || ghostStats.isConnected) {
    connectionStatus = 'partial'
  }

  res.json({
    totalASNs: dmbtStats.totalASNs,
    blockedASNs: dmbtStats.topASNs.filter(a => a.blocked).length,
    totalPrefixes: dmbtStats.totalPrefixes,
    blockedPrefixes: dmbtStats.blockedPrefixes,
    connectionStatus,
    topASNs: dmbtStats.topASNs.map(a => ({
      asn: a.asn,
      orgName: a.org_name,
      prefixCount: a.prefix_count,
      blocked: a.blocked,
      category: 'Network'
    })),
    recentBlocks: dmbtStats.recentBlocks.map(b => ({
      prefix: b.prefix,
      asn: b.asn,
      reason: b.reason,
      active: true,
      addedAt: b.added_at
    })),
    proxy: {
      totalRequests: ghostStats.totalRequests,
      blockedRequests: ghostStats.blockedRequests,
      blockedCookies: ghostStats.blockedCookies,
      fingerprintRotations: ghostStats.fingerprintRotations
    }
  })
})

// ============================================================================
// ACCOUNTS
// ============================================================================

app.get('/api/accounts', async (_req, res) => {
  try {
    const accounts = await prisma.account.findMany({
      orderBy: { updatedAt: 'desc' },
      take: 100
    })
    res.json(accounts)
  } catch (error) {
    console.error('Accounts error:', error)
    res.status(500).json({ error: 'Failed to fetch accounts' })
  }
})

// ============================================================================
// SUBSCRIPTIONS
// ============================================================================

app.get('/api/subscriptions', async (_req, res) => {
  try {
    const subscriptions = await prisma.subscription.findMany({
      orderBy: { nextBillingDate: 'asc' }
    })
    res.json(subscriptions)
  } catch (error) {
    console.error('Subscriptions error:', error)
    res.status(500).json({ error: 'Failed to fetch subscriptions' })
  }
})

// ============================================================================
// GITHUB
// ============================================================================

app.get('/api/github/integrations', async (_req, res) => {
  try {
    const integrations = await prisma.gitHubIntegration.findMany({
      orderBy: { createdAt: 'desc' }
    })
    res.json(integrations)
  } catch (error) {
    console.error('GitHub integrations error:', error)
    res.status(500).json({ error: 'Failed to fetch GitHub integrations' })
  }
})

app.post('/api/github/scan', async (_req, res) => {
  try {
    res.json({ status: 'scan_started' })
  } catch (error) {
    console.error('GitHub scan error:', error)
    res.status(500).json({ error: 'Failed to start GitHub scan' })
  }
})

// ============================================================================
// PRIVACY
// ============================================================================

app.get('/api/privacy/exposures', async (_req, res) => {
  try {
    const exposures = await prisma.privacyExposure.findMany({
      orderBy: { createdAt: 'desc' }
    })
    res.json(exposures)
  } catch (error) {
    console.error('Privacy exposures error:', error)
    res.status(500).json({ error: 'Failed to fetch privacy exposures' })
  }
})

// ============================================================================
// SYNC
// ============================================================================

app.post('/api/sync', async (_req, res) => {
  try {
    const syncLog = await prisma.syncLog.create({
      data: {
        source: 'all',
        status: 'started',
        startedAt: new Date()
      }
    })

    await prisma.syncLog.update({
      where: { id: syncLog.id },
      data: {
        status: 'completed',
        endedAt: new Date()
      }
    })

    res.json({ status: 'sync_completed', id: syncLog.id })
  } catch (error) {
    console.error('Sync error:', error)
    res.status(500).json({ error: 'Failed to sync' })
  }
})

// ============================================================================
// CLAUDE CODE / AGENT SDK INTEGRATION
// ============================================================================

app.get('/api/claude/status', (_req, res) => {
  const claudeSession = process.env.CLAUDE_CODE_SESSION || null
  const isConnected = !!claudeSession
  logger.info(`Claude status check: ${isConnected ? 'connected' : 'offline'}`)
  res.json({
    connected: isConnected,
    mode: isConnected ? 'live' : 'offline',
    sessionId: claudeSession,
    agentSdkAvailable: true,
    capabilities: [
      'privacy_audit',
      'account_discovery',
      'breach_check',
      'subscription_analysis',
      'code_modification'
    ]
  })
})

app.post('/api/claude/chat', async (req, res) => {
  const { message } = req.body
  logger.info(`Claude chat message received: "${message.substring(0, 50)}..."`)

  // Enhanced context-aware responses
  const dmbtStats = dmbtService.getStats()
  const ghostStats = ghostShellService.getStats()

  const systemContext = `
AEGIS Privacy Suite v1.0 Status:
- DMBT Connected: ${dmbtStats.isConnected}
- Ghost_Shell Connected: ${ghostStats.isConnected}
- ASNs Discovered: ${dmbtStats.totalASNs}
- Prefixes Blocked: ${dmbtStats.blockedPrefixes}
- Cookies Blocked: ${ghostStats.blockedCookies}
- Fingerprint Rotations: ${ghostStats.fingerprintRotations}
`

  const response = {
    response: `${systemContext}\n\nReceived: "${message}"\n\nTo enable full Claude Agent SDK integration, the AEGIS assistant can:\n\n- Run privacy audits on your accounts\n- Discover new accounts from browsing history\n- Check for data breaches\n- Analyze subscription spending\n- Control DMBT and Ghost_Shell services\n\nRun \`claude\` in your terminal with the AEGIS project to enable live modifications.`,
    timestamp: new Date().toISOString(),
    mode: 'offline',
    context: {
      dmbt: dmbtStats.isConnected,
      ghostShell: ghostStats.isConnected
    }
  }

  logger.debug('Claude chat response sent')
  res.json(response)
})

// Agent task execution endpoint
app.post('/api/agent/task', async (req, res) => {
  const { task, params } = req.body
  logger.info(`Agent task requested: ${task}`)

  // Task routing
  switch (task) {
    case 'privacy_audit':
      // Run privacy audit
      const dmbtStats = dmbtService.getStats()
      const ghostStats = ghostShellService.getStats()
      res.json({
        status: 'completed',
        result: {
          networkProtection: dmbtStats,
          proxyProtection: ghostStats,
          recommendations: generatePrivacyRecommendations(dmbtStats, ghostStats)
        }
      })
      break

    case 'start_dmbt':
      // Start DMBT collector
      res.json({ status: 'pending', message: 'Use POST /api/dmbt/collector/start' })
      break

    case 'start_proxy':
      // Start Ghost_Shell proxy
      res.json({ status: 'pending', message: 'Use POST /api/ghost/proxy/start' })
      break

    default:
      res.status(400).json({ error: `Unknown task: ${task}` })
  }
})

// ============================================================================
// KNOWLEDGE GRAPH
// ============================================================================

app.get('/api/graph/nodes', async (_req, res) => {
  try {
    const nodes = await prisma.knowledgeNode.findMany()
    const links = await prisma.knowledgeLink.findMany()
    res.json({ nodes, links })
  } catch (error) {
    logger.error('Knowledge graph error', error)
    res.status(500).json({ error: 'Failed to fetch knowledge graph' })
  }
})

app.post('/api/graph/nodes', async (req, res) => {
  try {
    const node = await prisma.knowledgeNode.create({ data: req.body })
    res.json(node)
  } catch (error) {
    logger.error('Create node error', error)
    res.status(500).json({ error: 'Failed to create node' })
  }
})

app.post('/api/graph/links', async (req, res) => {
  try {
    const link = await prisma.knowledgeLink.create({ data: req.body })
    res.json(link)
  } catch (error) {
    logger.error('Create link error', error)
    res.status(500).json({ error: 'Failed to create link' })
  }
})

// ============================================================================
// AI USAGE TRACKING
// ============================================================================

app.get('/api/ai/usage', async (_req, res) => {
  try {
    const usage = await prisma.aIUsage.findMany({
      orderBy: { timestamp: 'desc' },
      take: 100
    })
    res.json(usage)
  } catch (error) {
    logger.error('AI usage error', error)
    res.status(500).json({ error: 'Failed to fetch AI usage' })
  }
})

app.post('/api/ai/usage', async (req, res) => {
  try {
    const record = await prisma.aIUsage.create({ data: req.body })
    res.json(record)
  } catch (error) {
    logger.error('AI usage record error', error)
    res.status(500).json({ error: 'Failed to record AI usage' })
  }
})

// ============================================================================
// DISCOVERY
// ============================================================================

app.get('/api/discovery/accounts', async (_req, res) => {
  try {
    const accounts = await prisma.browsingHistory.findMany({
      where: { isAccount: true },
      orderBy: { visitCount: 'desc' }
    })
    const stats = {
      total: accounts.length,
      accounts: accounts.filter(a => a.isAccount).length,
      imported: accounts.filter(a => a.imported).length,
      categories: accounts.reduce((acc, a) => {
        acc[a.category] = (acc[a.category] || 0) + 1
        return acc
      }, {} as Record<string, number>)
    }
    res.json({ accounts, stats })
  } catch (error) {
    logger.error('Discovery error', error)
    res.status(500).json({ error: 'Failed to fetch discovered accounts' })
  }
})

app.post('/api/discovery/import', async (req, res) => {
  try {
    const { accountId } = req.body
    await prisma.browsingHistory.update({
      where: { id: accountId },
      data: { imported: true }
    })
    res.json({ success: true })
  } catch (error) {
    logger.error('Discovery import error', error)
    res.status(500).json({ error: 'Failed to import account' })
  }
})

// ============================================================================
// SOCIAL
// ============================================================================

app.get('/api/social/accounts', async (_req, res) => {
  try {
    const accounts = await prisma.socialAccount.findMany({
      orderBy: { followers: 'desc' }
    })
    res.json(accounts)
  } catch (error) {
    logger.error('Social accounts error', error)
    res.status(500).json({ error: 'Failed to fetch social accounts' })
  }
})

app.post('/api/social/accounts', async (req, res) => {
  try {
    const account = await prisma.socialAccount.create({ data: req.body })
    res.json(account)
  } catch (error) {
    logger.error('Create social account error', error)
    res.status(500).json({ error: 'Failed to create social account' })
  }
})

// ============================================================================
// FINANCE
// ============================================================================

app.get('/api/finance/accounts', async (_req, res) => {
  try {
    const accounts = await prisma.financialAccount.findMany({
      orderBy: { lastSynced: 'desc' }
    })
    res.json(accounts)
  } catch (error) {
    logger.error('Finance accounts error', error)
    res.status(500).json({ error: 'Failed to fetch financial accounts' })
  }
})

app.get('/api/finance/portfolio', async (_req, res) => {
  res.status(204).send()
})

// ============================================================================
// CLOUD STORAGE
// ============================================================================

app.get('/api/cloud/services', async (_req, res) => {
  try {
    const services = await prisma.cloudStorage.findMany({
      orderBy: { usedSpace: 'desc' }
    })
    res.json(services)
  } catch (error) {
    logger.error('Cloud services error', error)
    res.status(500).json({ error: 'Failed to fetch cloud services' })
  }
})

app.post('/api/cloud/services', async (req, res) => {
  try {
    const service = await prisma.cloudStorage.create({ data: req.body })
    res.json(service)
  } catch (error) {
    logger.error('Create cloud service error', error)
    res.status(500).json({ error: 'Failed to create cloud service' })
  }
})

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function inferCategory(name: string): string {
  const lower = name.toLowerCase()
  if (['netflix', 'hulu', 'disney', 'hbo', 'spotify', 'youtube'].some(s => lower.includes(s))) {
    return 'Streaming'
  }
  if (['github', 'aws', 'azure', 'google cloud', 'vercel', 'netlify'].some(s => lower.includes(s))) {
    return 'Development'
  }
  if (['adobe', 'figma', 'notion', 'slack', 'zoom'].some(s => lower.includes(s))) {
    return 'Productivity'
  }
  if (['xbox', 'playstation', 'nintendo', 'steam'].some(s => lower.includes(s))) {
    return 'Gaming'
  }
  return 'Other'
}

async function getRecentActivity() {
  const logs = await prisma.syncLog.findMany({
    orderBy: { startedAt: 'desc' },
    take: 5
  })

  return logs.map(log => ({
    action: log.status === 'completed' ? 'Synced' : 'Started sync',
    target: log.source,
    time: formatTimeAgo(log.startedAt)
  }))
}

function formatTimeAgo(date: Date): string {
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000)
  if (seconds < 60) return 'just now'
  if (seconds < 3600) return `${Math.floor(seconds / 60)} minutes ago`
  if (seconds < 86400) return `${Math.floor(seconds / 3600)} hours ago`
  return `${Math.floor(seconds / 86400)} days ago`
}

function generatePrivacyRecommendations(dmbt: DMBTStats, ghost: GhostShellStats): string[] {
  const recommendations: string[] = []

  if (!dmbt.isConnected) {
    recommendations.push('Enable DMBT for network-layer protection against tracking infrastructure')
  }

  if (!ghost.isConnected) {
    recommendations.push('Enable Ghost_Shell proxy for application-layer cookie and fingerprint protection')
  }

  if (dmbt.blockedPrefixes === 0 && dmbt.totalPrefixes > 0) {
    recommendations.push('Consider blocking tracking ASNs like Meta (AS32934) to reduce ad network traffic')
  }

  if (ghost.fingerprintRotations === 0) {
    recommendations.push('Enable fingerprint rotation to prevent browser tracking')
  }

  if (recommendations.length === 0) {
    recommendations.push('Your privacy suite is well configured!')
  }

  return recommendations
}

// ============================================================================
// START SERVER
// ============================================================================

app.listen(PORT, () => {
  logger.info('='.repeat(60))
  logger.info(`AEGIS Privacy Suite v1.0 API Server`)
  logger.info(`Running on http://localhost:${PORT}`)
  logger.info('='.repeat(60))
  logger.info(`DMBT Database: ${dmbtService.isConnected() ? 'Connected' : 'Not Found'}`)
  logger.info(`Ghost_Shell Database: ${ghostShellService.isConnected() ? 'Connected' : 'Not Found'}`)
  logger.info('='.repeat(60))
  console.log(`🛡️  AEGIS Privacy Suite v1.0 running on http://localhost:${PORT}`)
})
