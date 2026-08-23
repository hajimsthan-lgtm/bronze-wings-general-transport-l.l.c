import { useSyncExternalStore } from 'react';

// Lightweight store so the Vendors page can publish its mode (analytics/browse)
// and view (all/providers) and the global TopBar can render controls without prop drilling.
// Mode is tracked per-view so each "page" has its own independent Analytics/Browse state.
let state = { view: 'all', allMode: 'analytics', providersMode: 'analytics' };
const listeners = new Set();

function emit() { listeners.forEach((l) => l()); }

export function getVendorsState() { return state; }
export function setVendorsView(view) { state = { ...state, view }; emit(); }
export function setVendorsMode(mode) {
  state = state.view === 'all'
    ? { ...state, allMode: mode }
    : { ...state, providersMode: mode };
  emit();
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