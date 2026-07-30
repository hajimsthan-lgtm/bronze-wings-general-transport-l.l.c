import { useSyncExternalStore } from 'react';

// Shared visibility store for the left navigation rail.
// The top sub-nav reads this so it vanishes / returns together with the rail.
let visible = true;
const listeners = new Set();

export const railVisibility = {
  get: () => visible,
  set(v) {
    if (visible !== v) {
      visible = v;
      listeners.forEach((l) => l());
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