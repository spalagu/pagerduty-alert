import Store from 'electron-store'
import type { Incident, CachedIncident, PagerDutyConfig } from '../types'

class CacheService {
  private store: Store
  private cache: Map<string, CachedIncident> = new Map()
  private config: PagerDutyConfig['cache'] = {
    enabled: true,
    maxAge: 24 * 60 * 60 * 1000, // 24 hours
    maxItems: 1000
  }

  constructor() {
    console.log('CacheService 初始化开始')
    try {
      // 创建 store 实例时进行错误处理
      this.store = new Store({
        name: 'cache',
        defaults: {
          incidents: [],
          config: this.config
        },
        clearInvalidConfig: true // 自动清理无效的配置
      })
      
      // 验证并修复配置
      this.validateAndRepairStore()
      
      // 加载配置
      const savedConfig = this.store.get('config') as PagerDutyConfig['cache']
      if (savedConfig) {
        this.config = { ...this.config, ...savedConfig }
      }
      
      console.log('CacheService 初始化成功:', {
        config: this.config,
        incidentsCount: this.store.get('incidents')?.length || 0
      })
    } catch (error) {
      console.error('CacheService 初始化失败:', error)
      // 如果初始化失败，使用默认配置继续运行
      this.store = new Store({
        name: 'cache',
        defaults: {
          incidents: [],
          config: this.config
        }
      })
    }
    this.loadCache()
  }

  private validateAndRepairStore() {
    console.log('验证并修复存储...')
    try {
      // 验证 incidents 数组
      const incidents = this.store.get('incidents')
      if (!Array.isArray(incidents)) {
        console.log('incidents 不是数组，重置为空数组')
        this.store.set('incidents', [])
      }

      // 验证配置对象
      const config = this.store.get('config')
      if (!config || typeof config !== 'object') {
        console.log('config 无效，使用默认配置')
        this.store.set('config', this.config)
      }
    } catch (error) {
      console.error('存储验证/修复失败:', error)
      // 重置为默认值
      this.store.clear()
      this.store.set('incidents', [])
      this.store.set('config', this.config)
    }
  }

  public setConfig(config: PagerDutyConfig['cache']) {
    this.config = config
    this.cleanExpiredCache()
  }

  public cacheIncidents(incidents: Incident[]) {
    if (!this.config.enabled) return

    const now = Date.now()
    incidents.forEach(incident => {
      const cachedIncident: CachedIncident = {
        ...incident,
        cached_at: new Date(now).toISOString(),
        expires_at: new Date(now + this.config.maxAge).toISOString()
      }
      this.cache.set(incident.id, cachedIncident)
    })

    this.cleanExpiredCache()
    this.saveCache()
  }

  public getCachedIncidents(): CachedIncident[] {
    if (!this.config.enabled) return []
    
    this.cleanExpiredCache()
    return Array.from(this.cache.values())
  }

  public clearCache() {
    this.cache.clear()
    this.saveCache()
  }

  private cleanExpiredCache() {
    const now = Date.now()
    
    // 清理过期缓存
    for (const [id, incident] of this.cache) {
      if (new Date(incident.expires_at).getTime() < now) {
        this.cache.delete(id)
      }
    }

    // 如果缓存项超过最大数量，删除最旧的
    if (this.cache.size > this.config.maxItems) {
      const sortedIncidents = Array.from(this.cache.entries())
        .sort(([, a], [, b]) => new Date(a.cached_at).getTime() - new Date(b.cached_at).getTime())
      
      const toDelete = sortedIncidents.slice(0, this.cache.size - this.config.maxItems)
      toDelete.forEach(([id]) => this.cache.delete(id))
    }
  }

  private loadCache() {
    try {
      const cached = this.store.get('incidentCache') as CachedIncident[] || []
      cached.forEach(incident => {
        this.cache.set(incident.id, incident)
      })
      this.cleanExpiredCache()
    } catch (error) {
      console.error('加载缓存失败:', error)
      this.cache.clear()
    }
  }

  private saveCache() {
    try {
      this.store.set('incidentCache', Array.from(this.cache.values()))
    } catch (error) {
      console.error('保存缓存失败:', error)
    }
  }
}

export const cacheService = new CacheService() 