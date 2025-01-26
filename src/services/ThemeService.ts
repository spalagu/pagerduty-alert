import { nativeTheme } from 'electron'
import type { Theme } from '../types'

class ThemeService {
  private currentTheme: Theme = 'system'
  private callbacks: Set<(theme: 'light' | 'dark') => void> = new Set()

  constructor() {
    // 监听系统主题变化
    nativeTheme.on('updated', () => {
      if (this.currentTheme === 'system') {
        this.notifyThemeChange()
      }
    })
  }

  public setTheme(theme: Theme) {
    this.currentTheme = theme
    this.notifyThemeChange()
  }

  public getCurrentTheme(): 'light' | 'dark' {
    if (this.currentTheme === 'system') {
      return nativeTheme.shouldUseDarkColors ? 'dark' : 'light'
    }
    return this.currentTheme
  }

  public onThemeChange(callback: (theme: 'light' | 'dark') => void) {
    this.callbacks.add(callback)
    // 立即触发一次回调，同步当前主题
    callback(this.getCurrentTheme())
    return () => this.callbacks.delete(callback)
  }

  private notifyThemeChange() {
    const theme = this.getCurrentTheme()
    this.callbacks.forEach(callback => callback(theme))
  }
}

export const themeService = new ThemeService() 