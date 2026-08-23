import { useSyncExternalStore } from 'react';

// Lightweight store so LedgerPage (Bank Reconciliation / Petty Cash) can publish
// its mode/view + options and the global TopBar can render the toggles in the
// sub-header without prop drilling.
let state = { mode: null, view: 'statement', entityName: null, modeOptions: [], viewOptions: [] };
const listeners = new Set();

function emit() { listeners.forEach((l) => l()); }

export function getLedgerState() { return state; }

export function initLedger(entityName, defaultMode, modeOptions, viewOptions) {
  if (state.entityName !== entityName) {
    state = { mode: defaultMode, view: 'statement', entityName, modeOptions, viewOptions };
    emit();
  } else {
    const modeChanged = JSON.stringify(state.modeOptions) !== JSON.stringify(modeOptions);
    const viewChanged = JSON.stringify(state.viewOptions) !== JSON.stringify(viewOptions);
    if (modeChanged || viewChanged) {
      state = { ...state, modeOptions, viewOptions };
      emit();
    }
  }
}

export function setLedgerMode(mode) {
  state = { ...state, mode };
  emit();
}

export function setLedgerView(view) {
  state = { ...state, view };
  emit();
}

function subscribe(l) {
  listeners.add(l);
  return () => listeners.delete(l);
}

export function useLedgerState() {
  return useSyncExternalStore(subscribe, getLedgerState, getLedgerState);
}