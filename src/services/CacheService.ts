import Store from 'electron-store'
import type { Incident, CachedIncident, PagerDutyConfig } from '../types'
import { DEFAULT_CACHE_CONFIG } from '../config/defaults'

export class CacheService {
  private store!: Store
  private cache: Map<string, CachedIncident> = new Map()
  private config: PagerDutyConfig['cache'] = DEFAULT_CACHE_CONFIG

  constructor() {
    console.log('CacheService 初始化开始')
    try {
      this.store = new Store({
        name: 'cache',
        defaults: {
          incidents: [],
          config: DEFAULT_CACHE_CONFIG
        }
      })
      
      this.loadConfig()
      this.loadCache()
      
      console.log('CacheService 初始化成功:', {
        config: this.config,
        incidentsCount: this.store.get('incidents')?.length || 0
      })
    } catch (error) {
      console.error('CacheService 初始化失败:', error)
    }
  }

  private loadConfig() {
    const savedConfig = this.store.get('config')
    this.config = { ...DEFAULT_CACHE_CONFIG, ...savedConfig }
  }

  public setConfig(config: PagerDutyConfig['cache']) {
    if (!config) return
    this.config = { ...DEFAULT_CACHE_CONFIG, ...config }
    this.store.set('config', this.config)
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