import { useSyncExternalStore } from 'react';

// Lightweight store so the MobileHeader filter input can publish its value
// and any page can subscribe — same pattern as operationsFilterStore.
let state = { value: '' };
const listeners = new Set();

function emit() { listeners.forEach((l) => l()); }

export function getMobileFilter() { return state.value; }

export function setMobileFilter(value) {
  state = { value };
  emit();
}

export function clearMobileFilter() {
  state = { value: '' };
  emit();
}

export function subscribeMobileFilter(l) {
  listeners.add(l);
  return () => listeners.delete(l);
}

export function useMobileFilter() {
  return useSyncExternalStore(subscribeMobileFilter, getMobileFilter, getMobileFilter);
}