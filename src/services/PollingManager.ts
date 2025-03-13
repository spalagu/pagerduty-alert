import { logService } from './LogService'

type PollingState = 'idle' | 'polling' | 'error' | 'cleanup'

export class PollingManager {
  private static instance: PollingManager | null = null
  private timer: NodeJS.Timeout | null = null
  private timeoutTimer: NodeJS.Timeout | null = null
  private state: PollingState = 'idle'
  private currentInterval: number | null = null
  private currentCallback: (() => Promise<void>) | null = null
  private lastFetchStartTime: number | null = null
  private lastError: Error | null = null
  private readonly MAX_POLL_DURATION = 5 * 60 * 1000 // 5分钟超时

  private constructor() {
    logService.info('[PollingManager] 实例化')
  }

  public static getInstance(): PollingManager {
    if (!PollingManager.instance) {
      PollingManager.instance = new PollingManager()
    }
    return PollingManager.instance
  }

  private setState(newState: PollingState) {
    logService.info('[PollingManager] 状态转换', {
      from: this.state,
      to: newState,
      currentInterval: this.currentInterval,
      hasCallback: !!this.currentCallback,
      lastFetchStartTime: this.lastFetchStartTime ? new Date(this.lastFetchStartTime).toISOString() : null,
      lastError: this.lastError?.message
    })
    this.state = newState
  }

  public start(interval: number, callback: () => Promise<void>) {
    logService.info('[PollingManager] 尝试启动轮询', { 
      interval,
      currentState: this.state,
      currentInterval: this.currentInterval,
      hasCallback: !!this.currentCallback
    })
    
    // 如果已经在相同配置下运行，则忽略
    if (this.state === 'polling' && 
        this.currentInterval === interval && 
        this.currentCallback === callback) {
      logService.info('[PollingManager] 已经以相同配置运行中')
      return
    }

    // 如果不是空闲状态，先清理
    if (this.state !== 'idle') {
      logService.info('[PollingManager] 非空闲状态，先进行清理')
      this.cleanup()
    }

    // 开始轮询
    this.setState('polling')
    this.currentInterval = interval
    this.currentCallback = callback
    this.lastError = null
    
    logService.info('[PollingManager] 设置轮询定时器', { interval })
    this.timer = setInterval(() => this.executePoll(), interval)
    
    // 立即执行一次
    logService.info('[PollingManager] 执行首次轮询')
    this.executePoll()
  }

  private async executePoll() {
    // 状态检查
    if (this.state !== 'polling') {
      logService.warn('[PollingManager] 非轮询状态下尝试执行轮询', {
        currentState: this.state
      })
      return
    }

    // 回调检查
    if (!this.currentCallback) {
      this.lastError = new Error('没有设置回调函数')
      this.setState('error')
      logService.error('[PollingManager] 轮询执行失败: 没有设置回调函数')
      return
    }

    // 检查上次轮询是否超时
    if (this.lastFetchStartTime !== null) {
      const now = Date.now()
      const duration = now - this.lastFetchStartTime
      
      if (duration > this.MAX_POLL_DURATION) {
        logService.error('[PollingManager] 检测到上次轮询超时，强制重置状态', {
          lastFetchStartTime: new Date(this.lastFetchStartTime).toISOString(),
          duration,
          maxDuration: this.MAX_POLL_DURATION
        })
        this.lastFetchStartTime = null
      } else {
        logService.info('[PollingManager] 上一次轮询尚未完成，跳过本次执行', {
          lastFetchStartTime: new Date(this.lastFetchStartTime).toISOString(),
          duration
        })
        return
      }
    }

    // 设置超时定时器
    if (this.timeoutTimer) {
      clearTimeout(this.timeoutTimer)
    }
    
    this.timeoutTimer = setTimeout(() => {
      if (this.lastFetchStartTime !== null) {
        logService.error('[PollingManager] 轮询执行超时，强制重置状态', {
          lastFetchStartTime: new Date(this.lastFetchStartTime).toISOString(),
          maxDuration: this.MAX_POLL_DURATION
        })
        this.lastFetchStartTime = null
      }
    }, this.MAX_POLL_DURATION)

    try {
      this.lastFetchStartTime = Date.now()
      logService.info('[PollingManager] 开始执行轮询', {
        startTime: new Date(this.lastFetchStartTime).toISOString()
      })
      
      await this.currentCallback()
      
      logService.info('[PollingManager] 轮询执行完成', {
        duration: Date.now() - this.lastFetchStartTime
      })
      
      // 如果之前是错误状态，恢复到轮询状态
      if (this.state as PollingState === 'error') {
        this.setState('polling')
        this.lastError = null
      }
    } catch (error) {
      this.lastError = error instanceof Error ? error : new Error(String(error))
      this.setState('error')
      logService.error('[PollingManager] 轮询执行失败:', error)
    } finally {
      // 清除超时定时器
      if (this.timeoutTimer) {
        clearTimeout(this.timeoutTimer)
        this.timeoutTimer = null
      }
      this.lastFetchStartTime = null
    }
  }

  public stop() {
    logService.info('[PollingManager] 停止轮询', {
      currentState: this.state,
      hasTimer: !!this.timer,
      hasTimeoutTimer: !!this.timeoutTimer
    })

    if (this.timer) {
      clearInterval(this.timer)
      this.timer = null
    }

    if (this.timeoutTimer) {
      clearTimeout(this.timeoutTimer)
      this.timeoutTimer = null
    }

    this.setState('idle')
    this.currentInterval = null
    this.currentCallback = null
    this.lastFetchStartTime = null
    this.lastError = null
  }

  public cleanup() {
    logService.info('[PollingManager] 清理资源', {
      currentState: this.state,
      hasTimer: !!this.timer,
      hasTimeoutTimer: !!this.timeoutTimer
    })
    
    this.setState('cleanup')
    if (this.timer) {
      clearInterval(this.timer)
      this.timer = null
    }
    
    if (this.timeoutTimer) {
      clearTimeout(this.timeoutTimer)
      this.timeoutTimer = null
    }
    
    this.currentInterval = null
    this.currentCallback = null
    this.lastFetchStartTime = null
    this.lastError = null
    
    this.setState('idle')
    PollingManager.instance = null
  }

  public getState(): { 
    state: PollingState
    currentInterval: number | null
    lastFetchStartTime: number | null
    lastError: Error | null 
  } {
    return {
      state: this.state,
      currentInterval: this.currentInterval,
      lastFetchStartTime: this.lastFetchStartTime,
      lastError: this.lastError
    }
  }
}

export const pollingManager = PollingManager.getInstance() 