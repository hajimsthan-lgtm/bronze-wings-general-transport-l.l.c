import { useSyncExternalStore } from 'react';

// Lightweight store so the Clients page can publish its mode (analytics/browse)
// and view (grid/list) and the global TopBar can render controls without prop drilling.
// Also holds a ref to the latest filtered data + reload callback for Export/Import actions.
let state = { mode: 'analytics', view: 'list' };
const listeners = new Set();

// Non-reactive refs (functions/data not needed for render decisions)
let filteredRef = [];
let loadRef = null;
let viewRef = 'list';

function emit() { listeners.forEach((l) => l()); }

export function getClientsState() { return state; }
export function setClientsMode(mode) { state = { ...state, mode }; emit(); }
export function setClientsView(view) { state = { ...state, view }; viewRef = view; emit(); }

export function setClientsData(filtered, load) {
  filteredRef = filtered || [];
  loadRef = load;
}
export function getClientsFiltered() { return filteredRef; }
export function getClientsLoad() { return loadRef; }
export function getClientsView() { return viewRef; }

export function subscribeClients(l) {
  listeners.add(l);
  return () => listeners.delete(l);
}

export function useClientsMode() {
  return useSyncExternalStore(subscribeClients, getClientsState, getClientsState);
}