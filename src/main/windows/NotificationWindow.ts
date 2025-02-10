import { BrowserWindow, screen, ipcMain } from 'electron'
import * as path from 'path'

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
    console.log('NotificationWindow 初始化')
    // 监听关闭通知的请求
    ipcMain.handle('close-notification', () => {
      console.log('收到关闭通知请求')
      const currentNotification = this.queue[0]
      if (currentNotification?.onClose) {
        console.log('执行通知关闭回调')
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
      console.log('收到点击通知请求')
      const currentNotification = this.queue[0]
      if (currentNotification?.onClick) {
        console.log('执行通知点击回调')
        currentNotification.onClick()
      }
    })
  }

  public static getInstance(): NotificationWindow {
    if (!NotificationWindow.instance) {
      console.log('创建 NotificationWindow 实例')
      NotificationWindow.instance = new NotificationWindow()
    }
    return NotificationWindow.instance
  }

  public setConfig(config: { criticalPersistent: boolean }) {
    console.log('NotificationWindow.setConfig 被调用:', {
      currentConfig: this.config,
      newConfig: config,
      configType: typeof config,
      configKeys: Object.keys(config),
      criticalPersistentType: typeof config.criticalPersistent,
      criticalPersistentValue: config.criticalPersistent
    })
    
    if (typeof config.criticalPersistent !== 'boolean') {
      console.warn('警告: criticalPersistent 不是布尔值:', config.criticalPersistent)
    }
    
    this.config = config
  }

  public show(data: Omit<NotificationData, 'id'>) {
    console.log('NotificationWindow.show 被调用:', {
      data,
      currentConfig: this.config,
      currentQueue: this.queue,
      isShowing: this.isShowing
    })
    
    const id = Math.random().toString(36).substr(2, 9)
    const isPersistent = data.urgency === 'high' && this.config.criticalPersistent
    
    console.log('通知持久化状态:', {
      urgency: data.urgency,
      criticalPersistent: this.config.criticalPersistent,
      isPersistent
    })
    
    console.log('添加通知到队列:', { id, isPersistent, data })
    this.queue.push({ ...data, id, isPersistent })
    this.processQueue()
  }

  private async processQueue() {
    console.log('处理通知队列:', { 
      isShowing: this.isShowing, 
      queueLength: this.queue.length,
      currentQueue: this.queue
    })
    
    if (this.isShowing || this.queue.length === 0) {
      console.log('跳过队列处理:', {
        reason: this.isShowing ? '当前有通知显示' : '队列为空'
      })
      return
    }

    const notification = this.queue[0]
    this.isShowing = true

    console.log('准备显示通知:', notification)
    await this.createWindow(notification)

    // 如果不是持续显示的通知，5秒后自动关闭
    if (!notification.isPersistent) {
      console.log('设置自动关闭定时器')
      setTimeout(() => {
        if (this.window) {
          console.log('自动关闭通知')
          if (notification.onClose) {
            console.log('执行通知关闭回调')
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
    console.log('创建通知窗口:', data)
    const { width: screenWidth } = screen.getPrimaryDisplay().workAreaSize
    
    const isDev = process.env.NODE_ENV === 'development'
    const preloadPath = isDev
      ? path.join(process.cwd(), 'dist', 'preload.js')
      : path.join(path.dirname(process.execPath), '../Resources/app.asar/dist/preload.js')

    console.log('preload路径:', preloadPath)
    
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

    console.log('加载通知页面:', htmlPath)
    this.window.loadFile(htmlPath)
    
    // 等待页面加载完成后发送数据
    this.window.webContents.on('did-finish-load', () => {
      console.log('通知页面加载完成，发送数据')
      // 创建一个新的对象，只包含可序列化的数据
      const serializableData = {
        id: data.id,
        title: data.title,
        body: data.body,
        urgency: data.urgency,
        isPersistent: data.isPersistent
      }
      console.log('发送序列化后的通知数据:', serializableData)
      this.window?.webContents.send('notification-data', serializableData)
    })

    // 添加错误处理
    this.window.webContents.on('did-fail-load', (event, errorCode, errorDescription) => {
      console.error('通知页面加载失败:', {
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