import { StrictMode, useEffect } from 'react'
import { createRoot }            from 'react-dom/client'
import App                       from './App'
import { LanguageProvider }      from './lib/i18n'
import './index.css'

// ─────────────────────────────────────────────────────────────────
//  Bootstrap — nasconde il loader HTML statico e monta React
// ─────────────────────────────────────────────────────────────────
function Root() {
  useEffect(() => {
    // Il loader è definito in index.html come elemento statico.
    // Una volta che React è montato e il DOM è pronto, lo facciamo
    // svanire con la classe CSS .hidden (opacity: 0, pointer-events: none).
    const loader = document.getElementById('app-loader')
    if (loader) {
      loader.classList.add('hidden')
      // Rimuoviamo dal DOM dopo la transizione (0.4s definita in index.html)
      setTimeout(() => loader.remove(), 420)
    }
  }, [])

  return <App />
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <LanguageProvider>
      <Root />
    </LanguageProvider>
  </StrictMode>
)
