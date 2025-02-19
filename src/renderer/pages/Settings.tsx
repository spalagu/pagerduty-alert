import React, { useState, useEffect } from 'react'
import { AppearanceSettings } from '../components/AppearanceSettings'
import { SystemSettings } from '../components/SystemSettings'
import type { PagerDutyConfig, LogLevel } from '../../types'
import { DEFAULT_CONFIG } from '../../config/defaults'

export const Settings: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'general' | 'appearance' | 'system' | 'notification' | 'log'>('general')
  const [config, setConfig] = useState<PagerDutyConfig>({
    ...DEFAULT_CONFIG,
    apiKey: '',
    pollingInterval: 30000,
    urgencyFilter: ['high'],
    statusFilter: ['triggered', 'acknowledged'],
    showOnlyNewAlerts: false,
    lastCheckedTime: new Date().toISOString(),
    notification: DEFAULT_CONFIG.notification,
    appearance: DEFAULT_CONFIG.appearance,
    system: DEFAULT_CONFIG.system,
    cache: DEFAULT_CONFIG.cache,
    log: DEFAULT_CONFIG.log
  })

  useEffect(() => {
    const loadConfig = async () => {
      try {
        const savedConfig = await window.electron.ipcRenderer.invoke('get-config')
        if (savedConfig) {
          setConfig(prev => ({
            ...prev,
            ...savedConfig,
            notification: {
              enabled: savedConfig.notification?.enabled ?? prev.notification.enabled,
              sound: savedConfig.notification?.sound ?? prev.notification.sound,
              grouping: savedConfig.notification?.grouping ?? prev.notification.grouping,
              criticalPersistent: savedConfig.notification?.criticalPersistent ?? prev.notification.criticalPersistent,
              clickToShow: savedConfig.notification?.clickToShow ?? prev.notification.clickToShow
            },
            appearance: {
              theme: savedConfig.appearance?.theme ?? prev.appearance.theme,
              windowSize: {
                width: savedConfig.appearance?.windowSize?.width ?? prev.appearance.windowSize.width,
                height: savedConfig.appearance?.windowSize?.height ?? prev.appearance.windowSize.height
              }
            },
            system: {
              autoLaunch: savedConfig.system?.autoLaunch ?? prev.system.autoLaunch,
              proxy: {
                enabled: savedConfig.system?.proxy?.enabled ?? prev.system.proxy?.enabled ?? false,
                server: savedConfig.system?.proxy?.server ?? prev.system.proxy?.server ?? '',
                bypass: savedConfig.system?.proxy?.bypass ?? prev.system.proxy?.bypass ?? '<local>'
              }
            },
            cache: {
              enabled: savedConfig.cache?.enabled ?? prev.cache.enabled,
              maxAge: savedConfig.cache?.maxAge ?? prev.cache.maxAge,
              maxItems: savedConfig.cache?.maxItems ?? prev.cache.maxItems
            }
          }))
        }
      } catch (error) {
        console.error('加载配置失败:', error)
      }
    }

    loadConfig()
  }, [])

  const handleConfigChange = (newConfig: Partial<PagerDutyConfig>) => {
    setConfig(prev => {
      const updatedConfig: PagerDutyConfig = {
        ...prev,
        ...newConfig,
        notification: {
          enabled: newConfig.notification?.enabled ?? prev.notification.enabled,
          sound: newConfig.notification?.sound ?? prev.notification.sound,
          grouping: newConfig.notification?.grouping ?? prev.notification.grouping,
          criticalPersistent: newConfig.notification?.criticalPersistent ?? prev.notification.criticalPersistent,
          clickToShow: newConfig.notification?.clickToShow ?? prev.notification.clickToShow
        },
        appearance: {
          theme: newConfig.appearance?.theme ?? prev.appearance.theme,
          windowSize: {
            width: newConfig.appearance?.windowSize?.width ?? prev.appearance.windowSize.width,
            height: newConfig.appearance?.windowSize?.height ?? prev.appearance.windowSize.height
          }
        },
        system: {
          autoLaunch: newConfig.system?.autoLaunch ?? prev.system.autoLaunch,
          proxy: {
            enabled: newConfig.system?.proxy?.enabled ?? prev.system.proxy?.enabled ?? false,
            server: newConfig.system?.proxy?.server ?? prev.system.proxy?.server ?? '',
            bypass: newConfig.system?.proxy?.bypass ?? prev.system.proxy?.bypass ?? '<local>'
          }
        },
        cache: {
          enabled: newConfig.cache?.enabled ?? prev.cache.enabled,
          maxAge: newConfig.cache?.maxAge ?? prev.cache.maxAge,
          maxItems: newConfig.cache?.maxItems ?? prev.cache.maxItems
        }
      }
      return updatedConfig
    })
  }

  const handleSave = async () => {
    try {
      await window.electron.ipcRenderer.invoke('save-config', config)
      await window.electron.ipcRenderer.invoke('config-changed')
      window.electron.ipcRenderer.invoke('close-settings-window')
    } catch (error) {
      console.error('保存配置失败:', error)
    }
  }

  const renderTabContent = () => {
    switch (activeTab) {
      case 'general':
        return (
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                PagerDuty API Key
              </label>
              <input
                type="password"
                value={config.apiKey}
                onChange={e => handleConfigChange({ apiKey: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:text-white"
                placeholder="输入你的 API Key"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                轮询间隔 (毫秒)
              </label>
              <input
                type="number"
                value={config.pollingInterval}
                onChange={e => handleConfigChange({ pollingInterval: parseInt(e.target.value) })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:text-white"
                min="5000"
                step="1000"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                状态筛选
              </label>
              <div className="space-y-2">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={config.statusFilter.includes('triggered')}
                    onChange={e => handleConfigChange({
                      statusFilter: e.target.checked
                        ? [...config.statusFilter, 'triggered']
                        : config.statusFilter.filter(s => s !== 'triggered')
                    })}
                    className="rounded border-gray-300 text-primary-600 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                  />
                  <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">待处理</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={config.statusFilter.includes('acknowledged')}
                    onChange={e => handleConfigChange({
                      statusFilter: e.target.checked
                        ? [...config.statusFilter, 'acknowledged']
                        : config.statusFilter.filter(s => s !== 'acknowledged')
                    })}
                    className="rounded border-gray-300 text-primary-600 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                  />
                  <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">已确认</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={config.statusFilter.includes('resolved')}
                    onChange={e => handleConfigChange({
                      statusFilter: e.target.checked
                        ? [...config.statusFilter, 'resolved']
                        : config.statusFilter.filter(s => s !== 'resolved')
                    })}
                    className="rounded border-gray-300 text-primary-600 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                  />
                  <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">已解决</span>
                </label>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                优先级筛选
              </label>
              <div className="space-y-2">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={config.urgencyFilter.includes('high')}
                    onChange={e => handleConfigChange({
                      urgencyFilter: e.target.checked
                        ? [...config.urgencyFilter, 'high']
                        : config.urgencyFilter.filter(u => u !== 'high')
                    })}
                    className="rounded border-gray-300 text-primary-600 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                  />
                  <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">高优先级</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={config.urgencyFilter.includes('low')}
                    onChange={e => handleConfigChange({
                      urgencyFilter: e.target.checked
                        ? [...config.urgencyFilter, 'low']
                        : config.urgencyFilter.filter(u => u !== 'low')
                    })}
                    className="rounded border-gray-300 text-primary-600 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                  />
                  <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">低优先级</span>
                </label>
              </div>
            </div>

            <div className="space-y-2">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={config.showOnlyNewAlerts}
                  onChange={e => handleConfigChange({ showOnlyNewAlerts: e.target.checked })}
                  className="rounded border-gray-300 text-primary-600 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                />
                <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">只显示新告警</span>
              </label>
            </div>
          </div>
        )
      
      case 'notification':
        return (
          <div className="space-y-4">
            <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">
              通知设置
            </h3>
            <div className="space-y-2">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={config.notification.enabled}
                  onChange={e => handleConfigChange({
                    notification: { ...config.notification, enabled: e.target.checked }
                  })}
                  className="rounded border-gray-300 text-primary-600 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                />
                <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">启用系统通知</span>
              </label>

              {config.notification.enabled && (
                <>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={config.notification.sound}
                      onChange={e => handleConfigChange({
                        notification: { ...config.notification, sound: e.target.checked }
                      })}
                      className="rounded border-gray-300 text-primary-600 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                    />
                    <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">启用通知声音</span>
                  </label>

                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={config.notification.grouping}
                      onChange={e => handleConfigChange({
                        notification: { ...config.notification, grouping: e.target.checked }
                      })}
                      className="rounded border-gray-300 text-primary-600 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                    />
                    <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">合并多个告警通知</span>
                  </label>

                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={config.notification.criticalPersistent}
                      onChange={e => handleConfigChange({
                        notification: { ...config.notification, criticalPersistent: e.target.checked }
                      })}
                      className="rounded border-gray-300 text-primary-600 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                    />
                    <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">高优先级告警通知持续显示</span>
                  </label>

                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={config.notification.clickToShow}
                      onChange={e => handleConfigChange({
                        notification: { ...config.notification, clickToShow: e.target.checked }
                      })}
                      className="rounded border-gray-300 text-primary-600 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                    />
                    <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">点击通知显示主窗口</span>
                  </label>

                  <div className="mt-4">
                    <button
                      onClick={async () => {
                        console.log('点击测试通知按钮')
                        try {
                          await window.electron.ipcRenderer.invoke('test-notification')
                          console.log('测试通知发送成功')
                        } catch (error) {
                          console.error('测试通知发送失败:', error)
                        }
                      }}
                      className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                    >
                      测试通知
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        )
      
      case 'appearance':
        return <AppearanceSettings config={config} onChange={handleConfigChange} />
      
      case 'system':
        return <SystemSettings config={config} onChange={handleConfigChange} />
      
      case 'log':
        return (
          <div className="space-y-4">
            <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">
              日志设置
            </h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-400">启用日志</span>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    className="sr-only peer"
                    checked={config.log.enabled}
                    onChange={e => handleConfigChange({
                      log: { ...config.log, enabled: e.target.checked }
                    })}
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                </label>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-400">日志级别</span>
                <select
                  value={config.log.level}
                  onChange={e => handleConfigChange({
                    log: { ...config.log, level: e.target.value as LogLevel }
                  })}
                  className="px-3 py-1.5 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md text-sm"
                  disabled={!config.log.enabled}
                >
                  <option value="debug">Debug</option>
                  <option value="info">Info</option>
                  <option value="warn">Warn</option>
                  <option value="error">Error</option>
                </select>
              </div>

              <div className="flex items-center justify-between">
                <button
                  onClick={() => window.electron.ipcRenderer.invoke('show-log-viewer')}
                  className="px-4 py-2 bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-md text-sm transition-colors"
                  disabled={!config.log.enabled}
                >
                  查看日志
                </button>
              </div>
            </div>
          </div>
        )
      
      default:
        return null
    }
  }

  return (
    <div className="min-h-screen bg-white dark:bg-gray-800">
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="border-b border-gray-200 dark:border-gray-700">
            <nav className="-mb-px flex space-x-8">
              <button
                onClick={() => setActiveTab('general')}
                className={`
                  whitespace-nowrap pb-4 px-1 border-b-2 font-medium text-sm
                  ${activeTab === 'general'
                    ? 'border-primary-500 text-primary-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }
                `}
              >
                常规
              </button>
              <button
                onClick={() => setActiveTab('notification')}
                className={`
                  whitespace-nowrap pb-4 px-1 border-b-2 font-medium text-sm
                  ${activeTab === 'notification'
                    ? 'border-primary-500 text-primary-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }
                `}
              >
                通知
              </button>
              <button
                onClick={() => setActiveTab('appearance')}
                className={`
                  whitespace-nowrap pb-4 px-1 border-b-2 font-medium text-sm
                  ${activeTab === 'appearance'
                    ? 'border-primary-500 text-primary-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }
                `}
              >
                外观
              </button>
              <button
                onClick={() => setActiveTab('system')}
                className={`
                  whitespace-nowrap pb-4 px-1 border-b-2 font-medium text-sm
                  ${activeTab === 'system'
                    ? 'border-primary-500 text-primary-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }
                `}
              >
                系统
              </button>
              <button
                onClick={() => setActiveTab('log')}
                className={`
                  whitespace-nowrap pb-4 px-1 border-b-2 font-medium text-sm
                  ${activeTab === 'log'
                    ? 'border-primary-500 text-primary-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }
                `}
              >
                日志
              </button>
            </nav>
          </div>

          <div className="mt-6">
            {renderTabContent()}
          </div>

          <div className="mt-6 flex justify-end space-x-3">
            <button
              onClick={() => window.electron.ipcRenderer.invoke('close-settings-window')}
              className="inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 shadow-sm text-sm font-medium rounded-md text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
            >
              取消
            </button>
            <button
              onClick={handleSave}
              className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
            >
              保存
            </button>
          </div>
        </div>
      </div>
    </div>
  )
} 