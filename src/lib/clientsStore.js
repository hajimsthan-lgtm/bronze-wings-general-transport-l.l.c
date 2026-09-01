import { useSyncExternalStore } from 'react';

// Lightweight store so the Clients page can publish its mode (analytics/browse)
// and view (grid/list) and the global TopBar can render controls without prop drilling.
// Also holds a ref to the latest filtered data + reload callback for Export/Import actions.
let state = { mode: 'analytics', view: 'list', selectedIds: [] };
const listeners = new Set();

// Non-reactive refs (functions/data not needed for render decisions)
let filteredRef = [];
let loadRef = null;
let viewRef = 'list';
let bulkDeleteRef = null;

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

export function getClientsSelected() { return state.selectedIds; }
export function setClientsSelected(ids) { state = { ...state, selectedIds: ids || [] }; emit(); }
export function clearClientsSelected() { state = { ...state, selectedIds: [] }; emit(); }
export function setClientsBulkDelete(fn) { bulkDeleteRef = fn; }
export function runClientsBulkDelete() { if (bulkDeleteRef) bulkDeleteRef(); }

export function subscribeClients(l) {
  listeners.add(l);
  return () => listeners.delete(l);
}

export function useClientsMode() {
  return useSyncExternalStore(subscribeClients, getClientsState, getClientsState);
}

export function useClientsSelected() {
  return useSyncExternalStore(subscribeClients, getClientsSelected, getClientsSelected);
}