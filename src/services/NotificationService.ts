import { NotificationWindow } from '../main/windows/NotificationWindow'

interface NotificationOptions {
  title: string
  body: string
  silent?: boolean
  urgency?: 'high' | 'low'
  onClick?: () => void
  onClose?: () => void
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
    console.log('NotificationService 初始化')
    this.notificationWindow = NotificationWindow.getInstance()
  }

  public setEnabled(enabled: boolean) {
    console.log('NotificationService.setEnabled:', enabled)
    this.isEnabled = enabled
  }

  public setSoundEnabled(enabled: boolean) {
    console.log('NotificationService.setSoundEnabled:', enabled)
    this.isSoundEnabled = enabled
  }

  public showNotification(options: NotificationOptions) {
    console.log('NotificationService.showNotification:', {
      options,
      isEnabled: this.isEnabled,
      isSoundEnabled: this.isSoundEnabled
    })
    
    if (!this.isEnabled) {
      console.log('通知服务已禁用')
      return
    }

    const { title, body, urgency = 'low', onClick, onClose } = options
    console.log('显示通知:', { title, body, urgency })

    // 显示通知窗口
    this.notificationWindow.show({
      title,
      body,
      urgency,
      onClick,
      onClose
    })
  }

  public showIncidentNotification(incident: any, onClick?: () => void, onClose?: () => void) {
    const urgency = incident.urgency === 'high' ? 'high' : 'low'
    const title = `${incident.urgency === 'high' ? '🔴' : '🟡'} ${incident.service.name}`
    const body = incident.title

    return this.showNotification({
      title,
      body,
      urgency,
      onClick,
      onClose
    })
  }

  public showIncidentsGroupNotification(incidents: any[], onClick?: () => void, onClose?: () => void) {
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
      onClick,
      onClose
    })
  }
}

export const notificationService = new NotificationService() 