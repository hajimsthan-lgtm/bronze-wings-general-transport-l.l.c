import { useSyncExternalStore } from 'react';

// Lightweight store so the Salary page can publish its mode (analytics/browse)
// and the global TopBar can render the toggle without prop drilling.
let state = { mode: 'analytics', data: [], selectedIds: [] };
const listeners = new Set();

function emit() { listeners.forEach((l) => l()); }

export function getSalaryMode() { return state.mode; }
export function setSalaryMode(mode) { state = { ...state, mode }; emit(); }

export function getSalaryData() { return state.data; }
export function setSalaryData(data) { state = { ...state, data: data || [] }; emit(); }

export function getSalarySelected() { return state.selectedIds; }
export function setSalarySelected(ids) { state = { ...state, selectedIds: ids || [] }; emit(); }
export function clearSalarySelected() { state = { ...state, selectedIds: [] }; emit(); }

export function subscribeSalary(l) {
  listeners.add(l);
  return () => listeners.delete(l);
}

export function useSalaryMode() {
  return useSyncExternalStore(subscribeSalary, getSalaryMode, getSalaryMode);
}

export function useSalarySelected() {
  return useSyncExternalStore(subscribeSalary, getSalarySelected, getSalarySelected);
}