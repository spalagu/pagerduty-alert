import React from 'react'
import { createRoot } from 'react-dom/client'
import { LogViewer } from './pages/LogViewer'
import './styles/main.css'

const container = document.getElementById('root')
if (container) {
  const root = createRoot(container)
  root.render(
    <React.StrictMode>
      <LogViewer />
    </React.StrictMode>
  )
} 