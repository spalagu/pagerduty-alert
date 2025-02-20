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

export class NotificationWindow {
  private static instance: NotificationWindow | null = null
  private window: BrowserWindow | null = null
  private queue: NotificationData[] = []
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

  public show(data: Omit<NotificationData, 'id'>) {
    logService.info('NotificationWindow.show 被调用', {
      data,
      currentConfig: this.config,
      currentQueue: this.queue,
      isShowing: this.isShowing
    })
    
    const id = Math.random().toString(36).substr(2, 9)
    const isPersistent = data.urgency === 'high' && this.config.criticalPersistent
    
    logService.info('通知持久化状态', {
      urgency: data.urgency,
      criticalPersistent: this.config.criticalPersistent,
      isPersistent
    })
    
    logService.info('添加通知到队列', { id, isPersistent, data })
    this.queue.push({ ...data, id, isPersistent })
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
    
    // 等待页面加载完成后发送数据
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