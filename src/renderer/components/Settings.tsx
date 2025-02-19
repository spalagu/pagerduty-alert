import React, { useState, useEffect } from 'react'
import { toast } from 'react-hot-toast'
import type { PagerDutyConfig, LogLevel } from '../../types'

export const Settings: React.FC = () => {
  const [config, setConfig] = useState<PagerDutyConfig | null>(null)
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    // 初始化时加载配置
    const loadConfig = async () => {
      try {
        const savedConfig = await window.electron.ipcRenderer.invoke('get-config')
        setConfig(savedConfig)
      } catch (error) {
        console.error('加载配置失败:', error)
        toast.error('加载配置失败')
      }
    }

    loadConfig()
  }, [])

  const handleSave = async () => {
    if (!config) return
    
    setIsSaving(true)
    try {
      // 保存配置
      const result = await window.electron.ipcRenderer.invoke('save-config', config)
      
      if (!result?.success) {
        console.error('保存配置失败:', result?.error)
        if (result?.error === 'Invalid API key') {
          toast.error('API 密钥无效')
        } else {
          toast.error('保存设置失败')
        }
        return
      }

      // 通知保存成功
      toast.success('设置已保存')
      
      // 关闭设置窗口
      window.electron.ipcRenderer.invoke('close-settings-window')
    } catch (error) {
      console.error('保存设置失败:', error)
      toast.error('保存设置失败')
    } finally {
      setIsSaving(false)
    }
  }

  const handleViewLogs = () => {
    window.electron.ipcRenderer.invoke('show-log-viewer')
  }

  if (!config) {
    return <div>加载中...</div>
  }

  return (
    <div className="p-4">
      {/* 设置表单内容 */}
      
      {/* 日志设置 */}
      <div className="mt-6">
        <h3 className="text-lg font-medium text-gray-900 dark:text-white">
          日志设置
        </h3>
        <div className="mt-4 space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600 dark:text-gray-400">启用日志</span>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                className="sr-only peer"
                checked={config.log.enabled}
                onChange={(e) => setConfig({
                  ...config,
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
              onChange={(e) => setConfig({
                ...config,
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
              onClick={handleViewLogs}
              className="px-4 py-2 bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-md text-sm transition-colors"
              disabled={!config.log.enabled}
            >
              查看日志
            </button>
          </div>
        </div>
      </div>

      {/* 保存按钮 */}
      <div className="mt-8 flex justify-end">
        <button
          onClick={handleSave}
          disabled={isSaving}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-sm transition-colors disabled:opacity-50"
        >
          {isSaving ? '保存中...' : '保存'}
        </button>
      </div>
    </div>
  )
} 