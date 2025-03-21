import React from 'react'
import { motion } from 'framer-motion'
import type { Incident } from '../../types'
import IncidentDetails from './IncidentDetails'

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
        className="flex flex-col w-full max-w-2xl mx-4 max-h-[90vh] rounded-lg overflow-hidden"
      >
        {/* 标题栏 */}
        <div className="bg-white dark:bg-gray-800 px-4 py-3 flex justify-between items-center">
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

        {/* 内容区域 */}
        <div className="flex-1 overflow-y-auto bg-gray-50 dark:bg-gray-900">
          <IncidentDetails incident={incident} onClose={onClose} />
        </div>
      </motion.div>
    </div>
  )
} 