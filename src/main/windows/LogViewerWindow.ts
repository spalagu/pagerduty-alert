import { BrowserWindow, app } from 'electron'
import * as path from 'path'
import { logService } from '../../services/LogService'

export class LogViewerWindow {
  private static instance: LogViewerWindow | null = null
  private window: BrowserWindow | null = null

  private constructor() {}

  public static getInstance(): LogViewerWindow {
    if (!LogViewerWindow.instance) {
      LogViewerWindow.instance = new LogViewerWindow()
    }
    return LogViewerWindow.instance
  }

  public show() {
    if (this.window) {
      this.window.show()
      return
    }

    const isDev = process.env.NODE_ENV === 'development'
    
    this.window = new BrowserWindow({
      width: 800,
      height: 600,
      show: false,
      webPreferences: {
        nodeIntegration: false,
        contextIsolation: true,
        preload: isDev
          ? path.join(process.cwd(), 'dist', 'preload.js')
          : path.join(app.getAppPath(), 'dist', 'preload.js')
      },
      resizable: true,
      maximizable: true,
      minimizable: true,
      title: '日志查看'
    })

    const htmlPath = isDev
      ? path.join(process.cwd(), 'dist', 'logviewer.html')
      : path.join(app.getAppPath(), 'dist', 'logviewer.html')

    logService.info('加载日志查看页面', { htmlPath })
    this.window.loadFile(htmlPath)

    if (isDev) {
      this.window.webContents.openDevTools()
    }

    this.window.once('ready-to-show', () => {
      this.window?.show()
    })

    this.window.on('closed', () => {
      this.window = null
    })
  }

  public close() {
    if (this.window) {
      this.window.close()
      this.window = null
    }
  }
} 