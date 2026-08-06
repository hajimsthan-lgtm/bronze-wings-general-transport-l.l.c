import { createContext, useContext, useState, useCallback } from 'react';

const GlobalDateContext = createContext(null);

const monthStart = () => {
  const d = new Date();
  return new Date(d.getFullYear(), d.getMonth(), 1).toISOString().split('T')[0];
};
const todayStr = () => new Date().toISOString().split('T')[0];

export function GlobalDateProvider({ children }) {
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  const setToday = useCallback(() => {
    const t = todayStr();
    setDateFrom(t);
    setDateTo(t);
  }, []);

  return (
    <GlobalDateContext.Provider value={{ dateFrom, dateTo, setDateFrom, setDateTo, setToday }}>
      {children}
    </GlobalDateContext.Provider>
  );
}

export function useGlobalDate() {
  const ctx = useContext(GlobalDateContext);
  if (!ctx) return { dateFrom: monthStart(), dateTo: todayStr(), setDateFrom: () => {}, setDateTo: () => {}, setToday: () => {} };
  return ctx;
}

// Returns true when `dateStr` (yyyy-MM-dd) falls inside the global range [dateFrom, dateTo].
// Empty/missing dates are treated as in-range so records without a date still show.
export function inGlobalDateRange(dateStr, dateFrom, dateTo) {
  if (!dateStr) return true;
  if (dateFrom && dateStr < dateFrom) return false;
  if (dateTo && dateStr > dateTo) return false;
  return true;
}