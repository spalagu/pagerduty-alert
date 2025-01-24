import React, { useState } from 'react'
import type { PagerDutyConfig } from '../../types'

interface Props {
  config: PagerDutyConfig
  onChange: (config: PagerDutyConfig) => void
}

export const SystemSettings: React.FC<Props> = ({ config, onChange }) => {
  const [isTestingProxy, setIsTestingProxy] = useState(false)

  const handleAutoLaunchChange = (autoLaunch: boolean) => {
    onChange({
      ...config,
      system: {
        ...config.system,
        autoLaunch
      }
    })
  }

  const handleProxyEnabledChange = (enabled: boolean) => {
    onChange({
      ...config,
      system: {
        ...config.system,
        proxy: {
          enabled,
          server: config.system.proxy?.server || '',
          bypass: config.system.proxy?.bypass || '<local>'
        }
      }
    })
  }

  const handleProxyServerChange = (server: string) => {
    onChange({
      ...config,
      system: {
        ...config.system,
        proxy: {
          enabled: config.system.proxy?.enabled || false,
          server,
          bypass: config.system.proxy?.bypass || '<local>'
        }
      }
    })
  }

  const handleProxyBypassChange = (bypass: string) => {
    onChange({
      ...config,
      system: {
        ...config.system,
        proxy: {
          enabled: config.system.proxy?.enabled || false,
          server: config.system.proxy?.server || '',
          bypass
        }
      }
    })
  }

  const handleTestProxy = async () => {
    setIsTestingProxy(true)
    try {
      const success = await window.electron.ipcRenderer.invoke('test-proxy')
      if (success) {
        alert('代理连接测试成功')
      } else {
        alert('代理连接测试失败')
      }
    } catch (error) {
      alert('代理连接测试失败: ' + error)
    } finally {
      setIsTestingProxy(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-4">
          系统设置
        </h3>
        
        <div className="space-y-4">
          <div>
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={config.system.autoLaunch}
                onChange={e => handleAutoLaunchChange(e.target.checked)}
                className="rounded border-gray-300 text-primary-600 shadow-sm focus:border-primary-500 focus:ring-primary-500"
              />
              <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                开机自动启动
              </span>
            </label>
          </div>

          <div className="space-y-4 border-t border-gray-200 dark:border-gray-700 pt-4">
            <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">
              代理设置
            </h4>

            <div>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={config.system.proxy?.enabled || false}
                  onChange={e => handleProxyEnabledChange(e.target.checked)}
                  className="rounded border-gray-300 text-primary-600 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                />
                <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                  启用代理
                </span>
              </label>
            </div>

            {config.system.proxy?.enabled && (
              <div className="space-y-4 pl-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    代理服务器
                  </label>
                  <input
                    type="text"
                    value={config.system.proxy.server}
                    onChange={e => handleProxyServerChange(e.target.value)}
                    placeholder="例如: socks5://127.0.0.1:1080"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    不使用代理的地址
                  </label>
                  <input
                    type="text"
                    value={config.system.proxy.bypass || '<local>'}
                    onChange={e => handleProxyBypassChange(e.target.value)}
                    placeholder="例如: *.local,localhost,127.0.0.1"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:text-white"
                  />
                </div>

                <button
                  onClick={handleTestProxy}
                  disabled={isTestingProxy}
                  className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50"
                >
                  {isTestingProxy ? '测试中...' : '测试代理连接'}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
} 