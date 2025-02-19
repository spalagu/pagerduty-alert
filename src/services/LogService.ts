import { app } from 'electron'
import * as path from 'path'
import * as fs from 'fs'
import type { LogLevel, LogConfig } from '../types'
import { DEFAULT_LOG_CONFIG } from '../config/defaults'

class LogService {
  private logPath: string
  private config: LogConfig = DEFAULT_LOG_CONFIG

  constructor() {
    this.logPath = path.join(app.getPath('userData'), 'logs')
    if (!fs.existsSync(this.logPath)) {
      fs.mkdirSync(this.logPath)
    }
  }

  public setConfig(config: LogConfig) {
    console.log('更新日志配置:', config)
    this.config = { ...DEFAULT_LOG_CONFIG, ...config }
  }

  private getLogFile() {
    return path.join(this.logPath, `app-${new Date().toISOString().split('T')[0]}.log`)
  }

  private shouldLog(level: LogLevel): boolean {
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

  private log(level: LogLevel, message: string, data?: any) {
    if (!this.shouldLog(level)) {
      return
    }

    const timestamp = new Date().toISOString()
    const logLine = `${timestamp} [${level.toUpperCase()}] ${message}${
      data ? ` ${JSON.stringify(data, null, 2)}` : ''
    }\n`

    try {
      fs.appendFileSync(this.getLogFile(), logLine)
    } catch (error) {
      console.error('写入日志失败:', error)
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

      return files.map(file => {
        const content = fs.readFileSync(path.join(this.logPath, file), 'utf-8')
        return `=== ${file} ===\n${content}`
      }).join('\n\n')
    } catch (error) {
      console.error('读取日志失败:', error)
      return '读取日志失败'
    }
  }
}

export const logService = new LogService() 