// ==============================================================================
// file_id: SOM-SCR-0011-v0.1.0
// name: importer.ts
// description: Browser password CSV importer with TUI for finding browser data
// project_id: AEGIS
// category: script
// tags: [browser, csv, importer, passwords, tui]
// created: 2024-01-15
// modified: 2024-01-15
// version: 0.1.0
// agent_id: AGENT-PRIME-001
// execution: npx tsx src/importer.ts
// ==============================================================================

import { createInterface } from 'readline'
import { existsSync, readdirSync, readFileSync, writeFileSync, mkdirSync } from 'fs'
import { join, basename } from 'path'
import { createHash, createCipheriv, createDecipheriv, randomBytes, scryptSync } from 'crypto'
import { homedir } from 'os'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// Browser profile locations (Windows)
const BROWSER_PATHS: Record<string, string[]> = {
  chrome: [
    join(homedir(), 'AppData', 'Local', 'Google', 'Chrome', 'User Data'),
  ],
  edge: [
    join(homedir(), 'AppData', 'Local', 'Microsoft', 'Edge', 'User Data'),
  ],
  firefox: [
    join(homedir(), 'AppData', 'Roaming', 'Mozilla', 'Firefox', 'Profiles'),
  ],
  brave: [
    join(homedir(), 'AppData', 'Local', 'BraveSoftware', 'Brave-Browser', 'User Data'),
  ],
  opera: [
    join(homedir(), 'AppData', 'Roaming', 'Opera Software', 'Opera Stable'),
  ],
  vivaldi: [
    join(homedir(), 'AppData', 'Local', 'Vivaldi', 'User Data'),
  ],
}

// CSV column mappings for different browsers
const CSV_MAPPINGS: Record<string, Record<string, string>> = {
  chrome: { name: 'name', url: 'url', username: 'username', password: 'password' },
  edge: { name: 'name', url: 'url', username: 'username', password: 'password' },
  firefox: { name: 'hostname', url: 'hostname', username: 'username', password: 'password' },
  brave: { name: 'name', url: 'url', username: 'username', password: 'password' },
  bitwarden: { name: 'name', url: 'login_uri', username: 'login_username', password: 'login_password' },
  lastpass: { name: 'name', url: 'url', username: 'username', password: 'password' },
  onepassword: { name: 'Title', url: 'Url', username: 'Username', password: 'Password' },
  dashlane: { name: 'title', url: 'url', username: 'username', password: 'password' },
  keepass: { name: 'Title', url: 'URL', username: 'UserName', password: 'Password' },
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

interface BrowserLocation {
  browser: string
  path: string
  profiles: string[]
}

// TUI class for interactive browser finding
class BrowserFinderTUI {
  private rl: ReturnType<typeof createInterface>
  private foundBrowsers: BrowserLocation[] = []

  constructor() {
    this.rl = createInterface({
      input: process.stdin,
      output: process.stdout,
    })
  }

  async prompt(question: string): Promise<string> {
    return new Promise((resolve) => {
      this.rl.question(question, resolve)
    })
  }

  printHeader() {
    console.clear()
    console.log(`
╔═══════════════════════════════════════════════════════════════════════════════╗
║                                                                               ║
║     █████╗ ███████╗ ██████╗ ██╗███████╗    ██████╗ ██████╗  ██████╗ ██╗    ██╗║
║    ██╔══██╗██╔════╝██╔════╝ ██║██╔════╝    ██╔══██╗██╔══██╗██╔═══██╗██║    ██║║
║    ███████║█████╗  ██║  ███╗██║███████╗    ██████╔╝██████╔╝██║   ██║██║ █╗ ██║║
║    ██╔══██║██╔══╝  ██║   ██║██║╚════██║    ██╔══██╗██╔══██╗██║   ██║██║███╗██║║
║    ██║  ██║███████╗╚██████╔╝██║███████║    ██████╔╝██║  ██║╚██████╔╝╚███╔███╔╝║
║    ╚═╝  ╚═╝╚══════╝ ╚═════╝ ╚═╝╚══════╝    ╚═════╝ ╚═╝  ╚═╝ ╚═════╝  ╚══╝╚══╝ ║
║                                                                               ║
║                    Browser Password Importer v0.1.0                           ║
║                                                                               ║
╚═══════════════════════════════════════════════════════════════════════════════╝
`)
  }

  async scanForBrowsers(): Promise<BrowserLocation[]> {
    console.log('\n🔍 Scanning for installed browsers...\n')
    this.foundBrowsers = []

    for (const [browser, paths] of Object.entries(BROWSER_PATHS)) {
      for (const basePath of paths) {
        if (existsSync(basePath)) {
          const profiles = this.findProfiles(basePath, browser)
          if (profiles.length > 0) {
            this.foundBrowsers.push({ browser, path: basePath, profiles })
            console.log(`  ✅ ${browser.charAt(0).toUpperCase() + browser.slice(1)}`)
            console.log(`     Path: ${basePath}`)
            console.log(`     Profiles: ${profiles.join(', ')}\n`)
          }
        }
      }
    }

    if (this.foundBrowsers.length === 0) {
      console.log('  ⚠️  No browsers found in standard locations')
    }

    return this.foundBrowsers
  }

  findProfiles(basePath: string, browser: string): string[] {
    const profiles: string[] = []

    if (browser === 'firefox') {
      // Firefox uses random profile IDs
      const dirs = readdirSync(basePath, { withFileTypes: true })
      for (const dir of dirs) {
        if (dir.isDirectory() && dir.name.includes('.default')) {
          profiles.push(dir.name)
        }
      }
    } else {
      // Chromium-based browsers
      if (existsSync(join(basePath, 'Default'))) {
        profiles.push('Default')
      }
      const dirs = readdirSync(basePath, { withFileTypes: true })
      for (const dir of dirs) {
        if (dir.isDirectory() && dir.name.startsWith('Profile ')) {
          profiles.push(dir.name)
        }
      }
    }

    return profiles
  }

  async showMainMenu(): Promise<string> {
    console.log('\n┌─────────────────────────────────────┐')
    console.log('│           MAIN MENU                 │')
    console.log('├─────────────────────────────────────┤')
    console.log('│  1. Import from CSV file            │')
    console.log('│  2. Scan browser locations          │')
    console.log('│  3. Export instructions             │')
    console.log('│  4. Encrypt CSV for cloud sync      │')
    console.log('│  5. Decrypt synced CSV              │')
    console.log('│  6. View import statistics          │')
    console.log('│  7. Exit                            │')
    console.log('└─────────────────────────────────────┘')

    return await this.prompt('\n  Select option (1-7): ')
  }

  async showExportInstructions() {
    console.log(`
╔═══════════════════════════════════════════════════════════════════════════════╗
║                     HOW TO EXPORT BROWSER PASSWORDS                           ║
╠═══════════════════════════════════════════════════════════════════════════════╣
║                                                                               ║
║  🌐 CHROME / EDGE / BRAVE                                                     ║
║  ─────────────────────────────────────────────────────────────────────────── ║
║  1. Open browser settings (chrome://settings/passwords)                       ║
║  2. Click the ⋮ menu next to "Saved Passwords"                               ║
║  3. Select "Export passwords"                                                 ║
║  4. Authenticate with Windows credentials                                     ║
║  5. Save the CSV file                                                         ║
║                                                                               ║
║  🦊 FIREFOX                                                                    ║
║  ─────────────────────────────────────────────────────────────────────────── ║
║  1. Open about:logins                                                         ║
║  2. Click ⋮ menu → "Export Logins..."                                        ║
║  3. Authenticate and save CSV                                                 ║
║                                                                               ║
║  🔐 BITWARDEN                                                                  ║
║  ─────────────────────────────────────────────────────────────────────────── ║
║  1. Open vault → Tools → Export Vault                                         ║
║  2. Select .csv format                                                        ║
║  3. Enter master password                                                     ║
║                                                                               ║
║  🔑 LASTPASS                                                                   ║
║  ─────────────────────────────────────────────────────────────────────────── ║
║  1. Account Options → Advanced → Export                                       ║
║  2. Select CSV format                                                         ║
║                                                                               ║
║  ⚠️  SECURITY WARNING                                                          ║
║  ─────────────────────────────────────────────────────────────────────────── ║
║  • CSV files contain PLAINTEXT passwords - delete after import!              ║
║  • Use Option 4 to encrypt before cloud sync                                  ║
║  • Never commit CSV files to git repositories                                 ║
║                                                                               ║
╚═══════════════════════════════════════════════════════════════════════════════╝
`)
    await this.prompt('\nPress Enter to continue...')
  }

  close() {
    this.rl.close()
  }
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

// Password strength estimation (without seeing actual password)
function estimatePasswordStrength(hasPassword: boolean): string {
  // We don't store or analyze actual passwords
  // This is just a placeholder - real strength would come from the source
  return hasPassword ? 'unknown' : 'none'
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
  const content = readFileSync(filePath, 'utf-8')
  const records = parseCSV(content)
  const mapping = CSV_MAPPINGS[browserType] || CSV_MAPPINGS.chrome

  let imported = 0
  let skipped = 0
  const errors: string[] = []

  for (const record of records) {
    try {
      const url = record[mapping.url] || record['url'] || ''
      const rawUsername = record[mapping.username] || record['username'] || ''

      if (!url) {
        skipped++
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
        passwordStrength: estimatePasswordStrength(hasPassword),
        category: inferCategory(domain),
        source: browserType,
      }

      if (dryRun) {
        console.log(`  Would import: ${domain} (${username || email || 'no user'})`)
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
          // Update existing
          await prisma.account.update({
            where: { id: existing.id },
            data: {
              url: account.url,
              passwordStored: account.hasPassword,
              source: `${existing.source},${account.source}`,
              updatedAt: new Date(),
            },
          })
        } else {
          // Create new
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
        }
      }

      imported++
    } catch (err) {
      errors.push(`Row error: ${err}`)
    }
  }

  return { imported, skipped, errors }
}

// Encryption for cloud sync
const ENCRYPTION_ALGORITHM = 'aes-256-gcm'

function encryptFile(inputPath: string, outputPath: string, password: string): void {
  const content = readFileSync(inputPath)
  const salt = randomBytes(32)
  const key = scryptSync(password, salt, 32)
  const iv = randomBytes(16)

  const cipher = createCipheriv(ENCRYPTION_ALGORITHM, key, iv)
  const encrypted = Buffer.concat([cipher.update(content), cipher.final()])
  const authTag = cipher.getAuthTag()

  // Format: salt (32) + iv (16) + authTag (16) + encrypted data
  const output = Buffer.concat([salt, iv, authTag, encrypted])
  writeFileSync(outputPath, output)

  console.log(`\n✅ Encrypted file saved to: ${outputPath}`)
  console.log('   This file is safe to upload to Google Drive')
}

function decryptFile(inputPath: string, outputPath: string, password: string): void {
  const content = readFileSync(inputPath)

  const salt = content.subarray(0, 32)
  const iv = content.subarray(32, 48)
  const authTag = content.subarray(48, 64)
  const encrypted = content.subarray(64)

  const key = scryptSync(password, salt, 32)
  const decipher = createDecipheriv(ENCRYPTION_ALGORITHM, key, iv)
  decipher.setAuthTag(authTag)

  const decrypted = Buffer.concat([decipher.update(encrypted), decipher.final()])
  writeFileSync(outputPath, decrypted)

  console.log(`\n✅ Decrypted file saved to: ${outputPath}`)
  console.log('   ⚠️  Remember to delete this file after import!')
}

// Main TUI loop
async function main() {
  const tui = new BrowserFinderTUI()

  try {
    tui.printHeader()
    await tui.scanForBrowsers()

    let running = true
    while (running) {
      const choice = await tui.showMainMenu()

      switch (choice.trim()) {
        case '1': {
          const filePath = await tui.prompt('\n  Enter CSV file path: ')
          if (!existsSync(filePath.trim())) {
            console.log('\n  ❌ File not found')
            break
          }

          console.log('\n  Browser types: chrome, edge, firefox, brave, bitwarden, lastpass, onepassword, dashlane, keepass')
          const browserType = await tui.prompt('  Enter browser/manager type: ')

          const dryRunChoice = await tui.prompt('  Dry run first? (y/n): ')
          const dryRun = dryRunChoice.toLowerCase() === 'y'

          console.log('\n  📥 Importing...\n')
          const result = await importCSVToDatabase(filePath.trim(), browserType.trim().toLowerCase(), dryRun)

          console.log(`\n  ✅ Import complete`)
          console.log(`     Imported: ${result.imported}`)
          console.log(`     Skipped: ${result.skipped}`)
          if (result.errors.length > 0) {
            console.log(`     Errors: ${result.errors.length}`)
          }

          if (dryRun) {
            const proceed = await tui.prompt('\n  Proceed with actual import? (y/n): ')
            if (proceed.toLowerCase() === 'y') {
              const realResult = await importCSVToDatabase(filePath.trim(), browserType.trim().toLowerCase(), false)
              console.log(`\n  ✅ Real import complete: ${realResult.imported} accounts`)
            }
          }
          break
        }

        case '2':
          tui.printHeader()
          await tui.scanForBrowsers()
          break

        case '3':
          await tui.showExportInstructions()
          break

        case '4': {
          const inputFile = await tui.prompt('\n  Enter CSV file to encrypt: ')
          if (!existsSync(inputFile.trim())) {
            console.log('\n  ❌ File not found')
            break
          }
          const password = await tui.prompt('  Enter encryption password: ')
          const outputFile = inputFile.trim().replace('.csv', '.encrypted')
          encryptFile(inputFile.trim(), outputFile, password)
          break
        }

        case '5': {
          const encryptedFile = await tui.prompt('\n  Enter encrypted file path: ')
          if (!existsSync(encryptedFile.trim())) {
            console.log('\n  ❌ File not found')
            break
          }
          const decryptPassword = await tui.prompt('  Enter decryption password: ')
          const decryptedFile = encryptedFile.trim().replace('.encrypted', '_decrypted.csv')
          try {
            decryptFile(encryptedFile.trim(), decryptedFile, decryptPassword)
          } catch {
            console.log('\n  ❌ Decryption failed - wrong password or corrupted file')
          }
          break
        }

        case '6': {
          const accountCount = await prisma.account.count()
          const bySource = await prisma.account.groupBy({
            by: ['source'],
            _count: { source: true },
          })
          const byCategory = await prisma.account.groupBy({
            by: ['category'],
            _count: { category: true },
          })

          console.log('\n  📊 Import Statistics')
          console.log('  ════════════════════')
          console.log(`  Total Accounts: ${accountCount}`)
          console.log('\n  By Source:')
          bySource.forEach(s => console.log(`    ${s.source}: ${s._count.source}`))
          console.log('\n  By Category:')
          byCategory.forEach(c => console.log(`    ${c.category}: ${c._count.category}`))

          await tui.prompt('\n  Press Enter to continue...')
          break
        }

        case '7':
          running = false
          console.log('\n  👋 Goodbye!\n')
          break

        default:
          console.log('\n  ❌ Invalid option')
      }
    }
  } finally {
    tui.close()
    await prisma.$disconnect()
  }
}

main().catch(console.error)
