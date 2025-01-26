import { BrowserWindow, screen, ipcMain } from 'electron'
import * as path from 'path'

interface NotificationData {
  id: string
  title: string
  body: string
  urgency: 'high' | 'low'
  isPersistent?: boolean
}

export class NotificationWindow {
  private static instance: NotificationWindow | null = null
  private window: BrowserWindow | null = null
  private queue: NotificationData[] = []
  private isShowing = false
  private config = {
    criticalPersistent: false
  }

  private constructor() {
    // 监听关闭通知的请求
    ipcMain.handle('close-notification', () => {
      console.log('收到关闭通知请求')
      this.window?.close()
      this.window = null
      this.queue.shift()
      this.isShowing = false
      this.processQueue()
    })
  }

  public static getInstance(): NotificationWindow {
    if (!NotificationWindow.instance) {
      NotificationWindow.instance = new NotificationWindow()
    }
    return NotificationWindow.instance
  }

  public setConfig(config: { criticalPersistent: boolean }) {
    this.config = config
  }

  public show(data: Omit<NotificationData, 'id' | 'isPersistent'>) {
    console.log('NotificationWindow.show:', data)
    const id = Math.random().toString(36).substr(2, 9)
    const isPersistent = data.urgency === 'high' && this.config.criticalPersistent
    
    console.log('添加通知到队列:', { id, isPersistent })
    this.queue.push({ ...data, id, isPersistent })
    this.processQueue()
  }

  private async processQueue() {
    console.log('处理通知队列:', { 
      isShowing: this.isShowing, 
      queueLength: this.queue.length 
    })
    
    if (this.isShowing || this.queue.length === 0) return

    const notification = this.queue[0]
    this.isShowing = true

    console.log('显示通知:', notification)
    await this.createWindow(notification)

    // 如果不是持续显示的通知，5秒后自动关闭
    if (!notification.isPersistent) {
      console.log('设置自动关闭定时器')
      setTimeout(() => {
        if (this.window) {
          console.log('自动关闭通知')
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
      this.window?.webContents.send('notification-data', data)
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