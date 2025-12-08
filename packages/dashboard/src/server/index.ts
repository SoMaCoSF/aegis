// ==============================================================================
// file_id: SOM-SCR-0010-v0.1.0
// name: index.ts
// description: AEGIS Dashboard API Server - Express backend on port 4243
// project_id: AEGIS
// category: script
// tags: [api, server, express, dashboard]
// created: 2024-01-15
// modified: 2024-01-15
// version: 0.1.0
// agent_id: AGENT-PRIME-001
// execution: npm run dev:server
// ==============================================================================

import express from 'express'
import cors from 'cors'
import { PrismaClient } from '@prisma/client'

const app = express()
const prisma = new PrismaClient()
const PORT = 4243

app.use(cors())
app.use(express.json())

// Health check
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() })
})

// Dashboard stats
app.get('/api/dashboard/stats', async (_req, res) => {
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
    console.error('Dashboard stats error:', error)
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

// Start server
app.listen(PORT, () => {
  console.log(`🛡️  AEGIS API Server running on http://localhost:${PORT}`)
})
