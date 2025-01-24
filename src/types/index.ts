export interface Incident {
  id: string
  title: string
  description: string
  status: 'triggered' | 'acknowledged' | 'resolved'
  urgency: 'high' | 'low'
  created_at: string
  html_url: string
  service: {
    name: string
  }
  details?: string;
  custom_fields?: Array<{
    id: string
    type: string
    name: string
    display_name: string
    description: string
    data_type: string
    field_type: string
    value?: string
  }>;
}

export interface PagerDutyConfig {
  apiKey: string
  pollingInterval: number
  urgencyFilter: ('high' | 'low')[]
  statusFilter: ('triggered' | 'acknowledged' | 'resolved')[]
  showOnlyNewAlerts: boolean
  lastCheckedTime: string
  notification: {
    enabled: boolean
    sound: boolean
    grouping: boolean
    criticalPersistent: boolean
    clickToShow: boolean
  }
  appearance: {
    theme: 'system' | 'light' | 'dark'
    windowSize: {
      width: number
      height: number
    }
  }
  system: {
    autoLaunch: boolean
    proxy?: {
      enabled: boolean
      server: string
      bypass?: string
    }
  }
  cache: {
    enabled: boolean
    maxAge: number // 缓存过期时间（毫秒）
    maxItems: number // 最大缓存条目数
  }
}

export type Theme = 'system' | 'light' | 'dark'

// 本地缓存的告警数据结构
export interface CachedIncident extends Incident {
  cachedAt: number
  expiresAt: number
}

export interface IncidentsResponse {
  incidents: Incident[]
} 