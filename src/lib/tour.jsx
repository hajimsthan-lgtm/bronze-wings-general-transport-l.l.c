import { createContext, useContext, useState, useCallback } from 'react';

const TourContext = createContext(null);

export function TourProvider({ children }) {
  const [active, setActive] = useState(false);
  const [steps, setSteps] = useState([]);
  const [index, setIndex] = useState(0);

  const start = useCallback((s) => { setSteps(s); setIndex(0); setActive(true); }, []);
  const stop = useCallback(() => { setActive(false); setSteps([]); setIndex(0); }, []);
  const next = useCallback(() => setIndex((i) => i + 1), []);

  return (
    <TourContext.Provider value={{ active, steps, index, start, stop, next }}>
      {children}
    </TourContext.Provider>
  );
}

export const useTour = () => useContext(TourContext);

export function gatherTourSteps() {
  const els = Array.from(document.querySelectorAll('[data-tour]'));
  return els
    .map((el) => ({
      el,
      title: el.getAttribute('data-tour-title') || 'Section',
      en: el.getAttribute('data-tour-en') || '',
      ur: el.getAttribute('data-tour-ur') || '',
      ml: el.getAttribute('data-tour-ml') || '',
    }))
    .filter((s) => s.en || s.ur || s.ml);
}