import React from 'react'
import { motion } from 'framer-motion'

export const SkeletonCard: React.FC = () => {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg p-4 mb-4 shadow-sm border-l-4 border-gray-200 dark:border-gray-700">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center space-x-3">
          <div className="w-5 h-5 bg-gray-200 dark:bg-gray-700 rounded-full animate-pulse" />
          <div className="w-20 h-5 bg-gray-200 dark:bg-gray-700 rounded-full animate-pulse" />
        </div>
        <div className="w-32 h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
      </div>

      <div className="w-3/4 h-6 bg-gray-200 dark:bg-gray-700 rounded mb-2 animate-pulse" />
      <div className="w-full h-4 bg-gray-200 dark:bg-gray-700 rounded mb-4 animate-pulse" />

      <div className="flex items-center justify-between mt-4">
        <div className="w-24 h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
        <div className="flex items-center space-x-2">
          <div className="w-20 h-8 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
          <div className="w-20 h-8 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
        </div>
      </div>
    </div>
  )
} 