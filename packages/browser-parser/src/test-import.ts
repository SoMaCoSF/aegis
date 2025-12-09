// ==============================================================================
// file_id: SOM-TST-0001-v1.0.0
// name: test-import.ts
// description: Non-interactive test script for browser CSV import
// project_id: AEGIS
// category: test
// tags: [test, import, browser]
// created: 2025-12-08
// modified: 2025-12-08
// version: 1.0.0
// agent_id: AGENT-PRIME-001
// execution: npx tsx src/test-import.ts <csv-path> <browser-type>
// ==============================================================================

import { existsSync, readFileSync } from 'fs'
import { join } from 'path'
import { PrismaClient } from '@prisma/client'
import { createLogger, LogLevel } from '@aegis/core'

// Initialize logger with debug level for testing
const logger = createLogger('TestImport', {
  logDir: join(process.cwd(), '..', '..', 'logs'),
  level: LogLevel.DEBUG,
})

const prisma = new PrismaClient()

// CSV column mappings for different browsers
const CSV_MAPPINGS: Record<string, Record<string, string>> = {
  chrome: { name: 'name', url: 'url', username: 'username', password: 'password' },
  edge: { name: 'name', url: 'url', username: 'username', password: 'password' },
  firefox: { name: 'hostname', url: 'url', username: 'username', password: 'password' },
  brave: { name: 'name', url: 'url', username: 'username', password: 'password' },
  bitwarden: { name: 'name', url: 'login_uri', username: 'login_username', password: 'login_password' },
  lastpass: { name: 'name', url: 'url', username: 'username', password: 'password' },
  onepassword: { name: 'Title', url: 'Url', username: 'Username', password: 'Password' },
}

interface ParsedAccount {
  domain: string
  url: string
  username: string | null
  email: string | null
  hasPassword: boolean
  passwordStrength: string
  category: string
  source: string
}

// CSV Parser
function parseCSV(content: string): Record<string, string>[] {
  const lines = content.trim().split('\n')
  if (lines.length < 2) return []

  const headers = parseCSVLine(lines[0])
  const records: Record<string, string>[] = []

  for (let i = 1; i < lines.length; i++) {
    const values = parseCSVLine(lines[i])
    const record: Record<string, string> = {}
    headers.forEach((header, index) => {
      record[header.toLowerCase().trim()] = values[index] || ''
    })
    records.push(record)
  }

  return records
}

function parseCSVLine(line: string): string[] {
  const result: string[] = []
  let current = ''
  let inQuotes = false

  for (let i = 0; i < line.length; i++) {
    const char = line[i]
    if (char === '"') {
      inQuotes = !inQuotes
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim())
      current = ''
    } else {
      current += char
    }
  }
  result.push(current.trim())

  return result
}

// Domain extraction
function extractDomain(url: string): string {
  try {
    const parsed = new URL(url.startsWith('http') ? url : `https://${url}`)
    return parsed.hostname.replace(/^www\./, '')
  } catch {
    return url.split('/')[0].replace(/^www\./, '')
  }
}

// Category inference
function inferCategory(domain: string): string {
  const categories: Record<string, string[]> = {
    'Social': ['facebook', 'twitter', 'instagram', 'linkedin', 'tiktok', 'reddit', 'discord', 'snapchat'],
    'Shopping': ['amazon', 'ebay', 'walmart', 'target', 'etsy', 'shopify', 'aliexpress'],
    'Finance': ['paypal', 'venmo', 'bank', 'chase', 'wellsfargo', 'coinbase', 'robinhood'],
    'Entertainment': ['netflix', 'hulu', 'disney', 'spotify', 'youtube', 'twitch', 'hbo'],
    'Productivity': ['google', 'microsoft', 'notion', 'slack', 'zoom', 'dropbox', 'trello'],
    'Development': ['github', 'gitlab', 'bitbucket', 'stackoverflow', 'npm', 'vercel', 'netlify'],
    'Gaming': ['steam', 'epic', 'playstation', 'xbox', 'nintendo', 'riot', 'blizzard'],
    'Email': ['gmail', 'outlook', 'yahoo', 'proton', 'icloud'],
  }

  const lowerDomain = domain.toLowerCase()
  for (const [category, keywords] of Object.entries(categories)) {
    if (keywords.some(kw => lowerDomain.includes(kw))) {
      return category
    }
  }
  return 'Other'
}

// Detect email in username field
function detectEmail(username: string | null): { username: string | null; email: string | null } {
  if (!username) return { username: null, email: null }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (emailRegex.test(username)) {
    return { username: null, email: username }
  }
  return { username, email: null }
}

// Import CSV to database
async function importCSVToDatabase(
  filePath: string,
  browserType: string,
  dryRun: boolean = false
): Promise<{ imported: number; skipped: number; errors: string[] }> {
  logger.info(`Starting CSV import`, { filePath, browserType, dryRun })

  const content = readFileSync(filePath, 'utf-8')
  const records = parseCSV(content)
  const mapping = CSV_MAPPINGS[browserType] || CSV_MAPPINGS.chrome

  logger.info(`Parsed ${records.length} records from CSV`)
  logger.debug(`Using mapping for ${browserType}`, mapping)

  let imported = 0
  let skipped = 0
  const errors: string[] = []

  for (const record of records) {
    try {
      const url = record[mapping.url] || record['url'] || ''
      const rawUsername = record[mapping.username] || record['username'] || ''

      if (!url) {
        skipped++
        logger.debug('Skipping record with no URL')
        continue
      }

      const domain = extractDomain(url)
      const { username, email } = detectEmail(rawUsername)
      const hasPassword = !!(record[mapping.password] || record['password'])

      const account: ParsedAccount = {
        domain,
        url,
        username,
        email,
        hasPassword,
        passwordStrength: hasPassword ? 'unknown' : 'none',
        category: inferCategory(domain),
        source: browserType,
      }

      logger.debug(`Processing account: ${domain}`, { username: username || email, category: account.category })

      if (dryRun) {
        console.log(`  [DRY RUN] Would import: ${domain} (${username || email || 'no user'}) [${account.category}]`)
      } else {
        // Check for existing account
        const existing = await prisma.account.findFirst({
          where: {
            domain: account.domain,
            OR: [
              { username: account.username },
              { email: account.email },
            ],
          },
        })

        if (existing) {
          logger.debug(`Updating existing account: ${domain}`, { existingId: existing.id })
          await prisma.account.update({
            where: { id: existing.id },
            data: {
              url: account.url,
              passwordStored: account.hasPassword,
              source: existing.source.includes(account.source)
                ? existing.source
                : `${existing.source},${account.source}`,
              updatedAt: new Date(),
            },
          })
          console.log(`  [UPDATE] ${domain} (${username || email || 'no user'})`)
        } else {
          logger.debug(`Creating new account: ${domain}`)
          await prisma.account.create({
            data: {
              domain: account.domain,
              url: account.url,
              username: account.username,
              email: account.email,
              passwordStored: account.hasPassword,
              passwordStrength: account.passwordStrength,
              category: account.category,
              source: account.source,
            },
          })
          console.log(`  [CREATE] ${domain} (${username || email || 'no user'}) [${account.category}]`)
        }
      }

      imported++
    } catch (err) {
      const errorMsg = `Row error: ${err}`
      logger.error(errorMsg)
      errors.push(errorMsg)
    }
  }

  logger.info(`Import complete`, { imported, skipped, errors: errors.length })
  return { imported, skipped, errors }
}

async function showStats() {
  console.log('\n📊 Database Statistics:')
  console.log('=' .repeat(50))

  const accountCount = await prisma.account.count()
  const bySource = await prisma.account.groupBy({
    by: ['source'],
    _count: { source: true },
  })
  const byCategory = await prisma.account.groupBy({
    by: ['category'],
    _count: { category: true },
  })

  console.log(`Total Accounts: ${accountCount}`)

  console.log('\nBy Source:')
  bySource.forEach(s => console.log(`  ${s.source}: ${s._count.source}`))

  console.log('\nBy Category:')
  byCategory.forEach(c => console.log(`  ${c.category}: ${c._count.category}`))
}

async function main() {
  const args = process.argv.slice(2)

  if (args.length < 2) {
    console.log(`
╔═══════════════════════════════════════════════════════════════════════════════╗
║                    AEGIS Browser Import Test Script                           ║
╠═══════════════════════════════════════════════════════════════════════════════╣
║  Usage: npx tsx src/test-import.ts <csv-path> <browser-type> [--dry-run]     ║
║                                                                               ║
║  Browser types: chrome, edge, firefox, brave, bitwarden, lastpass            ║
║                                                                               ║
║  Examples:                                                                    ║
║    npx tsx src/test-import.ts ./passwords.csv firefox                        ║
║    npx tsx src/test-import.ts ./passwords.csv firefox --dry-run              ║
╚═══════════════════════════════════════════════════════════════════════════════╝
`)
    process.exit(1)
  }

  const csvPath = args[0]
  const browserType = args[1].toLowerCase()
  const dryRun = args.includes('--dry-run')

  logger.info('='.repeat(60))
  logger.info('AEGIS Browser Import Test Starting')
  logger.info('='.repeat(60))

  if (!existsSync(csvPath)) {
    logger.error(`File not found: ${csvPath}`)
    console.error(`❌ File not found: ${csvPath}`)
    process.exit(1)
  }

  if (!CSV_MAPPINGS[browserType]) {
    logger.warn(`Unknown browser type: ${browserType}, using chrome mapping`)
  }

  console.log('\n📥 Starting Import...')
  console.log(`   File: ${csvPath}`)
  console.log(`   Browser Type: ${browserType}`)
  console.log(`   Mode: ${dryRun ? 'DRY RUN' : 'LIVE'}\n`)

  try {
    const result = await importCSVToDatabase(csvPath, browserType, dryRun)

    console.log('\n✅ Import Complete!')
    console.log(`   Imported: ${result.imported}`)
    console.log(`   Skipped: ${result.skipped}`)
    if (result.errors.length > 0) {
      console.log(`   Errors: ${result.errors.length}`)
      result.errors.forEach(e => console.log(`     - ${e}`))
    }

    if (!dryRun) {
      await showStats()
    }
  } catch (err) {
    logger.error('Import failed', err)
    console.error('❌ Import failed:', err)
  } finally {
    await prisma.$disconnect()
    logger.info('Test import finished')
  }
}

main()
