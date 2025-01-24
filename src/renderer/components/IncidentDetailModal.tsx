import React from 'react'
import { motion } from 'framer-motion'
import type { Incident } from '../../types'

interface Props {
  incident: Incident
  onClose: () => void
}

export const IncidentDetailModal: React.FC<Props> = ({ incident, onClose }) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto"
      >
        <div className="flex justify-between items-start mb-4">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            告警详情
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              {incident.service.name}
            </h3>
            <p className="text-gray-600 dark:text-gray-300">
              {incident.title}
            </p>
          </div>

          {incident.description && (
            <div>
              <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                描述
              </h4>
              <p className="text-gray-600 dark:text-gray-400 whitespace-pre-wrap">
                {incident.description}
              </p>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                状态
              </h4>
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
                ${incident.status === 'triggered' ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200' :
                  incident.status === 'acknowledged' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200' :
                    'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                }`}
              >
                {incident.status === 'triggered' ? '待处理' :
                  incident.status === 'acknowledged' ? '已确认' : '已解决'
                }
              </span>
            </div>

            <div>
              <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                优先级
              </h4>
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
                ${incident.urgency === 'high' ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200' :
                  'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                }`}
              >
                {incident.urgency === 'high' ? '高优先级' : '低优先级'}
              </span>
            </div>
          </div>

          {incident.details && (
            <div>
              <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                详细信息
              </h4>
              <p className="text-gray-600 dark:text-gray-400 whitespace-pre-wrap">
                {incident.details}
              </p>
            </div>
          )}

          {incident.custom_fields && incident.custom_fields.length > 0 && (
            <div>
              <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                自定义字段
              </h4>
              <div className="space-y-2">
                {incident.custom_fields.map(field => (
                  <div key={field.id} className="flex justify-between">
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      {field.display_name}:
                    </span>
                    <span className="text-sm text-gray-900 dark:text-gray-200">
                      {field.value || '-'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="pt-4 flex justify-end">
            <a
              href={incident.html_url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300 font-medium text-sm"
            >
              在 PagerDuty 中查看 →
            </a>
          </div>
        </div>
      </motion.div>
    </div>
  )
} 