import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { registerDefaults } from './language/registry/defaultRegistries'

// Register all core ComposeWeb components and modifiers
registerDefaults();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
