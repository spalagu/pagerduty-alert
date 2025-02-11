import { app, session } from 'electron'
import Store from 'electron-store'
import type { PagerDutyConfig } from '../types'
import { DEFAULT_SYSTEM_CONFIG } from '../config/defaults'

export class SystemService {
  private store!: Store
  private config: PagerDutyConfig['system'] = DEFAULT_SYSTEM_CONFIG

  constructor() {
    console.log('SystemService 初始化开始')
    try {
      this.store = new Store({
        name: 'system',
        defaults: {
          config: DEFAULT_SYSTEM_CONFIG
        }
      })

      this.loadConfig()
      console.log('SystemService 初始化成功:', {
        config: this.config
      })
    } catch (error) {
      console.error('SystemService 初始化失败:', error)
    }

    if (app.isReady()) {
      this.init()
    } else {
      app.whenReady().then(() => this.init())
    }
  }

  private loadConfig() {
    const savedConfig = this.store.get('config')
    this.config = { ...DEFAULT_SYSTEM_CONFIG, ...savedConfig }
  }

  public setConfig(config: PagerDutyConfig['system']) {
    if (!config) return
    this.config = { ...DEFAULT_SYSTEM_CONFIG, ...config }
    this.store.set('config', this.config)
    this.updateAutoLaunch()
    this.updateProxy()
  }

  private init() {
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