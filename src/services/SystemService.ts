import { app, session } from 'electron'
import Store from 'electron-store'
import type { PagerDutyConfig } from '../types'

class SystemService {
  private store: Store
  private config: PagerDutyConfig['system'] = {
    autoLaunch: false,
    proxy: {
      enabled: false,
      server: '',
      bypass: '<local>'
    }
  }

  constructor() {
    console.log('SystemService 初始化开始')
    try {
      this.store = new Store({
        name: 'system',
        defaults: {
          config: this.config
        },
        clearInvalidConfig: true
      })

      // 验证并修复配置
      this.validateAndRepairStore()

      // 加载配置
      const savedConfig = this.store.get('config') as PagerDutyConfig['system']
      if (savedConfig) {
        this.config = { ...this.config, ...savedConfig }
      }

      console.log('SystemService 初始化成功:', {
        config: this.config
      })
    } catch (error) {
      console.error('SystemService 初始化失败:', error)
      // 如果初始化失败，使用默认配置继续运行
      this.store = new Store({
        name: 'system',
        defaults: {
          config: this.config
        }
      })
    }

    if (app.isReady()) {
      this.init()
    } else {
      app.whenReady().then(() => this.init())
    }
  }

  private validateAndRepairStore() {
    console.log('验证并修复系统配置...')
    try {
      const config = this.store.get('config')
      if (!config || typeof config !== 'object') {
        console.log('系统配置无效，使用默认配置')
        this.store.set('config', this.config)
      }

      // 验证代理配置
      const proxy = config?.proxy
      if (!proxy || typeof proxy !== 'object') {
        console.log('代理配置无效，使用默认配置')
        this.store.set('config.proxy', this.config.proxy)
      }
    } catch (error) {
      console.error('系统配置验证/修复失败:', error)
      // 重置为默认值
      this.store.clear()
      this.store.set('config', this.config)
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