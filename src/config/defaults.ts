import type { PagerDutyConfig } from '../types'

export const DEFAULT_NOTIFICATION_CONFIG: PagerDutyConfig['notification'] = {
  enabled: true,
  sound: true,
  grouping: true,
  criticalPersistent: true,
  clickToShow: true
}

export const DEFAULT_APPEARANCE_CONFIG: PagerDutyConfig['appearance'] = {
  theme: 'system',
  windowSize: {
    width: 400,
    height: 600
  }
}

export const DEFAULT_SYSTEM_CONFIG: PagerDutyConfig['system'] = {
  autoLaunch: false,
  proxy: {
    enabled: false,
    server: '',
    bypass: '<local>'
  }
}

export const DEFAULT_CACHE_CONFIG: PagerDutyConfig['cache'] = {
  enabled: true,
  maxAge: 24 * 60 * 60 * 1000,
  maxItems: 1000
}

export const DEFAULT_CONFIG: PagerDutyConfig = {
  apiKey: '',
  pollingInterval: 30000,
  urgencyFilter: ['high'],
  statusFilter: ['triggered', 'acknowledged'],
  showOnlyNewAlerts: false,
  lastCheckedTime: new Date().toISOString(),
  notification: DEFAULT_NOTIFICATION_CONFIG,
  appearance: DEFAULT_APPEARANCE_CONFIG,
  system: DEFAULT_SYSTEM_CONFIG,
  cache: DEFAULT_CACHE_CONFIG
} 