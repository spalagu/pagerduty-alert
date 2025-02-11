import React, { useState, useEffect } from 'react'
import { toast } from 'react-hot-toast'
import type { PagerDutyConfig } from '../../types'

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

  if (!config) {
    return <div>加载中...</div>
  }

  return (
    <div>
      {/* 设置表单内容 */}
    </div>
  )
} 