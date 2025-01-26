import React, { useState } from 'react'
import { motion, MotionProps } from 'framer-motion'
import type { Incident } from '../../types'
import { formatDistanceToNow } from 'date-fns'
import { zhCN } from 'date-fns/locale'

interface Props {
  incident: Incident
  onAcknowledge?: (incident: Incident) => void
  onClick?: (incident: Incident) => void
}

const descriptionAnimation = {
  initial: { height: 0, opacity: 0 },
  animate: {
    height: 'auto',
    opacity: 1,
    transition: { duration: 0.2 }
  },
  exit: {
    height: 0,
    opacity: 0,
    transition: { duration: 0.2 }
  }
}

const buttonAnimation = {
  initial: { scale: 1 },
  whileHover: { scale: 1.02 },
  whileTap: { scale: 0.98 },
  transition: { duration: 0.2 }
}

export const IncidentCard: React.FC<Props> = ({ incident, onAcknowledge, onClick }) => {
  const [isExpanded, setIsExpanded] = useState(false)

  const handleAcknowledge = (e: React.MouseEvent) => {
    e.stopPropagation()
    onAcknowledge?.(incident)
  }

  const handleClick = () => {
    onClick?.(incident)
  }

  const getStatusColor = () => {
    switch (incident.status) {
      case 'triggered':
        return 'bg-red-500'
      case 'acknowledged':
        return 'bg-yellow-500'
      case 'resolved':
        return 'bg-green-500'
      default:
        return 'bg-gray-500'
    }
  }

  return (
    <div
      className="bg-white dark:bg-gray-800 rounded-lg shadow-md hover:shadow-lg transition-shadow duration-200 overflow-hidden cursor-pointer"
      onClick={handleClick}
    >
      <div className="p-4">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center space-x-2">
            <div className={`w-3 h-3 rounded-full ${getStatusColor()}`} />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              {incident.service.name}
            </h3>
          </div>
          <span className="text-sm text-gray-500 dark:text-gray-400">
            {formatDistanceToNow(new Date(incident.created_at), { addSuffix: true, locale: zhCN })}
          </span>
        </div>

        <h4 className="text-base font-medium text-gray-800 dark:text-gray-200 mb-2">
          {incident.title}
        </h4>
        
        {incident.description && (
          <motion.div
            {...descriptionAnimation}
            className="overflow-hidden"
          >
            <p className={`text-sm text-gray-600 dark:text-gray-300 mb-4 ${!isExpanded && 'line-clamp-2'}`}>
              {incident.description}
            </p>
          </motion.div>
        )}
      </div>

      <div className="px-4 py-3 bg-gray-50 dark:bg-gray-700 flex justify-between items-center">
        <div className="flex items-center space-x-2">
          <span className={`text-sm ${incident.urgency === 'high' ? 'text-red-600 dark:text-red-400' : 'text-yellow-600 dark:text-yellow-400'}`}>
            {incident.urgency === 'high' ? '高优先级' : '低优先级'}
          </span>
        </div>
        <div className="flex items-center space-x-2">
          {incident.status === 'triggered' && (
            <motion.div
              {...buttonAnimation}
              onClick={handleAcknowledge}
              role="button"
              tabIndex={0}
              className="px-3 py-1 bg-primary-500 hover:bg-primary-600 text-white text-sm font-medium rounded-md transition-colors duration-200 cursor-pointer"
            >
              确认
            </motion.div>
          )}
          <motion.div
            {...buttonAnimation}
            onClick={(e: React.MouseEvent) => {
              e.stopPropagation()
              setIsExpanded(!isExpanded)
            }}
            role="button"
            tabIndex={0}
            className="px-3 py-1 bg-gray-200 dark:bg-gray-600 hover:bg-gray-300 dark:hover:bg-gray-500 text-gray-700 dark:text-gray-200 text-sm font-medium rounded-md transition-colors duration-200 cursor-pointer"
          >
            {isExpanded ? '收起' : '展开'}
          </motion.div>
        </div>
      </div>
    </div>
  )
} 