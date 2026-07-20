import { useSearchParams } from 'react-router-dom';

/**
 * Manages sheet open/close state via URL search param (?open=key).
 * Opening pushes a new history entry so Android hardware back closes the sheet.
 * Closing replaces the current entry to avoid stray history entries.
 */
export function useSheetUrlState(key) {
  const [searchParams, setSearchParams] = useSearchParams();
  const isOpen = searchParams.get('open') === key;

  const setOpen = (val) => {
    const next = new URLSearchParams(searchParams);
    if (val) next.set('open', key);
    else next.delete('open');
    setSearchParams(next, { replace: !val });
  };

  return [isOpen, setOpen];
}