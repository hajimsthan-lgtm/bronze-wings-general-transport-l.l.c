import { useSyncExternalStore } from 'react';

// Lightweight store so the Fuel page can publish its mode (analytics/browse)
// and the global TopBar can render the toggle without prop drilling.
let state = { mode: 'analytics' };
const listeners = new Set();

function emit() { listeners.forEach((l) => l()); }

export function getFuelMode() { return state.mode; }

export function setFuelMode(mode) {
  state = { ...state, mode };
  emit();
}

export function subscribeFuelMode(l) {
  listeners.add(l);
  return () => listeners.delete(l);
}

export function useFuelMode() {
  return useSyncExternalStore(subscribeFuelMode, getFuelMode, getFuelMode);
}