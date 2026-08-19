import { useSyncExternalStore } from 'react';

// Lightweight store so the Drivers page can publish its mode (analytics/browse)
// and view (grid/list) and the global TopBar can render controls without prop drilling.
// Also holds a ref to the latest filtered data + reload callback for Export/Import actions.
let state = { mode: 'analytics', view: 'list' };
const listeners = new Set();

// Non-reactive refs (functions/data not needed for render decisions)
let filteredRef = [];
let loadRef = null;
let viewRef = 'list';

function emit() { listeners.forEach((l) => l()); }

export function getDriversState() { return state; }
export function setDriversMode(mode) { state = { ...state, mode }; emit(); }
export function setDriversView(view) { state = { ...state, view }; viewRef = view; emit(); }

export function setDriversData(filtered, load) {
  filteredRef = filtered || [];
  loadRef = load;
}
export function getDriversFiltered() { return filteredRef; }
export function getDriversLoad() { return loadRef; }
export function getDriversView() { return viewRef; }

export function subscribeDrivers(l) {
  listeners.add(l);
  return () => listeners.delete(l);
}

export function useDriversMode() {
  return useSyncExternalStore(subscribeDrivers, getDriversState, getDriversState);
}