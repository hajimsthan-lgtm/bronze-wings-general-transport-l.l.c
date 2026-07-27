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

/* Collect tour steps for the current page.
   1. Authored sections: any element with [data-tour] (title + en/ur/ml).
   2. Auto-discovery: meaningful visible sections/cards on the page. */
export function gatherTourSteps() {
  const explicit = Array.from(document.querySelectorAll('[data-tour]'));
  if (explicit.length) {
    return explicit
      .map((el) => ({
        el,
        title: el.getAttribute('data-tour-title') || 'Section',
        en: el.getAttribute('data-tour-en') || '',
        ur: el.getAttribute('data-tour-ur') || '',
        ml: el.getAttribute('data-tour-ml') || '',
      }))
      .filter((s) => s.en || s.ur || s.ml);
  }

  // Auto-discover card-like sections by computed style (works on any page regardless of class names).
  const root = document.querySelector('main') || document.querySelector('[role="main"]') || document.body;
  const all = Array.from(root.querySelectorAll('div, section, a, article'));
  const cards = [];
  for (const el of all) {
    if ((el.innerText || '').trim().length < 4) continue;
    const r = el.getBoundingClientRect();
    if (r.width < 160 || r.height < 60) continue;
    const st = getComputedStyle(el);
    if (st.display === 'none' || st.visibility === 'hidden') continue;
    if (parseFloat(st.opacity || '1') === 0) continue;
    if (parseFloat(st.borderTopLeftRadius || '0') < 10) continue;
    const bgFilled = st.backgroundColor && !/transparent|rgba\(0,\s*0,\s*0,\s*0\)/.test(st.backgroundColor);
    const hasBorder = parseFloat(st.borderTopWidth || '0') > 0;
    const hasShadow = st.boxShadow && st.boxShadow !== 'none';
    if (!bgFilled && !hasBorder && !hasShadow) continue;
    cards.push(el);
  }
  // Keep leaf-most cards (those not containing another substantial card).
  const leaves = cards.filter((el) => !cards.some((c) => c !== el && el.contains(c) && c.getBoundingClientRect().width > 90));
  // De-duplicate overlapping.
  const chosen = [];
  for (const el of leaves) {
    if (chosen.some((c) => (c.contains(el) || el.contains(c)) && c !== el)) continue;
    chosen.push(el);
  }

  const seen = new Set();
  return chosen.slice(0, 18).map((el) => {
    const heading = el.querySelector('h1,h2,h3,h4,p,span');
    let title = (el.getAttribute('aria-label') || heading?.innerText || el.innerText || '').trim().split('\n')[0].slice(0, 64);
    if (!title) title = 'Section';
    if (seen.has(title)) title = title + ' ' + (seen.size + 1);
    seen.add(title);
    const body = (el.innerText || '').trim().replace(/\s+/g, ' ').slice(0, 160);
    return {
      el,
      title,
      en: body ? `${title} — ${body}` : `${title} — overview of this section.`,
      ur: '',
      ml: '',
    };
  });
}