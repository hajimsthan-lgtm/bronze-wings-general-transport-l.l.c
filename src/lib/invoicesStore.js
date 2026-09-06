import { useSyncExternalStore } from 'react';

// Lightweight store so InvoicesPage can publish its filter state (clientFilter,
// statusFilter, clients list) and the global TopBar can render the filter
// controls on the left side without prop drilling.
let state = { clientFilter: 'all', statusFilter: 'all', clients: [], sortBy: 'created' };
const listeners = new Set();

function emit() { listeners.forEach((l) => l()); }

export function getInvoicesState() { return state; }
export function setInvoicesClientFilter(v) { state = { ...state, clientFilter: v }; emit(); }
export function setInvoicesStatusFilter(v) { state = { ...state, statusFilter: v }; emit(); }
export function setInvoicesClients(clients) { state = { ...state, clients: clients || [] }; emit(); }
export function setInvoicesSortBy(sortBy) { state = { ...state, sortBy }; emit(); }
export function clearInvoicesFilters() { state = { ...state, clientFilter: 'all', statusFilter: 'all', sortBy: 'created' }; emit(); }

export function subscribeInvoices(l) {
  listeners.add(l);
  return () => listeners.delete(l);
}

export function useInvoicesFilters() {
  return useSyncExternalStore(subscribeInvoices, getInvoicesState, getInvoicesState);
}