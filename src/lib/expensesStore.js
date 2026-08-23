import { useSyncExternalStore } from 'react';

// Lightweight store so the Expenses page can publish its mode (analytics/browse)
// and the global TopBar can render the toggle without prop drilling.
let state = { mode: 'analytics' };
const listeners = new Set();

function emit() { listeners.forEach((l) => l()); }

export function getExpensesMode() { return state.mode; }

export function setExpensesMode(mode) {
  state = { ...state, mode };
  emit();
}

export function subscribeExpensesMode(l) {
  listeners.add(l);
  return () => listeners.delete(l);
}

export function useExpensesMode() {
  return useSyncExternalStore(subscribeExpensesMode, getExpensesMode, getExpensesMode);
}