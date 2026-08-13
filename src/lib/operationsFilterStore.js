import { useSyncExternalStore } from 'react';

// Lightweight store so the Operations page can publish its status-filter
// state and the global TopBar can render the pills without prop drilling
// (TopBar renders above the page outlet, so context-in-tree won't reach it).
let state = { active: false, options: [], value: 'all', counts: {} };
const listeners = new Set();

function emit() { listeners.forEach((l) => l()); }

export function getOpsFilter() { return state; }

export function setOpsFilter(next) {
  state = { ...state, ...next };
  emit();
}

export function clearOpsFilter() {
  state = { active: false, options: [], value: 'all', counts: {} };
  emit();
}

export function subscribeOpsFilter(l) {
  listeners.add(l);
  return () => listeners.delete(l);
}

export function useOpsFilter() {
  return useSyncExternalStore(subscribeOpsFilter, getOpsFilter, getOpsFilter);
}