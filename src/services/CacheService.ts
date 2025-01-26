import Store from 'electron-store'
import type { Incident, CachedIncident, PagerDutyConfig } from '../types'

class CacheService {
  private store: Store
  private cache: Map<string, CachedIncident> = new Map()
  private config: PagerDutyConfig['cache']

  constructor() {
    this.store = new Store()
    this.config = this.store.get('config.cache') as PagerDutyConfig['cache'] || {
      enabled: true,
      maxAge: 24 * 60 * 60 * 1000, // 24小时
      maxItems: 1000
    }
    this.loadCache()
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