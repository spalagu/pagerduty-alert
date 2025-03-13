import { BrowserWindow, screen, ipcMain } from 'electron'
import * as path from 'path'
import { logService } from '../../services/LogService'

interface NotificationData {
  id: string
  title: string
  body: string
  urgency: 'high' | 'low'
  isPersistent?: boolean
  onClick?: () => void
  onClose?: () => void
}

interface PendingNotifications {
  high: NotificationData[]
  low: NotificationData[]
}

export class NotificationWindow {
  private static instance: NotificationWindow | null = null
  private window: BrowserWindow | null = null
  private queue: NotificationData[] = []
  private pendingNotifications: PendingNotifications = {
    high: [],
    low: []
  }
  private isShowing = false
  private config = {
    criticalPersistent: true
  }

  private constructor() {
    logService.info('NotificationWindow 初始化')
    // 监听关闭通知的请求
    ipcMain.handle('close-notification', () => {
      logService.info('收到关闭通知请求')
      const currentNotification = this.queue[0]
      if (currentNotification?.onClose) {
        logService.info('执行通知关闭回调')
        currentNotification.onClose()
      }
      this.window?.close()
      this.window = null
      this.queue.shift()
      this.isShowing = false

      // 处理待显示的通知
      this.processPendingNotifications()
      this.processQueue()
    })

    // 监听点击通知的请求
    ipcMain.handle('click-notification', () => {
      logService.info('收到点击通知请求')
      const currentNotification = this.queue[0]
      if (currentNotification?.onClick) {
        logService.info('执行通知点击回调')
        currentNotification.onClick()
      }
    })
  }

  public static getInstance(): NotificationWindow {
    if (!NotificationWindow.instance) {
      logService.info('创建 NotificationWindow 实例')
      NotificationWindow.instance = new NotificationWindow()
    }
    return NotificationWindow.instance
  }

  public setConfig(config: { criticalPersistent: boolean }) {
    logService.info('NotificationWindow.setConfig 被调用', {
      currentConfig: this.config,
      newConfig: config,
      configType: typeof config,
      configKeys: Object.keys(config),
      criticalPersistentType: typeof config.criticalPersistent,
      criticalPersistentValue: config.criticalPersistent
    })
    
    if (typeof config.criticalPersistent !== 'boolean') {
      logService.warn('警告: criticalPersistent 不是布尔值', config.criticalPersistent)
    }
    
    this.config = config
  }

  private processPendingNotifications() {
    const { high, low } = this.pendingNotifications
    if (high.length > 0 || low.length > 0) {
      logService.info('处理待显示的通知', {
        highCount: high.length,
        lowCount: low.length
      })

      // 清空待显示通知
      this.pendingNotifications = { high: [], low: [] }

      // 添加高优先级分组通知
      if (high.length > 0) {
        this.queue.push({
          id: Math.random().toString(36).substr(2, 9),
          title: '新告警通知',
          body: `${high.length} 个高优先级告警`,
          urgency: 'high',
          isPersistent: this.config.criticalPersistent,
          onClick: high[0].onClick,
          onClose: high[0].onClose
        })
      }

      // 添加低优先级分组通知
      if (low.length > 0) {
        this.queue.push({
          id: Math.random().toString(36).substr(2, 9),
          title: '新告警通知',
          body: `${low.length} 个低优先级告警`,
          urgency: 'low',
          isPersistent: false,
          onClick: low[0].onClick,
          onClose: low[0].onClose
        })
      }
    }
  }

  public show(data: Omit<NotificationData, 'id'>) {
    logService.info('NotificationWindow.show 被调用', {
      data,
      currentConfig: this.config,
      currentQueue: this.queue,
      isShowing: this.isShowing
    })
    
    const id = Math.random().toString(36).substr(2, 9)
    const isPersistent = data.urgency === 'high' && this.config.criticalPersistent
    const notification = { ...data, id, isPersistent }

    // 如果当前有通知显示，将新通知加入待显示队列
    if (this.isShowing) {
      logService.info('当前有通知显示，加入待显示队列', {
        urgency: data.urgency
      })
      this.pendingNotifications[data.urgency].push(notification)
      return
    }

    // 否则直接显示
    logService.info('直接显示通知', notification)
    this.queue.push(notification)
    this.processQueue()
  }

  private async processQueue() {
    logService.info('处理通知队列', { 
      isShowing: this.isShowing, 
      queueLength: this.queue.length,
      currentQueue: this.queue
    })
    
    if (this.isShowing || this.queue.length === 0) {
      logService.info('跳过队列处理', {
        reason: this.isShowing ? '当前有通知显示' : '队列为空'
      })
      return
    }

    const notification = this.queue[0]
    this.isShowing = true

    logService.info('准备显示通知', notification)
    await this.createWindow(notification)

    // 如果不是持续显示的通知，5秒后自动关闭
    if (!notification.isPersistent) {
      logService.info('设置自动关闭定时器')
      setTimeout(() => {
        if (this.window) {
          logService.info('自动关闭通知')
          if (notification.onClose) {
            logService.info('执行通知关闭回调')
            notification.onClose()
          }
          this.window.close()
          this.window = null
          this.queue.shift()
          this.isShowing = false
          this.processQueue()
        }
      }, 5000)
    }
  }

  private createWindow(data: NotificationData) {
    logService.info('创建通知窗口', data)
    const { width: screenWidth } = screen.getPrimaryDisplay().workAreaSize
    
    const isDev = process.env.NODE_ENV === 'development'
    const preloadPath = isDev
      ? path.join(process.cwd(), 'dist', 'preload.js')
      : path.join(path.dirname(process.execPath), '../Resources/app.asar/dist/preload.js')

    logService.info('preload路径', { preloadPath })
    
    this.window = new BrowserWindow({
      width: 300,
      height: 100,
      x: screenWidth - 320,
      y: 20,
      frame: false,
      transparent: true,
      resizable: false,
      skipTaskbar: true,
      alwaysOnTop: true,
      focusable: false,
      show: false,
      webPreferences: {
        nodeIntegration: false,
        contextIsolation: true,
        preload: preloadPath
      }
    })

    const htmlPath = isDev
      ? path.join(process.cwd(), 'dist', 'notification.html')
      : path.join(path.dirname(process.execPath), '../Resources/app.asar/dist/notification.html')

    logService.info('加载通知页面', { htmlPath })
    this.window.loadFile(htmlPath)
    
    // 等待页面加载完成后发送数据并显示窗口
    this.window.webContents.on('did-finish-load', () => {
      logService.info('通知页面加载完成，发送数据')
      // 创建一个新的对象，只包含可序列化的数据
      const serializableData = {
        id: data.id,
        title: data.title,
        body: data.body,
        urgency: data.urgency,
        isPersistent: data.isPersistent
      }
      logService.info('发送序列化后的通知数据', serializableData)
      this.window?.webContents.send('notification-data', serializableData)
      
      // 使用showInactive方法显示窗口，不激活/聚焦它
      this.window?.showInactive()
    })

    // 添加错误处理
    this.window.webContents.on('did-fail-load', (event, errorCode, errorDescription) => {
      logService.error('通知页面加载失败', {
        errorCode,
        errorDescription
      })
    })

    // 开发环境下打开开发者工具
    if (isDev) {
      this.window.webContents.openDevTools({ mode: 'detach' })
    }
  }
} 