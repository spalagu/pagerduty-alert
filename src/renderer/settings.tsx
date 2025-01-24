import React from 'react'
import { createRoot } from 'react-dom/client'
import { Settings } from './pages/Settings'
import './styles.css'

const container = document.getElementById('root')
const root = createRoot(container!)
root.render(<Settings />) 