import { useSyncExternalStore } from 'react';

// Shared visibility store for the left navigation rail.
// `visible`   — whether the rail is shown at all (auto-vanish after idle)
// `expanded`  — whether the rail is widened to show glass labels + sub-routes
// The top sub-nav reads `visible` so it vanishes / returns together with the rail.
let visible = true;
let dimming = false;
let expanded = false;
let collapsed = false;
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
  isDimming: () => dimming,
  setDimming(v) {
    if (dimming !== v) {
      dimming = v;
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
  isCollapsed: () => collapsed,
  setCollapsed(v) {
    if (collapsed !== v) {
      collapsed = v;
      notify();
    }
  },
  toggleCollapsed() {
    collapsed = !collapsed;
    notify();
  },
  subscribe(l) {
    listeners.add(l);
    return () => listeners.delete(l);
  },
};

export function useRailVisible() {
  return useSyncExternalStore(railVisibility.subscribe, railVisibility.get, railVisibility.get);
}
export function useRailDimming() {
  return useSyncExternalStore(railVisibility.subscribe, railVisibility.isDimming, railVisibility.isDimming);
}

export function useRailExpanded() {
  return useSyncExternalStore(railVisibility.subscribe, railVisibility.isExpanded, railVisibility.isExpanded);
}
export function useRailCollapsed() {
  return useSyncExternalStore(railVisibility.subscribe, railVisibility.isCollapsed, railVisibility.isCollapsed);
}