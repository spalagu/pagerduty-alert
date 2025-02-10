import React, { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { XMarkIcon } from '@heroicons/react/24/solid'

interface NotificationData {
  id: string
  title: string
  body: string
  urgency: 'high' | 'low'
}

export const Notification: React.FC = () => {
  const [data, setData] = useState<NotificationData | null>(null)

  useEffect(() => {
    const handleNotificationData = (event: any, data: NotificationData) => {
      setData(data)
    }

    ;(window as any).electron.ipcRenderer.on('notification-data', handleNotificationData)

    return () => {
      ;(window as any).electron.ipcRenderer.removeListener('notification-data', handleNotificationData)
    }
  }, [])

  if (!data) return null

  const handleClick = () => {
    ;(window as any).electron.ipcRenderer.invoke('click-notification')
  }

  const handleClose = () => {
    ;(window as any).electron.ipcRenderer.invoke('close-notification')
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        className={`
          p-4 rounded-lg shadow-lg mx-4 cursor-pointer
          ${data.urgency === 'high' 
            ? 'bg-red-500 text-white border-l-4 border-red-700' 
            : 'bg-yellow-500 text-white border-l-4 border-yellow-700'
          }
        `}
        onClick={handleClick}
      >
        <div className="flex justify-between items-start">
          <div>
            <h3 className="font-semibold text-sm">{data.title}</h3>
            <p className="text-xs mt-1 opacity-90">{data.body}</p>
          </div>
          <button 
            onClick={(e) => {
              e.stopPropagation()
              handleClose()
            }}
            className="text-white opacity-70 hover:opacity-100 -mt-1 -mr-2 p-2"
          >
            <XMarkIcon className="w-4 h-4" />
          </button>
        </div>
      </motion.div>
    </AnimatePresence>
  )
} 