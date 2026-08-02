import { useSyncExternalStore } from 'react';

// Shared visibility store for the left navigation rail.
// `visible`   — whether the rail is shown at all (auto-vanish after idle)
// `expanded`  — whether the rail is widened to show glass labels + sub-routes
// The top sub-nav reads `visible` so it vanishes / returns together with the rail.
let visible = true;
let expanded = false;
const listeners = new Set();

const notify = () => listeners.forEach((l) => l());

export const railVisibility = {
  get: () => visible,
  set(v) {
    if (visible !== v) {
      visible = v;
      notify();
    }
  },
  isExpanded: () => expanded,
  setExpanded(v) {
    if (expanded !== v) {
      expanded = v;
      notify();
    }
  },
  subscribe(l) {
    listeners.add(l);
    return () => listeners.delete(l);
  },
};

export function useRailVisible() {
  return useSyncExternalStore(railVisibility.subscribe, railVisibility.get, railVisibility.get);
}

export function useRailExpanded() {
  return useSyncExternalStore(railVisibility.subscribe, railVisibility.isExpanded, railVisibility.isExpanded);
}