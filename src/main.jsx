import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import './styles/chessground-base.css'
import './styles/chessground-pieces.css'
import './styles/chessground-pieces-uzbek.css'
import './styles/board-theme.css'
import App from './App.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
