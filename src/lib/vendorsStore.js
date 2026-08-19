import { useSyncExternalStore } from 'react';

// Lightweight store so the Vendors page can publish its mode (analytics/browse)
// and the global TopBar can render controls without prop drilling.
let state = { mode: 'analytics' };
const listeners = new Set();

function emit() { listeners.forEach((l) => l()); }

export function getVendorsState() { return state; }
export function setVendorsMode(mode) { state = { ...state, mode }; emit(); }

export function subscribeVendors(l) {
  listeners.add(l);
  return () => listeners.delete(l);
}

export function useVendorsMode() {
  return useSyncExternalStore(subscribeVendors, getVendorsState, getVendorsState);
}