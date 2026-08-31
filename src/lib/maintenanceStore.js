import { useSyncExternalStore } from 'react';

// Lightweight store so the Maintenance page can publish its mode (analytics/browse)
// and the global TopBar can render the toggle without prop drilling.
// Also holds filtered data + selected ids for bulk export.
let state = { mode: 'analytics', data: [], selectedIds: [] };
const listeners = new Set();

function emit() { listeners.forEach((l) => l()); }

export function getMaintenanceMode() { return state.mode; }

export function setMaintenanceMode(mode) {
  state = { ...state, mode };
  emit();
}

export function getMaintenanceData() { return state.data; }
export function setMaintenanceData(data) { state = { ...state, data: data || [] }; emit(); }

export function getMaintenanceSelected() { return state.selectedIds; }
export function setMaintenanceSelected(ids) { state = { ...state, selectedIds: ids || [] }; emit(); }
export function clearMaintenanceSelected() { state = { ...state, selectedIds: [] }; emit(); }

export function subscribeMaintenanceMode(l) {
  listeners.add(l);
  return () => listeners.delete(l);
}

export function useMaintenanceMode() {
  return useSyncExternalStore(subscribeMaintenanceMode, getMaintenanceMode, getMaintenanceMode);
}

export function useMaintenanceSelected() {
  return useSyncExternalStore(subscribeMaintenanceMode, getMaintenanceSelected, getMaintenanceSelected);
}