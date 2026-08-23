import { useSyncExternalStore } from 'react';

// Lightweight store so the Operations page can publish its toolbar state
// (search, status filter, export/import config) and the global TopBar can
// render the controls without prop drilling — TopBar sits above the page
// outlet so context-in-tree won't reach it.
let state = {
  active: false, options: [], value: 'all', counts: {},
  search: '', mode: 'all',
  exportConfig: null,
  onImported: null,
};
const listeners = new Set();

function emit() { listeners.forEach((l) => l()); }

export function getOpsFilter() { return state; }

export function setOpsFilter(next) {
  state = { ...state, ...next };
  emit();
}

export function setOpsSearch(value) {
  state = { ...state, search: value };
  emit();
}

export function clearOpsFilter() {
  state = { active: false, options: [], value: 'all', counts: {}, search: '', mode: 'all', exportConfig: null, onImported: null };
  emit();
}

export function subscribeOpsFilter(l) {
  listeners.add(l);
  return () => listeners.delete(l);
}

export function useOpsFilter() {
  return useSyncExternalStore(subscribeOpsFilter, getOpsFilter, getOpsFilter);
}

// Selector that only re-renders when `search` changes — prevents infinite
// update loops when Operations publishes filter config to the store.
export function useOpsSearch() {
  return useSyncExternalStore(subscribeOpsFilter, () => state.search, () => state.search);
}