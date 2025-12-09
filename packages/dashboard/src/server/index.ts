// ==============================================================================
// file_id: SOM-SCR-0010-v0.2.0
// name: index.ts
// description: AEGIS Dashboard API Server - Express backend on port 4243
// project_id: AEGIS
// category: script
// tags: [api, server, express, dashboard, logging]
// created: 2024-01-15
// modified: 2025-12-08
// version: 0.2.0
// agent_id: AGENT-PRIME-001
// execution: npm run dev:server
// ==============================================================================

import express from 'express'
import cors from 'cors'
import { PrismaClient } from '@prisma/client'
import { createLogger, LogLevel } from '@aegis/core'
import { join } from 'path'

// Initialize logger
const logger = createLogger('APIServer', {
  logDir: join(process.cwd(), '..', '..', 'logs'),
  level: process.env.LOG_LEVEL === 'debug' ? LogLevel.DEBUG : LogLevel.INFO,
})

const app = express()
const prisma = new PrismaClient()
const PORT = 4243

app.use(cors())
app.use(express.json())

// Request logging middleware
app.use((req, _res, next) => {
  logger.info(`${req.method} ${req.path}`)
  next()
})

// Health check
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() })
})

// Dashboard stats
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

    const monthlySpend = subscriptions.reduce((sum, s) => {
      if (s.billingCycle === 'yearly') return sum + (s.cost / 12)
      return sum + s.cost
    }, 0)

    const categoryBreakdown = accountsByCategory.map(c => ({
      name: c.category,
      count: c._count.category
    }))

    // Get subscription breakdown by inferring category from name
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
      recentActivity: await getRecentActivity()
    })
  } catch (error) {
    logger.error('Dashboard stats error', error)
    res.status(500).json({ error: 'Failed to fetch dashboard stats' })
  }
})

// Accounts
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

// Subscriptions
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

// GitHub integrations
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

// Trigger GitHub scan
app.post('/api/github/scan', async (_req, res) => {
  try {
    // This would trigger the github-auditor CLI
    // For now, just return success
    res.json({ status: 'scan_started' })
  } catch (error) {
    console.error('GitHub scan error:', error)
    res.status(500).json({ error: 'Failed to start GitHub scan' })
  }
})

// Privacy exposures
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

// Sync all data sources
app.post('/api/sync', async (_req, res) => {
  try {
    const syncLog = await prisma.syncLog.create({
      data: {
        source: 'all',
        status: 'started',
        startedAt: new Date()
      }
    })

    // Would trigger various scanners here

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

// Helper functions
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

// Claude Code integration
app.get('/api/claude/status', (_req, res) => {
  // Check if Claude Code is available by checking environment
  const claudeSession = process.env.CLAUDE_CODE_SESSION || null
  const isConnected = !!claudeSession
  logger.info(`Claude status check: ${isConnected ? 'connected' : 'offline'}`)
  res.json({
    connected: isConnected,
    mode: isConnected ? 'live' : 'offline',
    sessionId: claudeSession
  })
})

app.post('/api/claude/chat', async (req, res) => {
  const { message } = req.body
  logger.info(`Claude chat message received: "${message.substring(0, 50)}..."`)

  // In production, this would forward to Claude Code via MCP or socket
  // For now, return acknowledgment with context
  const response = {
    response: `Received: "${message}". Claude Code integration requires running \`claude\` in your terminal with the AEGIS project open. Once connected, I can:\n\n- Modify AEGIS source code\n- Add new features\n- Run tests and builds\n- Query the database\n\nTo connect, run: \`cd D:\\somacosf\\aegis && claude\``,
    timestamp: new Date().toISOString(),
    mode: 'offline'
  }

  logger.debug('Claude chat response sent')
  res.json(response)
})

// Network/DMBT integration
app.get('/api/network/stats', async (_req, res) => {
  // This would query DMBT's database at d:\somacosf\outputs\dmbt\data\dmbt.sqlite
  // For now, return mock stats
  res.json({
    totalASNs: 156,
    blockedASNs: 23,
    totalPrefixes: 4521,
    blockedPrefixes: 892,
    connectionStatus: 'partial'
  })
})

// ============================================================================
// NEW FEATURE API ENDPOINTS
// ============================================================================

// Knowledge Graph
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
    const node = await prisma.knowledgeNode.create({
      data: req.body
    })
    res.json(node)
  } catch (error) {
    logger.error('Create node error', error)
    res.status(500).json({ error: 'Failed to create node' })
  }
})

app.post('/api/graph/links', async (req, res) => {
  try {
    const link = await prisma.knowledgeLink.create({
      data: req.body
    })
    res.json(link)
  } catch (error) {
    logger.error('Create link error', error)
    res.status(500).json({ error: 'Failed to create link' })
  }
})

// AI Usage Tracking
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
    const record = await prisma.aIUsage.create({
      data: req.body
    })
    res.json(record)
  } catch (error) {
    logger.error('AI usage record error', error)
    res.status(500).json({ error: 'Failed to record AI usage' })
  }
})

// Discovery - Account discovery from browsing history
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

// Social Media Accounts
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
    const account = await prisma.socialAccount.create({
      data: req.body
    })
    res.json(account)
  } catch (error) {
    logger.error('Create social account error', error)
    res.status(500).json({ error: 'Failed to create social account' })
  }
})

// Financial Accounts
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
  // Portfolio data would come from Alpaca API integration
  // For now, return empty data that triggers mock fallback
  res.status(204).send()
})

// Cloud Storage
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
    const service = await prisma.cloudStorage.create({
      data: req.body
    })
    res.json(service)
  } catch (error) {
    logger.error('Create cloud service error', error)
    res.status(500).json({ error: 'Failed to create cloud service' })
  }
})

// Start server
app.listen(PORT, () => {
  logger.info('='.repeat(60))
  logger.info(`AEGIS API Server running on http://localhost:${PORT}`)
  logger.info('='.repeat(60))
  console.log(`🛡️  AEGIS API Server running on http://localhost:${PORT}`)
})
