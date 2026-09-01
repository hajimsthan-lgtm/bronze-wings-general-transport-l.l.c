import { useSyncExternalStore } from 'react';

// Lightweight store so the Vehicles page can publish its mode (analytics/browse)
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

export function getVehiclesState() { return state; }
export function setVehiclesMode(mode) { state = { ...state, mode }; emit(); }
export function setVehiclesView(view) { state = { ...state, view }; viewRef = view; emit(); }

export function setVehiclesData(filtered, load) {
  filteredRef = filtered || [];
  loadRef = load;
}
export function getVehiclesFiltered() { return filteredRef; }
export function getVehiclesLoad() { return loadRef; }
export function getVehiclesView() { return viewRef; }

export function getVehiclesSelected() { return state.selectedIds; }
export function setVehiclesSelected(ids) { state = { ...state, selectedIds: ids || [] }; emit(); }
export function clearVehiclesSelected() { state = { ...state, selectedIds: [] }; emit(); }
export function setVehiclesBulkDelete(fn) { bulkDeleteRef = fn; }
export function runVehiclesBulkDelete() { if (bulkDeleteRef) bulkDeleteRef(); }

export function subscribeVehicles(l) {
  listeners.add(l);
  return () => listeners.delete(l);
}

export function useVehiclesMode() {
  return useSyncExternalStore(subscribeVehicles, getVehiclesState, getVehiclesState);
}

export function useVehiclesSelected() {
  return useSyncExternalStore(subscribeVehicles, getVehiclesSelected, getVehiclesSelected);
}