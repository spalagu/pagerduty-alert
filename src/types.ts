export type Theme = 'light' | 'dark' | 'system'

export interface PagerDutyConfig {
  apiKey: string
  pollingInterval: number
  urgencyFilter: ('high' | 'low')[]
  statusFilter: ('triggered' | 'acknowledged' | 'resolved')[]
  showOnlyNewAlerts: boolean
  lastCheckedTime: string
  knownIncidentIds?: string[]
  notification: {
    enabled: boolean
    sound: boolean
    grouping: boolean
    criticalPersistent: boolean
    clickToShow: boolean
  }
  appearance: {
    theme: Theme
    windowSize: {
      width: number
      height: number
    }
  }
  system: {
    autoLaunch: boolean
    proxy: {
      enabled: boolean
      server: string
      bypass: string
    }
  }
  cache: {
    enabled: boolean
    maxAge: number
    maxItems: number
  }
}

export interface Incident {
  id: string
  title: string
  description?: string
  details?: any
  html_url: string
  custom_fields?: Array<{
    id: string
    display_name: string
    value: string
  }>
  status: 'triggered' | 'acknowledged' | 'resolved'
  urgency: 'high' | 'low'
  created_at: string
  service: {
    name: string
  }
}

export interface CachedIncident extends Incident {
  cached_at: string
  expires_at: string
} 