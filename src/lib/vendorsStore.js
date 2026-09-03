import { useSyncExternalStore } from 'react';

// Lightweight store so the Vendors page can publish its mode (analytics/browse)
// and view (all/providers) and the global TopBar can render controls without prop drilling.
// Mode is tracked per-view so each "page" has its own independent Analytics/Browse state.
let state = { view: 'all', allMode: 'analytics', providersMode: 'analytics', selectedIds: [] };
const listeners = new Set();
let bulkDeleteRef = null;

function emit() { listeners.forEach((l) => l()); }

export function getVendorsState() { return state; }
export function setVendorsView(view) { state = { ...state, view, selectedIds: [] }; emit(); }
export function setVendorsMode(mode) {
  state = state.view === 'all'
    ? { ...state, allMode: mode }
    : { ...state, providersMode: mode };
  emit();
}

export function setProvidersMode(mode) {
  state = { ...state, providersMode: mode };
  emit();
}

export function useProvidersMode() {
  return useSyncExternalStore(subscribeVendors, () => state.providersMode, () => 'analytics');
}

export function subscribeVendors(l) {
  listeners.add(l);
  return () => listeners.delete(l);
}

export function useVendorsMode() {
  return useSyncExternalStore(subscribeVendors, () => {
    return state.view === 'all' ? state.allMode : state.providersMode;
  }, () => 'analytics');
}

export function useVendorsView() {
  return useSyncExternalStore(subscribeVendors, () => getVendorsState().view, () => 'all');
}