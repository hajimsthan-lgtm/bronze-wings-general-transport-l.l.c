import { useState, useCallback, useRef, useEffect } from 'react';

/**
 * Per-card lock-on-click behavior.
 * First click locks the card (shows a redirect button + persistent glow).
 * Second click on the locked card, or clicking the redirect button, navigates.
 * Auto-unlocks after 4s if no second interaction.
 *
 * @param {Function} onNavigate - called when the card should navigate (second click or redirect button)
 * @returns {{ locked, handleClick, handleRedirect, unlock }}
 */
export function useCardLock(onNavigate) {
  const [locked, setLocked] = useState(false);
  const timerRef = useRef(null);
  const navRef = useRef(onNavigate);
  navRef.current = onNavigate;

  const clearTimer = () => {
    if (timerRef.current) { clearTimeout(timerRef.current); timerRef.current = null; }
  };

  const unlock = useCallback(() => {
    setLocked(false);
    clearTimer();
  }, []);

  const handleClick = useCallback(() => {
    if (locked) {
      // Second click → navigate
      setLocked(false);
      clearTimer();
      navRef.current?.();
    } else {
      // First click → lock, auto-unlock after 4s
      setLocked(true);
      clearTimer();
      timerRef.current = setTimeout(() => setLocked(false), 4000);
    }
  }, [locked]);

  const handleRedirect = useCallback(() => {
    setLocked(false);
    clearTimer();
    navRef.current?.();
  }, []);

  useEffect(() => () => clearTimer(), []);

  return { locked, handleClick, handleRedirect, unlock };
}

/**
 * Tracks mouse position over a card to drive a cursor-following spotlight.
 * Sets --mx and --my CSS variables (in %) on the element.
 *
 * @returns {{ onMouseMove: Function }}
 */
export function useSpotlight() {
  const onMouseMove = useCallback((e) => {
    const el = e.currentTarget;
    const rect = el.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    el.style.setProperty('--mx', `${x}%`);
    el.style.setProperty('--my', `${y}%`);
  }, []);
  return { onMouseMove };
}

/**
 * Auto-scrolls an element into view when it becomes locked.
 * Pass the locked boolean; on transition to true, scrolls smoothly.
 */
export function useScrollIntoViewWhenLocked(locked) {
  const ref = useRef(null);
  useEffect(() => {
    if (locked && ref.current) {
      ref.current.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }, [locked]);
  return ref;
}