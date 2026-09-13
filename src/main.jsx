import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.jsx'
import './index.css'

// Entry point: find the <div id="root"> from index.html and render App into it.
// StrictMode is a development-only helper that surfaces unsafe patterns early.
createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
