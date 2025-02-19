import React, { useState } from 'react'
import type { PagerDutyConfig } from '../../types'
import { DEFAULT_CONFIG } from '../../config/defaults'

interface Props {
  initialConfig?: PagerDutyConfig
  onSave: (config: PagerDutyConfig) => void
  onCancel: () => void
}

export const ConfigForm: React.FC<Props> = ({ initialConfig, onSave, onCancel }) => {
  const [config, setConfig] = useState<PagerDutyConfig>({
    ...DEFAULT_CONFIG,
    apiKey: initialConfig?.apiKey || '',
    pollingInterval: initialConfig?.pollingInterval || 30000,
    urgencyFilter: initialConfig?.urgencyFilter || ['high'],
    statusFilter: initialConfig?.statusFilter || ['triggered', 'acknowledged'],
    showOnlyNewAlerts: initialConfig?.showOnlyNewAlerts || true,
    lastCheckedTime: initialConfig?.lastCheckedTime || new Date().toISOString(),
    notification: initialConfig?.notification || DEFAULT_CONFIG.notification,
    appearance: initialConfig?.appearance || DEFAULT_CONFIG.appearance,
    system: initialConfig?.system || DEFAULT_CONFIG.system,
    cache: initialConfig?.cache || DEFAULT_CONFIG.cache,
    log: initialConfig?.log || DEFAULT_CONFIG.log
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSave(config)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          API Key
        </label>
        <input
          type="password"
          value={config.apiKey}
          onChange={e => setConfig(prev => ({ ...prev, apiKey: e.target.value }))}
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
          onChange={e => setConfig(prev => ({ ...prev, pollingInterval: parseInt(e.target.value) }))}
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:text-white"
          min="5000"
          step="1000"
        />
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
              onChange={e => setConfig(prev => ({
                ...prev,
                urgencyFilter: e.target.checked
                  ? [...prev.urgencyFilter, 'high']
                  : prev.urgencyFilter.filter(u => u !== 'high')
              }))}
              className="rounded border-gray-300 text-primary-600 shadow-sm focus:border-primary-500 focus:ring-primary-500"
            />
            <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">高优先级</span>
          </label>
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={config.urgencyFilter.includes('low')}
              onChange={e => setConfig(prev => ({
                ...prev,
                urgencyFilter: e.target.checked
                  ? [...prev.urgencyFilter, 'low']
                  : prev.urgencyFilter.filter(u => u !== 'low')
              }))}
              className="rounded border-gray-300 text-primary-600 shadow-sm focus:border-primary-500 focus:ring-primary-500"
            />
            <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">低优先级</span>
          </label>
        </div>
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
              onChange={e => setConfig(prev => ({
                ...prev,
                statusFilter: e.target.checked
                  ? [...prev.statusFilter, 'triggered']
                  : prev.statusFilter.filter(s => s !== 'triggered')
              }))}
              className="rounded border-gray-300 text-primary-600 shadow-sm focus:border-primary-500 focus:ring-primary-500"
            />
            <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">待处理</span>
          </label>
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={config.statusFilter.includes('acknowledged')}
              onChange={e => setConfig(prev => ({
                ...prev,
                statusFilter: e.target.checked
                  ? [...prev.statusFilter, 'acknowledged']
                  : prev.statusFilter.filter(s => s !== 'acknowledged')
              }))}
              className="rounded border-gray-300 text-primary-600 shadow-sm focus:border-primary-500 focus:ring-primary-500"
            />
            <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">已确认</span>
          </label>
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={config.statusFilter.includes('resolved')}
              onChange={e => setConfig(prev => ({
                ...prev,
                statusFilter: e.target.checked
                  ? [...prev.statusFilter, 'resolved']
                  : prev.statusFilter.filter(s => s !== 'resolved')
              }))}
              className="rounded border-gray-300 text-primary-600 shadow-sm focus:border-primary-500 focus:ring-primary-500"
            />
            <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">已解决</span>
          </label>
        </div>
      </div>

      <div className="space-y-2">
        <label className="flex items-center">
          <input
            type="checkbox"
            checked={config.showOnlyNewAlerts}
            onChange={e => setConfig(prev => ({ ...prev, showOnlyNewAlerts: e.target.checked }))}
            className="rounded border-gray-300 text-primary-600 shadow-sm focus:border-primary-500 focus:ring-primary-500"
          />
          <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">只显示新告警</span>
        </label>
      </div>

      <div className="space-y-4 border-t border-gray-200 dark:border-gray-700 pt-4">
        <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">
          通知设置
        </h3>
        <div className="space-y-2">
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={config.notification.enabled}
              onChange={e => setConfig(prev => ({
                ...prev,
                notification: { ...prev.notification, enabled: e.target.checked }
              }))}
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
                  onChange={e => setConfig(prev => ({
                    ...prev,
                    notification: { ...prev.notification, sound: e.target.checked }
                  }))}
                  className="rounded border-gray-300 text-primary-600 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                />
                <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">启用通知声音</span>
              </label>

              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={config.notification.grouping}
                  onChange={e => setConfig(prev => ({
                    ...prev,
                    notification: { ...prev.notification, grouping: e.target.checked }
                  }))}
                  className="rounded border-gray-300 text-primary-600 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                />
                <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">合并多个告警通知</span>
              </label>

              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={config.notification.criticalPersistent}
                  onChange={e => setConfig(prev => ({
                    ...prev,
                    notification: { ...prev.notification, criticalPersistent: e.target.checked }
                  }))}
                  className="rounded border-gray-300 text-primary-600 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                />
                <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">高优先级告警通知持续显示</span>
              </label>

              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={config.notification.clickToShow}
                  onChange={e => setConfig(prev => ({
                    ...prev,
                    notification: { ...prev.notification, clickToShow: e.target.checked }
                  }))}
                  className="rounded border-gray-300 text-primary-600 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                />
                <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">点击通知显示主窗口</span>
              </label>
            </>
          )}
        </div>
      </div>

      <div className="flex justify-end space-x-3">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
        >
          取消
        </button>
        <button
          type="submit"
          className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
        >
          保存
        </button>
      </div>
    </form>
  )
} 