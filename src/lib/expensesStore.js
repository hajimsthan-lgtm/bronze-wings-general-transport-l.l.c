import { useSyncExternalStore } from 'react';

// Lightweight store so the Expenses page can publish its mode (analytics/browse)
// and the global TopBar can render the toggle without prop drilling.
// Also holds filtered data + selected ids for bulk export.
let state = { mode: 'analytics', data: [], selectedIds: [] };
const listeners = new Set();

function emit() { listeners.forEach((l) => l()); }

export function getExpensesMode() { return state.mode; }

export function setExpensesMode(mode) {
  state = { ...state, mode };
  emit();
}

export function getExpensesData() { return state.data; }
export function setExpensesData(data) { state = { ...state, data: data || [] }; emit(); }

export function getExpensesSelected() { return state.selectedIds; }
export function setExpensesSelected(ids) { state = { ...state, selectedIds: ids || [] }; emit(); }
export function clearExpensesSelected() { state = { ...state, selectedIds: [] }; emit(); }

export function subscribeExpensesMode(l) {
  listeners.add(l);
  return () => listeners.delete(l);
}

export function useExpensesMode() {
  return useSyncExternalStore(subscribeExpensesMode, getExpensesMode, getExpensesMode);
}

export function useExpensesSelected() {
  return useSyncExternalStore(subscribeExpensesMode, getExpensesSelected, getExpensesSelected);
}