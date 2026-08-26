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

// Suppress benign ResizeObserver loop warning (browser layout quirk, not an app bug).
// Debounce the callback via requestAnimationFrame so notifications are delivered in
// the next frame — this breaks the synchronous resize loop that triggers the warning.
if (typeof ResizeObserver !== 'undefined') {
  const _OrigRO = window.ResizeObserver;
  window.ResizeObserver = function (cb) {
    let ticking = false;
    let pendingEntries = [];
    let pendingObserver = null;
    const flush = () => {
      ticking = false;
      const entries = pendingEntries;
      const obs = pendingObserver;
      pendingEntries = [];
      pendingObserver = null;
      try { cb(entries, obs); }
      catch (err) {
        if (err?.message !== 'ResizeObserver loop completed with undelivered notifications.') throw err;
      }
    };
    const wrapped = (entries, observer) => {
      pendingEntries = entries;
      pendingObserver = observer;
      if (!ticking) { ticking = true; requestAnimationFrame(flush); }
    };
    return new _OrigRO(wrapped);
  };
  window.ResizeObserver.prototype = _OrigRO.prototype;
}
window.addEventListener('error', (e) => {
  if (e?.message === 'ResizeObserver loop completed with undelivered notifications.') {
    e.stopImmediatePropagation();
    e.preventDefault();
  }
}, true);
const _origConsoleError = console.error.bind(console);
console.error = (...args) => {
  if (typeof args[0] === 'string' && args[0].includes('ResizeObserver loop completed with undelivered notifications')) return;
  _origConsoleError(...args);
};

ReactDOM.createRoot(document.getElementById('root')).render(
  <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={true}>
    <App />
  </ThemeProvider>
)