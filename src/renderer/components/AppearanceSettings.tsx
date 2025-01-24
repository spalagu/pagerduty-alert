import React from 'react'
import type { PagerDutyConfig } from '../../types'

interface Props {
  config: PagerDutyConfig
  onChange: (config: PagerDutyConfig) => void
}

export const AppearanceSettings: React.FC<Props> = ({ config, onChange }) => {
  const handleThemeChange = (theme: PagerDutyConfig['appearance']['theme']) => {
    onChange({
      ...config,
      appearance: {
        ...config.appearance,
        theme
      }
    })
  }

  const handleWindowSizeChange = (dimension: 'width' | 'height', value: number) => {
    onChange({
      ...config,
      appearance: {
        ...config.appearance,
        windowSize: {
          ...config.appearance.windowSize,
          [dimension]: value
        }
      }
    })
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-4">
          外观设置
        </h3>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              主题
            </label>
            <select
              value={config.appearance.theme}
              onChange={e => handleThemeChange(e.target.value as PagerDutyConfig['appearance']['theme'])}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:text-white"
            >
              <option value="system">跟随系统</option>
              <option value="light">浅色</option>
              <option value="dark">深色</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              窗口大小
            </label>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-gray-600 dark:text-gray-400 mb-1">
                  宽度
                </label>
                <input
                  type="number"
                  value={config.appearance.windowSize.width}
                  onChange={e => handleWindowSizeChange('width', parseInt(e.target.value))}
                  min={300}
                  max={800}
                  step={10}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-600 dark:text-gray-400 mb-1">
                  高度
                </label>
                <input
                  type="number"
                  value={config.appearance.windowSize.height}
                  onChange={e => handleWindowSizeChange('height', parseInt(e.target.value))}
                  min={400}
                  max={1000}
                  step={10}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:text-white"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 