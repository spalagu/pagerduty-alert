import { app, BrowserWindow, Tray, ipcMain, nativeImage, Notification, Menu, nativeTheme } from 'electron'
import * as path from 'path'
import Store from 'electron-store'
import fetch from 'node-fetch'
import { PagerDutyConfig, Incident } from '../types'
import { themeService } from '../services/ThemeService'
import { cacheService } from '../services/CacheService'
import { systemService } from '../services/SystemService'
import { SettingsWindow } from './windows/SettingsWindow'
import { notificationService } from '../services/NotificationService'
import { NotificationWindow } from './windows/NotificationWindow'
import { DEFAULT_CONFIG } from '../config/defaults'
import { logService } from '../services/LogService'
import { LogViewerWindow } from './windows/LogViewerWindow'

export class PagerDutyMenuBar {
  private tray: Tray | null = null
  private window: BrowserWindow | null = null
  private settingsWindow: SettingsWindow | null = null
  private store: Store<any>
  private isQuitting = false
  private pollingTimer: NodeJS.Timeout | null = null
  private lastValidIncidents: Incident[] = []
  private notificationWindow: NotificationWindow | null = null
  private lastIncidentIds: Set<string> = new Set()
  private isFetching = false
  private lastCheckedTime: string = new Date().toISOString()
  private appStartTime: string = new Date().toISOString()
  private pendingNotifications = {
    high: 0,
    low: 0
  }
  private hasActiveNotification = false
  private hasShownApiKeyWarning = false

  constructor() {
    console.log('PagerDutyMenuBar 构造函数开始...')
    try {
      // 创建 store 实例时提供默认配置
      this.store = new Store({
        name: 'pagerduty',
        defaults: {
          config: DEFAULT_CONFIG
        },
        clearInvalidConfig: true
      })

      // 验证并修复配置
      this.validateAndRepairConfig()
      
      this.appStartTime = new Date().toISOString()
      this.lastCheckedTime = this.appStartTime
      this.lastIncidentIds = new Set()
      
      console.log('PagerDutyMenuBar 初始化成功')
    } catch (error) {
      console.error('PagerDutyMenuBar 初始化失败:', error)
      // 如果初始化失败，使用新的空 Store
      this.store = new Store({
        name: 'pagerduty',
        defaults: {
          config: DEFAULT_CONFIG
        }
      })
    }
    
    // 修改 before-quit 事件监听
    app.on('before-quit', async (event) => {
      console.log('触发 before-quit 事件')
      if (!this.isQuitting) {
        console.log('开始执行退出前清理...')
        event.preventDefault()
        this.isQuitting = true
        try {
          await this.cleanup()
          console.log('清理完成，准备退出应用')
          process.nextTick(() => app.exit(0))
        } catch (error) {
          console.error('清理过程出错:', error)
          process.nextTick(() => app.exit(1))
        }
      }
    })
    
    // 修改 window-all-closed 事件处理
    app.on('window-all-closed', () => {
      console.log('所有窗口已关闭')
      if (this.isQuitting) {
        console.log('正在退出过程中，忽略 window-all-closed 事件')
        return
      }
      if (process.platform !== 'darwin') {
        console.log('非 macOS 平台，触发应用退出')
        app.quit()
      } else {
        console.log('macOS 平台，保持应用运行')
      }
    })
    
    this.init().catch(err => {
      console.error('初始化失败:', err)
      app.exit(1)
    })
  }

  private validateAndRepairConfig() {
    console.log('验证并修复主配置...')
    try {
      const config = this.store.get('config') as PagerDutyConfig
      if (!config || typeof config !== 'object') {
        console.log('主配置无效，使用默认配置')
        this.store.set('config', this.store.get('defaults.config'))
        return
      }

      // 验证必要的配置项
      let needsRepair = false

      // 验证 notification 配置
      if (!config.notification || typeof config.notification !== 'object') {
        console.log('notification 配置无效，使用默认值')
        config.notification = this.store.get('defaults.config.notification')
        needsRepair = true
      }

      // 验证 appearance 配置
      if (!config.appearance || typeof config.appearance !== 'object') {
        console.log('appearance 配置无效，使用默认值')
        config.appearance = this.store.get('defaults.config.appearance')
        needsRepair = true
      }

      // 验证 system 配置
      if (!config.system || typeof config.system !== 'object') {
        console.log('system 配置无效，使用默认值')
        config.system = this.store.get('defaults.config.system')
        needsRepair = true
      }

      // 验证 cache 配置
      if (!config.cache || typeof config.cache !== 'object') {
        console.log('cache 配置无效，使用默认值')
        config.cache = this.store.get('defaults.config.cache')
        needsRepair = true
      }

      if (needsRepair) {
        this.store.set('config', config)
      }
    } catch (error) {
      console.error('配置验证/修复失败:', error)
      // 重置为默认值
      this.store.clear()
      this.store.set('config', this.store.get('defaults.config'))
    }
  }

  private async init() {
    try {
      console.log('等待应用就绪...')
      await app.whenReady()
      console.log('应用初始化开始...')

      // 获取配置
      const config = this.store.get('config') as PagerDutyConfig
      console.log('当前配置:', config)

      // 设置主题
      const theme = config.appearance?.theme || 'light'
      console.log('设置主题:', theme)
      themeService.setTheme(theme)

      // 先设置 IPC 通信
      console.log('设置 IPC 通信...')
      this.setupIPC()

      // 初始化窗口管理器
      console.log('初始化窗口管理器...')
      this.settingsWindow = new SettingsWindow()
      this.notificationWindow = NotificationWindow.getInstance()

      // 创建托盘
      console.log('开始创建托盘...')
      await this.createTray()
      console.log('托盘创建完成')

      // 等待一小段时间确保 IPC 已完全注册
      await new Promise(resolve => setTimeout(resolve, 100))
      
      // 创建并加载窗口
      console.log('开始创建窗口...')
      await this.createWindow(config.appearance || { theme: 'light', windowSize: { width: 400, height: 600 } })
      if (!this.window) {
        throw new Error('Failed to create window')
      }

      // 等待页面加载完成
      console.log('等待页面加载...')
      await new Promise<void>((resolve) => {
        const onLoad = () => {
          console.log('页面加载完成')
          this.window?.webContents.removeListener('did-finish-load', onLoad)
          resolve()
        }
        this.window?.webContents.on('did-finish-load', onLoad)
      })

      // 通知渲染进程 IPC 已就绪
      console.log('通知渲染进程 IPC 已就绪')
      this.window?.webContents.send('ipc-ready')

      // 验证 API 密钥
      await this.validateApiKey()

      // 启动轮询
      console.log('启动轮询...')
      await this.startPolling()

      console.log('应用初始化完成')
    } catch (error) {
      console.error('初始化过程出错:', error)
      throw error
    }
  }

  private resetIncidentState() {
    console.log('重置告警状态...')
    this.lastIncidentIds = new Set()
    this.lastValidIncidents = []
    this.lastCheckedTime = new Date().toISOString()
    this.pendingNotifications = {
      high: 0,
      low: 0
    }
  }

  private async validateApiKey() {
    if (this.hasShownApiKeyWarning) return

    const config = this.store.get('config') as PagerDutyConfig
    if (!config.apiKey) {
      console.log('未配置 API 密钥')
      notificationService.showNotification({
        title: 'PagerDuty Alert',
        body: '请先配置 PagerDuty API 密钥',
        urgency: 'high',
        onClick: () => {
          this.settingsWindow?.show()
        }
      })
      this.hasShownApiKeyWarning = true
      return
    }

    try {
      const response = await fetch('https://api.pagerduty.com/users/me', {
        headers: {
          'Accept': 'application/vnd.pagerduty+json;version=2',
          'Authorization': `Token token=${config.apiKey}`
        }
      })

      if (!response.ok) {
        console.log('API 密钥无效')
        notificationService.showNotification({
          title: 'PagerDuty Alert',
          body: 'API 密钥无效，请检查配置',
          urgency: 'high',
          onClick: () => {
            this.settingsWindow?.show()
          }
        })
        this.hasShownApiKeyWarning = true
      }
    } catch (error) {
      console.error('验证 API 密钥失败:', error)
      notificationService.showNotification({
        title: 'PagerDuty Alert',
        body: '无法验证 API 密钥，请检查网络连接',
        urgency: 'high',
        onClick: () => {
          this.settingsWindow?.show()
        }
      })
      this.hasShownApiKeyWarning = true
    }
  }

  private applyTheme(appearance: PagerDutyConfig['appearance']) {
    if (!this.window) return

    console.log('应用主题设置:', appearance)

    // 设置主题
    if (appearance.theme === 'system') {
      nativeTheme.themeSource = 'system'
    } else {
      nativeTheme.themeSource = appearance.theme
    }

    // 设置背景色
    const isDark = nativeTheme.shouldUseDarkColors
    this.window.setBackgroundColor(isDark ? '#1a1a1a' : '#ffffff')

    // 设置窗口大小
    if (appearance.windowSize) {
      const { width, height } = appearance.windowSize
      const [currentWidth, currentHeight] = this.window.getSize()
      if (width !== currentWidth || height !== currentHeight) {
        console.log('更新窗口大小:', width, height)
        this.window.setSize(width, height)
      }
    }
  }

  private async cleanup() {
    console.log('开始清理资源...')
    
    // 设置退出标志
    this.isQuitting = true
    
    // 清理轮询定时器
    if (this.pollingTimer) {
      clearInterval(this.pollingTimer)
      this.pollingTimer = null
      console.log('已清理轮询定时器')
    }

    // 清理缓存
    cacheService.clearCache()

    // 关闭并销毁窗口
    if (this.window) {
      try {
        this.window.removeAllListeners()
        await this.window.webContents.session.clearCache()
        this.window.destroy()
        this.window = null
        console.log('已销毁主窗口')
      } catch (error) {
        console.error('销毁主窗口时出错:', error)
      }
    }

    // 关闭并销毁设置窗口
    if (this.settingsWindow) {
      try {
        await this.settingsWindow.cleanup()
        this.settingsWindow = null
        console.log('已销毁设置窗口')
      } catch (error) {
        console.error('销毁设置窗口时出错:', error)
      }
    }

    // 关闭并销毁通知窗口
    if (this.notificationWindow) {
      try {
        this.notificationWindow = null
        console.log('已销毁通知窗口')
      } catch (error) {
        console.error('销毁通知窗口时出错:', error)
      }
    }

    // 销毁托盘图标
    if (this.tray) {
      try {
        this.tray.removeAllListeners()
        this.tray.destroy()
        this.tray = null
        console.log('已销毁托盘图标')
      } catch (error) {
        console.error('销毁托盘图标时出错:', error)
      }
    }

    // 等待一小段时间确保资源释放
    await new Promise(resolve => setTimeout(resolve, 200))
    console.log('资源清理完成')
  }

  private getIconPath(iconName: string): string {
    console.log('开始查找图标文件:', iconName)
    // 尝试不同的路径
    const possiblePaths = [
      // 开发环境路径
      path.join(process.cwd(), 'dist', 'assets', iconName),
      // 生产环境路径
      path.join(app.getAppPath(), '..', 'assets', iconName),
      // 备用路径
      path.join(__dirname, 'assets', iconName)
    ]

    console.log('尝试以下路径:')
    for (const iconPath of possiblePaths) {
      console.log('- 检查路径:', iconPath)
      if (require('fs').existsSync(iconPath)) {
        console.log('找到图标文件:', iconPath)
        return iconPath
      }
    }

    console.error('所有路径都未找到图标文件')
    throw new Error(`找不到图标文件: ${iconName}`)
  }

  private createTray() {
    try {
      console.log('创建托盘图标...')
      
      const iconPath = this.getIconPath('tray-icon.png')
      console.log('使用图标路径:', iconPath)

      // 检查图标文件是否存在
      const fs = require('fs')
      if (!fs.existsSync(iconPath)) {
        console.error('图标文件不存在:', iconPath)
        throw new Error('图标文件不存在')
      }

      // 获取图标文件大小
      const stats = fs.statSync(iconPath)
      console.log('图标文件大小:', stats.size, 'bytes')

      // 直接从路径创建图标
      console.log('开始创建 nativeImage...')
      const icon = nativeImage.createFromPath(iconPath)
      
      // 检查图标尺寸
      const size = icon.getSize()
      console.log('图标尺寸:', size)

      if (icon.isEmpty()) {
        console.error('图标加载失败: 图标为空')
        throw new Error('图标加载失败')
      }
      
      console.log('图标创建成功')
      // 不设置为 template image
      icon.setTemplateImage(false)
      
      console.log('开始创建 Tray 实例...')
      this.tray = new Tray(icon)
      
      console.log('设置工具提示...')
      this.tray.setToolTip('PagerDuty')
      
      console.log('设置托盘事件...')
      this.setupTrayEvents()
      
      console.log('托盘创建成功')
    } catch (error) {
      console.error('创建托盘图标失败:', error)
      throw error // 重新抛出错误，让上层知道创建失败
    }
  }

  private setupTrayEvents() {
    if (!this.tray) return

    // 创建右键菜单
    const contextMenu = Menu.buildFromTemplate([
      {
        label: '设置',
        click: () => {
          if (this.window) {
            this.window.webContents.send('show-settings')
            this.window.show()
            this.window.focus()
          }
        }
      },
      { type: 'separator' },
      {
        label: '退出',
        click: async () => {
          console.log('用户点击退出按钮')
          try {
            await this.cleanup()
            console.log('清理完成，强制退出应用')
            if (this.window) {
              this.window.destroy()
            }
            app.exit(0)
          } catch (error) {
            console.error('退出清理过程出错:', error)
            app.exit(1)
          }
        }
      }
    ])

    // 左键点击显示主窗口
    this.tray.on('click', () => {
      if (this.window) {
        // 获取显示器
        const primaryDisplay = require('electron').screen.getPrimaryDisplay()
        const { width, height } = primaryDisplay.workAreaSize
        
        // 获取托盘图标位置
        const trayBounds = this.tray?.getBounds()
        if (!trayBounds) return
        
        const windowBounds = this.window.getBounds()
        
        // 计算窗口位置
        let x = Math.round(trayBounds.x + (trayBounds.width / 2) - (windowBounds.width / 2))
        let y = Math.round(trayBounds.y + trayBounds.height + 4)
        
        // 确保窗口不会超出屏幕
        if (x + windowBounds.width > width) {
          x = width - windowBounds.width
        }
        if (x < 0) {
          x = 0
        }
        if (y + windowBounds.height > height) {
          y = height - windowBounds.height
        }
        
        this.window.setPosition(x, y)
        this.window.show()
        this.window.focus()
      }
    })

    // 右键点击显示菜单
    this.tray.on('right-click', () => {
      this.tray?.popUpContextMenu(contextMenu)
    })

    // 取消默认双击事件
    this.tray.on('double-click', () => {})
  }

  private createWindow(appearance: PagerDutyConfig['appearance']) {
    console.log('创建主窗口...')
    try {
      const isDark = nativeTheme.shouldUseDarkColors
      console.log('当前主题:', isDark ? 'dark' : 'light')

      // 创建窗口时就设置正确的背景色
      const backgroundColor = isDark ? '#1a1a1a' : '#ffffff'
      
      this.window = new BrowserWindow({
        width: appearance.windowSize.width,
        height: appearance.windowSize.height,
        show: false,
        frame: false,
        resizable: false,
        skipTaskbar: true,
        alwaysOnTop: true,
        titleBarStyle: 'hidden',
        titleBarOverlay: false,
        hasShadow: true,
        backgroundColor,
        webPreferences: {
          nodeIntegration: false,
          contextIsolation: true,
          preload: path.join(__dirname, 'preload.js')
        },
        minimizable: false,
        maximizable: false,
        closable: false,
        fullscreenable: false
      })

      // 设置 Dock 图标隐藏
      app.dock?.hide()

      // 根据环境加载不同的页面
      const isDev = process.env.NODE_ENV === 'development'
      const htmlPath = isDev 
        ? path.join(process.cwd(), 'dist', 'index.html')
        : path.join(__dirname, 'index.html')
      
      console.log('加载页面:', htmlPath)
      this.window.loadFile(htmlPath)

      // 开发环境打开开发者工具
      if (isDev) {
        this.window.webContents.openDevTools()
      }

      // 监听加载完成事件
      this.window.webContents.on('did-finish-load', () => {
        console.log('页面加载完成')
        // 通知渲染进程当前主题
        this.window?.webContents.send('theme-changed', isDark)
      })

      // 监听加载失败事件
      this.window.webContents.on('did-fail-load', (event, errorCode, errorDescription) => {
        console.error('页面加载失败:', errorCode, errorDescription)
      })

      // 监听窗口关闭事件
      this.window.on('close', (event) => {
        console.log('窗口关闭事件触发, isQuitting:', this.isQuitting)
        if (!this.isQuitting) {
          event.preventDefault()
          this.window?.hide()
        } else {
          console.log('正在退出，允许窗口关闭')
        }
      })

      this.window.on('blur', () => {
        if (!this.isQuitting) {
          this.window?.hide()
        }
      })

      this.window.webContents.on('before-input-event', (event, input) => {
        if (input.key === 'Escape') {
          this.window?.hide()
        }
      })

      console.log('主窗口创建成功')
    } catch (error) {
      console.error('创建主窗口失败:', error)
    }
  }

  private setupIPC() {
    console.log('开始注册 IPC 处理器...')
    
    // 移除所有现有的 IPC 处理器
    ipcMain.removeHandler('get-config')
    ipcMain.removeHandler('save-config')
    ipcMain.removeHandler('config-changed')
    ipcMain.removeHandler('show-settings-window')
    ipcMain.removeHandler('close-settings-window')
    ipcMain.removeHandler('acknowledge-incident')
    ipcMain.removeHandler('get-incident-details')
    ipcMain.removeHandler('fetch-incidents')
    ipcMain.removeHandler('update-tray-icon')
    ipcMain.removeHandler('test-proxy')
    ipcMain.removeHandler('get-theme-mode')
    ipcMain.removeHandler('get-all-incidents')
    ipcMain.removeHandler('show-log-viewer')
    ipcMain.removeHandler('get-logs')

    // 重新注册所有 IPC 处理器
    ipcMain.handle('get-config', () => {
      console.log('处理 get-config 请求')
      return this.store.get('config')
    })

    ipcMain.handle('save-config', async (event, config: PagerDutyConfig) => {
      console.log('保存配置，当前配置详情:', {
        apiKey: config.apiKey ? '已设置' : '未设置',
        pollingInterval: config.pollingInterval,
        urgencyFilter: config.urgencyFilter,
        statusFilter: config.statusFilter,
        showOnlyNewAlerts: config.showOnlyNewAlerts,
        notification: {
          enabled: config.notification?.enabled,
          sound: config.notification?.sound,
          grouping: config.notification?.grouping,
          criticalPersistent: config.notification?.criticalPersistent,
          clickToShow: config.notification?.clickToShow
        },
        appearance: {
          theme: config.appearance?.theme,
          windowSize: config.appearance?.windowSize
        },
        system: {
          autoLaunch: config.system?.autoLaunch,
          proxy: {
            enabled: config.system?.proxy?.enabled,
            server: config.system?.proxy?.server,
            bypass: config.system?.proxy?.bypass
          }
        },
        cache: {
          enabled: config.cache?.enabled,
          maxAge: config.cache?.maxAge,
          maxItems: config.cache?.maxItems
        },
        log: {
          enabled: config.log?.enabled,
          level: config.log?.level
        }
      })

      // 检查 API 密钥是否发生变化
      const oldConfig = this.store.get('config') as PagerDutyConfig
      const apiKeyChanged = oldConfig.apiKey !== config.apiKey
      const showOnlyNewAlertsChanged = oldConfig.showOnlyNewAlerts !== config.showOnlyNewAlerts

      // 如果 API 密钥已更改，验证新密钥
      if (apiKeyChanged && config.apiKey) {
        console.log('API 密钥已更改，开始验证')
        try {
          const response = await fetch('https://api.pagerduty.com/users/me', {
            headers: {
              'Accept': 'application/vnd.pagerduty+json;version=2',
              'Authorization': `Token token=${config.apiKey}`
            }
          })

          if (!response.ok) {
            console.log('新 API 密钥无效')
            notificationService.showNotification({
              title: 'PagerDuty Alert',
              body: 'API 密钥无效，请检查配置',
              urgency: 'high'
            })
            return { success: false, error: 'Invalid API key' }
          }
          
          console.log('API 密钥验证成功')
        } catch (error) {
          console.error('API 密钥验证失败:', error)
          notificationService.showNotification({
            title: 'PagerDuty Alert',
            body: '无法验证 API 密钥，请检查网络连接',
            urgency: 'high'
          })
          return { success: false, error: 'Failed to validate API key' }
        }
      }

      // 如果显示模式改变，重置状态
      if (showOnlyNewAlertsChanged || apiKeyChanged) {
        this.resetIncidentState()
      }

      // 应用主题设置
      if (config.appearance.theme === 'system') {
        nativeTheme.themeSource = 'system'
      } else {
        nativeTheme.themeSource = config.appearance.theme
      }

      // 获取当前是否为暗色主题
      const isDark = nativeTheme.shouldUseDarkColors
      const backgroundColor = isDark ? '#1a1a1a' : '#ffffff'
      
      // 更新背景色
      if (this.window) {
        this.window.setBackgroundColor(backgroundColor)
      }
      
      // 更新窗口大小
      if (this.window) {
        const { width, height } = config.appearance.windowSize
        this.window.setSize(width, height)
      }
      
      // 更新主题服务
      themeService.setTheme(config.appearance.theme)
      
      // 更新系统设置
      systemService.setConfig(config.system)
      
      // 更新缓存设置
      cacheService.setConfig(config.cache)

      // 更新日志设置
      logService.setConfig(config.log)
      
      // 保存配置
      this.store.set('config', config)
      this.startPolling()
      
      // 通知渲染进程
      this.window?.webContents.send('config-changed')
      this.window?.webContents.send('theme-changed', isDark)

      // 更新通知服务配置
      notificationService.setEnabled(config.notification?.enabled ?? true)
      notificationService.setSoundEnabled(config.notification?.sound ?? true)
      this.notificationWindow?.setConfig({
        criticalPersistent: config.notification?.criticalPersistent ?? true
      })

      return { success: true }
    })

    ipcMain.handle('config-changed', () => {
      // 立即重新获取告警
      this.fetchIncidents().then(incidents => {
        this.updateTrayIcon(incidents)
        this.window?.webContents.send('incidents-updated', incidents)
      })
    })

    ipcMain.handle('show-settings-window', () => {
      this.settingsWindow?.show()
    })

    ipcMain.handle('close-settings-window', () => {
      this.settingsWindow?.close()
    })

    ipcMain.handle('acknowledge-incident', async (event, incidentId) => {
      const config = this.store.get('config') as PagerDutyConfig
      try {
        const url = `https://api.pagerduty.com/incidents/${incidentId}`;
        const options = {
          method: 'PUT',
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
            'Authorization': `Token token=${config.apiKey}`
          },
          body: JSON.stringify({
            incident: {
              type: 'incident_reference',
              status: 'acknowledged'
            }
          })
        };

        const response = await fetch(url, options);

        if (!response.ok) {
          const errorData = await response.json();
          console.error('确认告警失败:', errorData);
          throw new Error(`Failed to acknowledge incident: ${errorData.message || response.statusText}`);
        }

        return { success: true }
      } catch (error: unknown) {
        if (error instanceof Error) {
          return { success: false, error: error.message }
        }
        return { success: false, error: 'An unknown error occurred' }
      }
    })

    ipcMain.handle('get-incident-details', async (event, incidentId) => {
        console.log('收到获取告警详情请求:', incidentId)
        const config = this.store.get('config') as PagerDutyConfig
        try {
            // 获取告警基本信息
            console.log('开始获取告警基本信息...')
            const incidentUrl = `https://api.pagerduty.com/incidents/${incidentId}`
            const incidentOptions = {
                method: 'GET',
                headers: {
                    'Accept': 'application/vnd.pagerduty+json;version=2',
                    'Content-Type': 'application/json',
                    'Authorization': `Token token=${config.apiKey}`
                }
            }

            const incidentResponse = await fetch(incidentUrl, incidentOptions)
            console.log('告警基本信息响应状态:', incidentResponse.status)

            if (!incidentResponse.ok) {
                const errorData = await incidentResponse.json()
                console.error('获取告警详情失败:', errorData)
                throw new Error(`Failed to fetch incident details: ${errorData.message || incidentResponse.statusText}`)
            }

            const incidentData = await incidentResponse.json()
            console.log('获取到告警基本信息')

            // 获取告警的最新告警信息
            console.log('开始获取最新告警信息...')
            const alertsUrl = `https://api.pagerduty.com/incidents/${incidentId}/alerts?limit=1&total=true&statuses[]=triggered&statuses[]=acknowledged`
            const alertsOptions = {
                method: 'GET',
                headers: {
                    'Accept': 'application/vnd.pagerduty+json;version=2',
                    'Content-Type': 'application/json',
                    'Authorization': `Token token=${config.apiKey}`
                }
            }

            const alertsResponse = await fetch(alertsUrl, alertsOptions)
            console.log('告警信息响应状态:', alertsResponse.status)

            if (!alertsResponse.ok) {
                const errorData = await alertsResponse.json()
                console.error('获取告警信息失败:', errorData)
                throw new Error(`Failed to fetch alert details: ${errorData.message || alertsResponse.statusText}`)
            }

            const alertsData = await alertsResponse.json()
            console.log('获取到最新告警信息')

            // 合并告警详情和自定义字段
            const result = {
                incident: incidentData.incident,
                alerts: alertsData.alerts,
                customDetails: incidentData.incident.body?.details || {},
                firstAlertDetails: alertsData.alerts?.[0]?.body?.details || {}
            }

            console.log('告警详情数据处理完成:', {
                incidentId,
                status: result.incident.status,
                hasCustomDetails: Object.keys(result.customDetails).length > 0,
                hasAlertDetails: Object.keys(result.firstAlertDetails).length > 0
            })

            return result
        } catch (error: unknown) {
            console.error('处理告警详情请求时出错:', error)
            if (error instanceof Error) {
                return { success: false, error: error.message }
            }
            return { success: false, error: 'An unknown error occurred' }
        }
    })

    ipcMain.handle('fetch-incidents', async () => {
      try {
        return await this.fetchIncidents()
      } catch (error) {
        console.error('获取告警失败:', error)
        return []
      }
    })

    ipcMain.handle('update-tray-icon', async (event, { incidents = [] }) => {
      try {
        this.updateTrayIcon(incidents)
      } catch (error) {
        console.error('更新托盘图标失败:', error)
      }
    })

    ipcMain.handle('test-proxy', async () => {
      return await systemService.checkProxyConnection()
    })

    ipcMain.handle('get-theme-mode', () => {
      return nativeTheme.shouldUseDarkColors
    })

    // 添加获取所有告警的处理器
    ipcMain.handle('get-all-incidents', () => {
      return this.window?.webContents.executeJavaScript('window.getAllIncidents()')
    })

    // 添加日志查看处理器
    ipcMain.handle('show-log-viewer', () => {
      console.log('显示日志查看器')
      LogViewerWindow.getInstance().show()
    })

    ipcMain.handle('get-logs', async (event, days: number = 1) => {
      console.log('获取日志内容, 天数:', days)
      try {
        return logService.getLogContent(days)
      } catch (error) {
        console.error('获取日志失败:', error)
        return '获取日志失败'
      }
    })
  }

  private async fetchIncidents(): Promise<Incident[]> {
    if (this.isFetching) {
      logService.info('[fetchIncidents] 已有请求正在进行，跳过本次请求')
      return this.lastValidIncidents
    }
    
    this.isFetching = true
    logService.info('[fetchIncidents] ========== 开始获取告警 ==========')
    
    try {
      const config = this.store.get('config') as PagerDutyConfig
      const { statusFilter, urgencyFilter, showOnlyNewAlerts } = config
      
      const params = new URLSearchParams()
      statusFilter.forEach(status => params.append('statuses[]', status))
      urgencyFilter.forEach(urgency => params.append('urgencies[]', urgency))
      
      if (showOnlyNewAlerts) {
        params.append('since', this.appStartTime)
        logService.info('[fetchIncidents] 启用只显示新告警', { since: this.appStartTime })
      }
      
      params.append('limit', '100')
      params.append('total', 'true')
      params.append('sort_by', 'created_at:desc')

      logService.info('[fetchIncidents] 发起 API 请求', { 
        params: params.toString(),
        filters: { statusFilter, urgencyFilter, showOnlyNewAlerts }
      })
      
      const response = await fetch(`https://api.pagerduty.com/incidents?${params.toString()}`, {
        headers: {
          'Accept': 'application/vnd.pagerduty+json;version=2',
          'Authorization': `Token token=${config.apiKey}`
        }
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()
      const incidents = data.incidents || []
      
      logService.info('[fetchIncidents] 获取告警成功', { 
        count: incidents.length,
        status: response.status
      })
      
      if (showOnlyNewAlerts) {
        const currentIds: Set<string> = new Set(incidents.map((inc: Incident) => inc.id))
        const newIncidents = incidents.filter((inc: Incident) => !this.lastIncidentIds.has(inc.id))
        
        if (newIncidents.length > 0) {
          logService.info('[fetchIncidents] 发现新告警', { 
            count: newIncidents.length,
            ids: newIncidents.map((incident: Incident) => incident.id)
          })
          
          this.updateTrayIcon(incidents, newIncidents)
          this.window?.webContents.send('incidents-updated', incidents)
          
          if (config.notification?.enabled) {
            newIncidents.forEach((inc: Incident) => {
              if (inc.urgency === 'high') {
                this.pendingNotifications.high++
              } else {
                this.pendingNotifications.low++
              }
            })

            if (!this.hasActiveNotification) {
              this.showPendingNotifications(config)
            }
          }
        } else {
          logService.info('[fetchIncidents] 没有新告警')
          this.updateTrayIcon(incidents)
        }
        
        this.lastIncidentIds = currentIds
      } else {
        logService.info('[fetchIncidents] 显示所有告警')
        this.updateTrayIcon(incidents)
      }

      this.lastCheckedTime = new Date().toISOString()
      this.lastValidIncidents = incidents
      return incidents
    } catch (error) {
      logService.error('[fetchIncidents] 获取告警失败', { error })
      return this.lastValidIncidents
    } finally {
      this.isFetching = false
      logService.info('[fetchIncidents] ========== 获取告警完成 ==========')
    }
  }

  private showPendingNotifications(config: PagerDutyConfig) {
    console.log('showPendingNotifications 被调用:', {
      notificationEnabled: config.notification?.enabled,
      pendingNotifications: this.pendingNotifications,
      hasActiveNotification: this.hasActiveNotification
    })

    if (!config.notification?.enabled) {
      console.log('通知功能已禁用')
      return
    }

    this.hasActiveNotification = true

    const showNotification = () => {
      console.log('准备显示通知:', {
        highCount: this.pendingNotifications.high,
        lowCount: this.pendingNotifications.low
      })

      if (this.pendingNotifications.high > 0) {
        console.log('显示高优先级通知')
        notificationService.showNotification({
          title: '新告警通知',
          body: `${this.pendingNotifications.high} 个高优先级告警`,
          urgency: 'high',
          onClick: () => {
            console.log('通知被点击，显示主窗口')
            this.window?.show()
          },
          onClose: () => {
            console.log('高优先级通知被关闭')
            this.pendingNotifications.high = 0
            if (this.pendingNotifications.low > 0) {
              console.log('显示低优先级通知')
              notificationService.showNotification({
                title: '新告警通知',
                body: `${this.pendingNotifications.low} 个低优先级告警`,
                urgency: 'low',
                onClick: () => {
                  this.window?.show()
                },
                onClose: () => {
                  console.log('低优先级通知被关闭')
                  this.pendingNotifications.low = 0
                  this.hasActiveNotification = false
                }
              })
            } else {
              console.log('没有更多通知，重置状态')
              this.hasActiveNotification = false
            }
          }
        })
      } else if (this.pendingNotifications.low > 0) {
        console.log('显示低优先级通知')
        notificationService.showNotification({
          title: '新告警通知',
          body: `${this.pendingNotifications.low} 个低优先级告警`,
          urgency: 'low',
          onClick: () => {
            this.window?.show()
          },
          onClose: () => {
            console.log('低优先级通知被关闭')
            this.pendingNotifications.low = 0
            this.hasActiveNotification = false
          }
        })
      } else {
        console.log('没有待显示的通知')
        this.hasActiveNotification = false
      }
    }

    showNotification()
  }

  private async startPolling() {
    const config = this.store.get('config') as PagerDutyConfig
    
    if (this.pollingTimer) {
      logService.info('[startPolling] 清理旧的轮询定时器')
      clearInterval(this.pollingTimer)
    }

    logService.info('[startPolling] 设置新的轮询定时器', { 
      interval: config.pollingInterval
    })
    
    this.pollingTimer = setInterval(async () => {
      try {
        await this.fetchIncidents()
      } catch (error) {
        logService.error('[startPolling] 定时获取告警失败', { error })
      }
    }, config.pollingInterval)

    try {
      logService.info('[startPolling] 执行首次告警获取')
      const incidents = await this.fetchIncidents()
      this.lastIncidentIds = new Set(incidents.map((inc: Incident) => inc.id))
      logService.info('[startPolling] 首次告警获取完成', { 
        incidentCount: incidents.length,
        knownIds: Array.from(this.lastIncidentIds)
      })
    } catch (error) {
      logService.error('[startPolling] 首次告警获取失败', { error })
    }
  }

  private updateTrayIcon(incidents: Incident[], newIncidents: Incident[] = []) {
    console.log('========== 图标状态更新开始 ==========')
    const config = this.store.get('config') as PagerDutyConfig
    console.log('配置信息:', {
      statusFilter: config.statusFilter,
      urgencyFilter: config.urgencyFilter,
      showOnlyNewAlerts: config.showOnlyNewAlerts
    })

    console.log('告警数据:', incidents.map(inc => ({
      id: inc.id,
      status: inc.status,
      title: inc.title,
      created_at: inc.created_at
    })))

    const filteredIncidents = incidents.filter(inc => 
      config.statusFilter.includes(inc.status) &&
      config.urgencyFilter.includes(inc.urgency)
    )

    console.log('状态过滤后的告警:', filteredIncidents.map(inc => ({
      id: inc.id,
      status: inc.status,
      title: inc.title,
      created_at: inc.created_at
    })))

    const statusCounts = {
      triggered: filteredIncidents.filter(inc => inc.status === 'triggered').length,
      acknowledged: filteredIncidents.filter(inc => inc.status === 'acknowledged').length,
      resolved: filteredIncidents.filter(inc => inc.status === 'resolved').length
    }

    const hasTriggeredIncidents = statusCounts.triggered > 0
    const hasAcknowledgedIncidents = statusCounts.acknowledged > 0

    console.log('图标状态判断:', {
      hasTriggeredIncidents,
      hasAcknowledgedIncidents,
      filteredIncidentsCount: filteredIncidents.length,
      statusCounts
    })

    let iconName: string
    let reason: string
    if (hasTriggeredIncidents) {
      iconName = 'tray-icon-active.png'
      reason = '有待处理告警'
    } else if (filteredIncidents.length === 0) {
      iconName = 'tray-icon.png'
      reason = '无活动告警'
    } else {
      iconName = 'tray-icon-all-ack.png'
      reason = '所有告警已确认'
    }

    console.log('图标选择结果:', { iconName, reason })

    const iconPath = this.getIconPath(iconName)
    if (iconPath) {
      this.tray?.setImage(iconPath)
      console.log('图标路径:', iconPath)
    }

    if (this.tray) {
      this.tray.setToolTip(`PagerDuty Alert\n${filteredIncidents.length} 个告警`)
    }

    console.log('图标更新完成')
    console.log('========== 图标状态更新结束 ==========')
  }
}