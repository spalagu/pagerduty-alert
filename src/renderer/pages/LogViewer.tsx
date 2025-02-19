import React, { useState, useEffect } from 'react'

export const LogViewer: React.FC = () => {
  const [logs, setLogs] = useState<string>('')
  const [days, setDays] = useState<number>(1)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadLogs = async () => {
      setLoading(true)
      try {
        const content = await window.electron.ipcRenderer.invoke('get-logs', days)
        setLogs(content)
      } catch (error) {
        console.error('加载日志失败:', error)
        setLogs('加载日志失败')
      } finally {
        setLoading(false)
      }
    }

    loadLogs()
  }, [days])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 dark:border-white"></div>
      </div>
    )
  }

  return (
    <div className="p-4">
      <div className="mb-4 flex items-center space-x-4">
        <span className="text-sm text-gray-600 dark:text-gray-400">查看范围：</span>
        <select
          value={days}
          onChange={(e) => setDays(Number(e.target.value))}
          className="px-2 py-1 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm"
        >
          <option value={1}>最近1天</option>
          <option value={3}>最近3天</option>
          <option value={7}>最近7天</option>
        </select>
      </div>
      
      <pre className="bg-gray-100 dark:bg-gray-900 p-4 rounded-lg overflow-x-auto whitespace-pre-wrap font-mono text-sm">
        {logs || '暂无日志'}
      </pre>
    </div>
  )
} 