import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.jsx'
import './index.css'

// Prevent number inputs from changing value on scroll
document.addEventListener('wheel', (event) => {
  if (document.activeElement.type === 'number') {
    document.activeElement.blur();
  }
});

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
