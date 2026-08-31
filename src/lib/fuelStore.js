import { useSyncExternalStore } from 'react';

// Lightweight store so the Fuel page can publish its mode (analytics/browse)
// and the global TopBar can render the toggle without prop drilling.
// Also holds filtered data + selected ids for bulk export.
let state = { mode: 'analytics', data: [], selectedIds: [] };
const listeners = new Set();

function emit() { listeners.forEach((l) => l()); }

export function getFuelMode() { return state.mode; }

export function setFuelMode(mode) {
  state = { ...state, mode };
  emit();
}

export function getFuelData() { return state.data; }
export function setFuelData(data) { state = { ...state, data: data || [] }; emit(); }

export function getFuelSelected() { return state.selectedIds; }
export function setFuelSelected(ids) { state = { ...state, selectedIds: ids || [] }; emit(); }
export function clearFuelSelected() { state = { ...state, selectedIds: [] }; emit(); }

export function subscribeFuelMode(l) {
  listeners.add(l);
  return () => listeners.delete(l);
}

export function useFuelMode() {
  return useSyncExternalStore(subscribeFuelMode, getFuelMode, getFuelMode);
}

export function useFuelSelected() {
  return useSyncExternalStore(subscribeFuelMode, getFuelSelected, getFuelSelected);
}