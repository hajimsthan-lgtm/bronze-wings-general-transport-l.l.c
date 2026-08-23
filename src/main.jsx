import React from 'react'
import ReactDOM from 'react-dom/client'
import { ThemeProvider } from 'next-themes'
import App from '@/App.jsx'
import '@/index.css'
import '@/mobile-theme.css'
import '@/lib/lightThemeFixes.css'
import '@/lib/gradientAccents.css'
import '@/lib/premiumScroll.css'
import '@/lib/mobileOverhaul.css'
import '@/lib/mobilePremium.css'
import '@/lib/commandCenter.css'
import '@/lib/numberInputFix.css'
import '@/lib/cardInteractions.css'
import { disableNumberInputSpin } from '@/lib/disableNumberInputSpin'

disableNumberInputSpin();
ReactDOM.createRoot(document.getElementById('root')).render(
  <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={true}>
    <App />
  </ThemeProvider>
)