import React from 'react'
import { BellIcon } from '@heroicons/react/24/outline'

interface Props {
  message?: string
}

export const EmptyState: React.FC<Props> = ({ message = '暂无告警' }) => {
  return (
    <div className="flex flex-col items-center justify-center py-12">
      <div className="bg-gray-100 dark:bg-gray-800 rounded-full p-4 mb-4">
        <BellIcon className="w-12 h-12 text-gray-400 dark:text-gray-500" />
      </div>
      <p className="text-gray-500 dark:text-gray-400 text-center">
        {message}
      </p>
    </div>
  )
} 