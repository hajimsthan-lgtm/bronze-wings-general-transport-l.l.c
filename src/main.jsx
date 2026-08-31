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
import '@/lib/neonCards.css'
import '@/lib/fintechEdge.css'
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
const RO_LOOP_MSG = 'ResizeObserver loop completed with undelivered notifications.';
const isRoLoopError = (arg) => {
  if (!arg) return false;
  if (typeof arg === 'string') return arg.includes(RO_LOOP_MSG);
  if (arg instanceof Error) return arg.message === RO_LOOP_MSG;
  if (typeof arg?.message === 'string') return arg.message.includes(RO_LOOP_MSG);
  return false;
};
// Capture-phase listener: stops the error before app-level handlers see it.
window.addEventListener('error', (e) => {
  if (isRoLoopError(e?.error) || isRoLoopError(e?.message)) {
    e.stopImmediatePropagation();
    e.preventDefault();
    return false;
  }
}, true);
// Some browsers surface it as an unhandled promise rejection.
window.addEventListener('unhandledrejection', (e) => {
  if (isRoLoopError(e?.reason)) {
    e.stopImmediatePropagation();
    e.preventDefault();
  }
}, true);
// Silence it in console.error too.
const _origConsoleError = console.error.bind(console);
console.error = (...args) => {
  if (args.some(isRoLoopError)) return;
  _origConsoleError(...args);
};
const _origConsoleWarn = console.warn.bind(console);
console.warn = (...args) => {
  if (args.some(isRoLoopError)) return;
  _origConsoleWarn(...args);
};

ReactDOM.createRoot(document.getElementById('root')).render(
  <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={true}>
    <App />
  </ThemeProvider>
)