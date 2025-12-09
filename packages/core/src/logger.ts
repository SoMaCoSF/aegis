// ==============================================================================
// file_id: SOM-SCR-0015-v1.0.0
// name: logger.ts
// description: Centralized logging utility for AEGIS with file and console output
// project_id: AEGIS
// category: utility
// tags: [logging, utility, debug]
// created: 2025-12-08
// modified: 2025-12-08
// version: 1.0.0
// agent_id: AGENT-PRIME-001
// execution: import { logger } from '@aegis/core'
// ==============================================================================

import { appendFileSync, mkdirSync, existsSync } from 'fs'
import { join } from 'path'

export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
  SILENT = 4,
}

interface LogConfig {
  level: LogLevel
  logToFile: boolean
  logToConsole: boolean
  logDir: string
  maxFileSizeMB: number
}

const defaultConfig: LogConfig = {
  level: LogLevel.INFO,
  logToFile: true,
  logToConsole: true,
  logDir: join(process.cwd(), 'logs'),
  maxFileSizeMB: 10,
}

class Logger {
  private config: LogConfig
  private currentLogFile: string
  private module: string

  constructor(module: string, config: Partial<LogConfig> = {}) {
    this.module = module
    this.config = { ...defaultConfig, ...config }
    this.currentLogFile = this.getLogFileName()
    this.ensureLogDir()
  }

  private ensureLogDir(): void {
    if (this.config.logToFile && !existsSync(this.config.logDir)) {
      mkdirSync(this.config.logDir, { recursive: true })
    }
  }

  private getLogFileName(): string {
    const date = new Date().toISOString().split('T')[0]
    return join(this.config.logDir, `aegis-${date}.log`)
  }

  private formatMessage(level: string, message: string, data?: unknown): string {
    const timestamp = new Date().toISOString()
    const dataStr = data ? ` | ${JSON.stringify(data)}` : ''
    return `[${timestamp}] [${level}] [${this.module}] ${message}${dataStr}`
  }

  private getLevelColor(level: LogLevel): string {
    switch (level) {
      case LogLevel.DEBUG: return '\x1b[36m' // Cyan
      case LogLevel.INFO: return '\x1b[32m'  // Green
      case LogLevel.WARN: return '\x1b[33m'  // Yellow
      case LogLevel.ERROR: return '\x1b[31m' // Red
      default: return '\x1b[0m'
    }
  }

  private log(level: LogLevel, levelName: string, message: string, data?: unknown): void {
    if (level < this.config.level) return

    const formattedMessage = this.formatMessage(levelName, message, data)

    if (this.config.logToConsole) {
      const color = this.getLevelColor(level)
      const reset = '\x1b[0m'
      console.log(`${color}${formattedMessage}${reset}`)
    }

    if (this.config.logToFile) {
      try {
        appendFileSync(this.currentLogFile, formattedMessage + '\n')
      } catch (err) {
        console.error('Failed to write to log file:', err)
      }
    }
  }

  debug(message: string, data?: unknown): void {
    this.log(LogLevel.DEBUG, 'DEBUG', message, data)
  }

  info(message: string, data?: unknown): void {
    this.log(LogLevel.INFO, 'INFO', message, data)
  }

  warn(message: string, data?: unknown): void {
    this.log(LogLevel.WARN, 'WARN', message, data)
  }

  error(message: string, data?: unknown): void {
    this.log(LogLevel.ERROR, 'ERROR', message, data)
  }

  setLevel(level: LogLevel): void {
    this.config.level = level
  }

  getLevel(): LogLevel {
    return this.config.level
  }
}

// Factory function to create loggers for different modules
export function createLogger(module: string, config?: Partial<LogConfig>): Logger {
  return new Logger(module, config)
}

// Default logger instance
export const logger = createLogger('AEGIS')

export default Logger
