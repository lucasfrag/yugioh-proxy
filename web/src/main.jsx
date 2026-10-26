import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { applyTheme, loadTheme } from './utils/themes'

// Aplica o tema salvo antes da primeira renderização (evita piscar no tema padrão)
applyTheme(loadTheme())

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
