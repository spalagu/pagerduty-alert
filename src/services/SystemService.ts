import { app, session } from 'electron'
import Store from 'electron-store'
import type { PagerDutyConfig } from '../types'

class SystemService {
  private store: Store
  private config: PagerDutyConfig['system']

  constructor() {
    this.store = new Store()
    this.config = this.store.get('config.system') as PagerDutyConfig['system'] || {
      autoLaunch: false,
      proxy: {
        enabled: false,
        server: '',
        bypass: '<local>'
      }
    }
    if (app.isReady()) {
      this.init()
    } else {
      app.whenReady().then(() => this.init())
    }
  }

  private init() {
    this.updateAutoLaunch()
    this.updateProxy()
  }

  public setConfig(config: PagerDutyConfig['system']) {
    this.config = config
    this.updateAutoLaunch()
    this.updateProxy()
  }

  private updateAutoLaunch() {
    app.setLoginItemSettings({
      openAtLogin: this.config.autoLaunch,
      path: app.getPath('exe')
    })
  }

  private async updateProxy() {
    try {
      if (this.config.proxy?.enabled && this.config.proxy.server) {
        await session.defaultSession.setProxy({
          proxyRules: this.config.proxy.server,
          proxyBypassRules: this.config.proxy.bypass
        })
      } else {
        await session.defaultSession.setProxy({
          proxyRules: '',
          proxyBypassRules: ''
        })
      }
    } catch (error) {
      console.error('设置代理失败:', error)
    }
  }

  public async checkProxyConnection(): Promise<boolean> {
    if (!this.config.proxy?.enabled) return true

    try {
      const response = await fetch('https://api.pagerduty.com/ping', {
        method: 'GET'
      })
      return response.ok
    } catch (error) {
      console.error('代理连接测试失败:', error)
      return false
    }
  }
}

export const systemService = new SystemService() 