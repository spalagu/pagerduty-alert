import { app } from 'electron'
import * as path from 'path'
import * as fs from 'fs'
import type { LogLevel, LogConfig } from '../types'
import { DEFAULT_LOG_CONFIG } from '../config/defaults'

class LogService {
  private logPath: string = ''
  private config: LogConfig = DEFAULT_LOG_CONFIG
  private isDev = process.env.NODE_ENV === 'development'
  private isReady = false

  constructor() {
    // 延迟初始化，等待 app ready
    if (app.isReady()) {
      this.initialize()
    } else {
      app.whenReady().then(() => this.initialize())
    }
  }

  private initialize() {
    try {
      this.logPath = path.join(app.getPath('userData'), 'logs')
      if (!fs.existsSync(this.logPath)) {
        fs.mkdirSync(this.logPath)
      }
      this.isReady = true
    } catch (error) {
      console.error('LogService 初始化失败:', error)
    }
  }

  public setConfig(config: LogConfig) {
    this.config = { ...DEFAULT_LOG_CONFIG, ...config }
  }

  private getLogFile() {
    return path.join(this.logPath, `app-${new Date().toISOString().split('T')[0]}.log`)
  }

  private shouldLog(level: LogLevel): boolean {
    // 开发环境始终记录日志
    if (this.isDev) {
      return true
    }
    
    // 生产环境根据配置和级别判断
    if (!this.config.enabled) {
      return false
    }

    const levels: Record<LogLevel, number> = {
      'debug': 0,
      'info': 1,
      'warn': 2,
      'error': 3
    }

    return levels[level] >= levels[this.config.level]
  }

  private formatMessage(level: LogLevel, message: string, data?: any): string {
    const timestamp = new Date().toISOString()
    const logMessage = data ? `${message} ${JSON.stringify(data, null, 2)}` : message
    return `${timestamp} [${level.toUpperCase()}] ${logMessage}\n`
  }

  private log(level: LogLevel, message: string, data?: any) {
    // 如果服务未就绪，使用 console 输出
    if (!this.isReady) {
      const consoleMethod = {
        'debug': console.debug,
        'info': console.log,
        'warn': console.warn,
        'error': console.error
      }[level]
      
      if (data) {
        consoleMethod(`[Early] ${message}`, data)
      } else {
        consoleMethod(`[Early] ${message}`)
      }
      return
    }

    if (!this.shouldLog(level)) {
      return
    }

    const logLine = this.formatMessage(level, message, data)

    // 开发环境下输出到控制台
    if (this.isDev) {
      const consoleMethod = {
        'debug': console.debug,
        'info': console.log,
        'warn': console.warn,
        'error': console.error
      }[level]
      
      if (data) {
        consoleMethod(message, data)
      } else {
        consoleMethod(message)
      }
    }

    // 根据配置写入文件
    if (this.config.enabled) {
      try {
        fs.appendFileSync(this.getLogFile(), logLine)
      } catch (error) {
        if (this.isDev) {
          console.error('写入日志失败:', error)
        }
      }
    }
  }

  public debug(message: string, data?: any) {
    this.log('debug', message, data)
  }

  public info(message: string, data?: any) {
    this.log('info', message, data)
  }

  public warn(message: string, data?: any) {
    this.log('warn', message, data)
  }

  public error(message: string, data?: any) {
    this.log('error', message, data)
  }

  public getLogContent(days: number = 1): string {
    if (!this.isReady) {
      return '日志服务未就绪'
    }

    try {
      const today = new Date()
      const files = fs.readdirSync(this.logPath)
        .filter(file => {
          if (!file.startsWith('app-')) return false
          const fileDate = new Date(file.slice(4, 14))
          const diffDays = Math.floor((today.getTime() - fileDate.getTime()) / (1000 * 60 * 60 * 24))
          return diffDays < days
        })
        .sort()
        .reverse()

      if (files.length === 0) {
        return '没有找到日志文件'
      }

      const result = files.map(file => {
        const content = fs.readFileSync(path.join(this.logPath, file), 'utf-8')
        return `=== ${file} ===\n${content}`
      }).join('\n\n')

      return result
    } catch (error) {
      if (this.isDev) {
        console.error('读取日志失败:', error)
      }
      return '读取日志失败'
    }
  }
}

export const logService = new LogService() 