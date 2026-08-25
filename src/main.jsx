import React from 'react'
import ReactDOM from 'react-dom/client'
import { ThemeProvider } from 'next-themes'
import App from '@/App.jsx'
import '@/index.css'
import '@/mobile-theme.css'
import '@/lib/lightThemeFixes.css'
import '@/lib/lightModePremium.css'
import '@/lib/gradientAccents.css'
import '@/lib/premiumScroll.css'
import '@/lib/mobileOverhaul.css'
import '@/lib/mobilePremium.css'
import '@/lib/commandCenter.css'
import '@/lib/numberInputFix.css'
import '@/lib/cardInteractions.css'
import '@/lib/liquidGlass.css'
import '@/lib/lightFormEnhancements.css'
import { disableNumberInputSpin } from '@/lib/disableNumberInputSpin'

disableNumberInputSpin();

// Suppress benign ResizeObserver loop warning (browser layout quirk, not an app bug)
const _roErr = window.addEventListener('error', (e) => {
  if (e.message === 'ResizeObserver loop completed with undelivered notifications.') {
    e.stopImmediatePropagation();
    e.preventDefault();
  }
}, true);

ReactDOM.createRoot(document.getElementById('root')).render(
  <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={true}>
    <App />
  </ThemeProvider>
)