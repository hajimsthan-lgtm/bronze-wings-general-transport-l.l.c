import { useSyncExternalStore } from 'react';

// Lightweight store so the Maintenance page can publish its mode (analytics/browse)
// and the global TopBar can render the toggle without prop drilling.
let state = { mode: 'analytics' };
const listeners = new Set();

function emit() { listeners.forEach((l) => l()); }

export function getMaintenanceMode() { return state.mode; }

export function setMaintenanceMode(mode) {
  state = { ...state, mode };
  emit();
}

export function subscribeMaintenanceMode(l) {
  listeners.add(l);
  return () => listeners.delete(l);
}

export function useMaintenanceMode() {
  return useSyncExternalStore(subscribeMaintenanceMode, getMaintenanceMode, getMaintenanceMode);
}