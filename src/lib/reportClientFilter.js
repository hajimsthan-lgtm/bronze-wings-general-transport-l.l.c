import { useSyncExternalStore } from 'react';

const KEY = 'bw-report-client';

const read = () => {
  try {
    return (typeof localStorage !== 'undefined' && localStorage.getItem(KEY)) || 'all';
  } catch {
    return 'all';
  }
};

let current = read();
const listeners = new Set();

function emit() {
  listeners.forEach((l) => l(current));
}

export function getReportClient() {
  return current;
}

export function setReportClient(value) {
  current = value || 'all';
  try { localStorage.setItem(KEY, current); } catch {}
  emit();
}

function subscribe(listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function useReportClient() {
  return useSyncExternalStore(subscribe, getReportClient, getReportClient);
}