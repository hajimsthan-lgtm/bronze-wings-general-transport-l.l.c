/**
 * Form enhancement utilities — auto-capitalization and field-jumping.
 *
 * autoCap(value)
 *   Title-cases a string: capitalizes the first letter of each word,
 *   preserving existing capitals (e.g. "ABC LLC" stays "ABC LLC").
 *   Handles common separators: spaces, hyphens, slashes.
 *
 * autoTab(event, { maxLength, nextId, nextRef })
 *   When an input reaches maxLength characters, focus jumps to the next
 *   field identified by nextId (DOM id) or nextRef (React ref).
 *   Also fires on Enter key for a snappy tab-on-enter feel.
 *
 * setupAutoTab(containerEl)
 *   Scans a container for inputs with `data-autotab-max` and `data-autotab-next`
 *   attributes and wires up auto-tabbing automatically. Call once on mount.
 */

export function autoCap(value) {
  if (!value) return value;
  // Split on word boundaries but keep separators
  return value.replace(/\b([a-z])/g, (m, ch) => ch.toUpperCase());
}

export function autoTab(event, { maxLength, nextId, nextRef } = {}) {
  const el = event.target;
  // Jump on maxLength reached
  if (maxLength && el.value.length >= maxLength) {
    let next = null;
    if (nextRef?.current) {
      next = nextRef.current;
    } else if (nextId) {
      next = document.getElementById(nextId);
    } else {
      // Fall back to the next focusable element in DOM order
      const focusables = el.form
        ? Array.from(el.form.querySelectorAll('input, select, textarea, button'))
        : [];
      const idx = focusables.indexOf(el);
      if (idx >= 0 && idx < focusables.length - 1) next = focusables[idx + 1];
    }
    if (next) {
      next.focus();
      if (next.select) next.select();
    }
  }
  // Jump on Enter (unless it's a textarea)
  if (event.key === 'Enter' && el.tagName !== 'TEXTAREA') {
    const focusables = el.form
      ? Array.from(el.form.querySelectorAll('input, select, textarea, button'))
      : [];
    const idx = focusables.indexOf(el);
    if (idx >= 0 && idx < focusables.length - 1) {
      event.preventDefault();
      focusables[idx + 1].focus();
      if (focusables[idx + 1].select) focusables[idx + 1].select();
    }
  }
}

/**
 * Wire up auto-tabbing for all elements inside `containerEl` that have
 * `data-autotab-max` (number) and optionally `data-autotab-next` (element id).
 * Returns a cleanup function.
 */
export function setupAutoTab(containerEl) {
  if (!containerEl) return () => {};
  const handler = (e) => {
    const el = e.target;
    const max = parseInt(el.getAttribute('data-autotab-max'), 10);
    const nextId = el.getAttribute('data-autotab-next');
    if (max || e.key === 'Enter') {
      autoTab(e, { maxLength: max, nextId });
    }
  };
  containerEl.addEventListener('input', handler);
  containerEl.addEventListener('keydown', handler);
  return () => {
    containerEl.removeEventListener('input', handler);
    containerEl.removeEventListener('keydown', handler);
  };
}