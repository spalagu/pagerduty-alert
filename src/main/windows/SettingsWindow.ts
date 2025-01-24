import { BrowserWindow, nativeTheme, app } from 'electron'
import * as path from 'path'

export class SettingsWindow {
  private window: BrowserWindow | null = null

  constructor() {}

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
    console.log('加载设置页面:', htmlPath, '是否开发环境:', isDev)
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
      console.log('设置页面加载完成')
    })

    // 监听页面加载失败事件
    this.window.webContents.on('did-fail-load', (event, errorCode, errorDescription) => {
      console.error('设置页面加载失败:', errorCode, errorDescription)
    })

    this.window.once('ready-to-show', () => {
      this.window?.show()
    })
  }

  public show() {
    if (!this.window) {
      this.createWindow()
    } else {
      this.window.show()
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
} 