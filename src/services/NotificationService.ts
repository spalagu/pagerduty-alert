import { NotificationWindow } from '../main/windows/NotificationWindow'

interface NotificationOptions {
  title: string
  body: string
  silent?: boolean
  urgency?: 'high' | 'low'
  onClick?: () => void
}

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
  details: any
  custom_fields: {
    name: string
    value: string
  }[]
}

export interface CachedIncident extends Incident {
  cached_at: string
  expires_at: string
}

class NotificationService {
  private notificationWindow: NotificationWindow
  private isEnabled: boolean = true
  private isSoundEnabled: boolean = true

  constructor() {
    this.notificationWindow = NotificationWindow.getInstance()
  }

  public setEnabled(enabled: boolean) {
    this.isEnabled = enabled
  }

  public setSoundEnabled(enabled: boolean) {
    this.isSoundEnabled = enabled
  }

  public showNotification(options: NotificationOptions) {
    console.log('NotificationService.showNotification:', options)
    
    if (!this.isEnabled) {
      console.log('通知服务已禁用')
      return
    }

    const { title, body, urgency = 'low' } = options
    console.log('显示通知:', { title, body, urgency })

    // 显示通知窗口
    this.notificationWindow.show({
      title,
      body,
      urgency
    })
  }

  public showIncidentNotification(incident: any, onClick?: () => void) {
    const urgency = incident.urgency === 'high' ? 'high' : 'low'
    const title = `${incident.urgency === 'high' ? '🔴' : '🟡'} ${incident.service.name}`
    const body = incident.title

    return this.showNotification({
      title,
      body,
      urgency,
      onClick
    })
  }

  public showIncidentsGroupNotification(incidents: any[], onClick?: () => void) {
    const highCount = incidents.filter(i => i.urgency === 'high').length
    const lowCount = incidents.length - highCount
    
    const title = '新告警通知'
    const body = [
      highCount > 0 && `${highCount} 个高优先级告警`,
      lowCount > 0 && `${lowCount} 个低优先级告警`
    ].filter(Boolean).join('\n')

    return this.showNotification({
      title,
      body,
      urgency: highCount > 0 ? 'high' : 'low',
      onClick
    })
  }
}

export const notificationService = new NotificationService() 