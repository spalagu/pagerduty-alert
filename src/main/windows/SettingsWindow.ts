import { BrowserWindow, nativeTheme, app, ipcMain } from 'electron'
import * as path from 'path'
import type { PagerDutyConfig } from '../../types'
import { notificationService } from '../../services/NotificationService'
import { logService } from '../../services/LogService'

export class SettingsWindow {
  private window: BrowserWindow | null = null
  private lastValidatedApiKey: string = ''

  constructor() {
    this.setupIPC()
  }

  private setupIPC() {
    // 添加配置保存的处理
    ipcMain.handle('settings-save-config', async (event, newConfig: PagerDutyConfig, oldConfig: PagerDutyConfig) => {
      logService.info('处理配置保存请求', {
        hasNewApiKey: !!newConfig.apiKey,
        hasOldApiKey: !!oldConfig.apiKey,
        apiKeyChanged: newConfig.apiKey !== oldConfig.apiKey
      })

      // 检查 API 密钥是否发生变化
      if (newConfig.apiKey !== oldConfig.apiKey && newConfig.apiKey !== this.lastValidatedApiKey) {
        logService.info('API 密钥已更改，开始验证')
        
        try {
          const isValid = await this.validateApiKey(newConfig.apiKey)
          if (!isValid) {
            logService.info('API 密钥验证失败')
            notificationService.showNotification({
              title: 'PagerDuty Alert',
              body: 'API 密钥无效，请检查配置',
              urgency: 'high'
            })
            return { success: false, error: 'Invalid API key' }
          }
          
          // 更新最后验证的密钥
          this.lastValidatedApiKey = newConfig.apiKey
          logService.info('API 密钥验证成功')
          
        } catch (error) {
          logService.error('API 密钥验证过程出错', error)
          notificationService.showNotification({
            title: 'PagerDuty Alert',
            body: '无法验证 API 密钥，请检查网络连接',
            urgency: 'high'
          })
          return { success: false, error: 'Failed to validate API key' }
        }
      }

      return { success: true }
    })
  }

  private async validateApiKey(apiKey: string): Promise<boolean> {
    if (!apiKey) return false

    try {
      logService.info('验证 API 密钥')
      const response = await fetch('https://api.pagerduty.com/users/me', {
        headers: {
          'Accept': 'application/vnd.pagerduty+json;version=2',
          'Authorization': `Token token=${apiKey}`
        }
      })

      const isValid = response.ok
      logService.info('API 密钥验证结果', { isValid, status: response.status })
      return isValid
      
    } catch (error) {
      logService.error('API 密钥验证请求失败', error)
      throw error
    }
  }

  public createWindow() {
    if (this.window) {
      this.window.show()
      return
    }

    const isDev = process.env.NODE_ENV === 'development' || !app.isPackaged
    const isDark = nativeTheme.shouldUseDarkColors
    const backgroundColor = isDark ? '#1a1a1a' : '#ffffff'

    this.window = new BrowserWindow({
      width: 800,
      height: 600,
      show: false,
      backgroundColor,
      webPreferences: {
        nodeIntegration: false,
        contextIsolation: true,
        preload: isDev
          ? path.join(process.cwd(), 'dist', 'preload.js')
          : path.join(app.getAppPath(), 'dist', 'preload.js')
      },
      minimizable: true,
      maximizable: false,
      fullscreenable: false,
      title: '设置'
    })

    // 根据环境加载不同的页面
    const htmlPath = isDev
      ? path.join(process.cwd(), 'dist', 'settings.html')
      : path.join(app.getAppPath(), 'dist', 'settings.html')
    logService.info('加载设置页面', { htmlPath, isDev })
    this.window.loadFile(htmlPath)

    // 开发环境打开开发者工具
    if (isDev) {
      this.window.webContents.openDevTools()
    }

    // 监听窗口关闭事件
    this.window.on('closed', () => {
      this.window = null
    })

    // 监听主题变化
    nativeTheme.on('updated', () => {
      const isDark = nativeTheme.shouldUseDarkColors
      if (this.window) {
        const backgroundColor = isDark ? '#1a1a1a' : '#ffffff'
        this.window.setBackgroundColor(backgroundColor)
        this.window.webContents.send('theme-changed', isDark)
      }
    })

    // 监听页面加载完成事件
    this.window.webContents.on('did-finish-load', () => {
      logService.info('设置页面加载完成')
    })

    // 监听页面加载失败事件
    this.window.webContents.on('did-fail-load', (event, errorCode, errorDescription) => {
      logService.error('设置页面加载失败', { errorCode, errorDescription })
    })

    this.window.once('ready-to-show', () => {
      this.window?.showInactive()
    })
  }

  public show() {
    if (!this.window) {
      this.createWindow()
    } else {
      this.window.showInactive()
    }
  }

  public close() {
    if (this.window) {
      this.window.close()
      this.window = null
    }
  }

  public isVisible() {
    return this.window?.isVisible() ?? false
  }

  public destroy() {
    if (this.window) {
      this.window.destroy()
      this.window = null
    }
  }

  public async cleanup() {
    if (this.window) {
      try {
        this.window.removeAllListeners()
        await this.window.webContents.session.clearCache()
        this.window.destroy()
        this.window = null
      } catch (error) {
        logService.error('清理设置窗口时出错', error)
      }
    }
  }
} 