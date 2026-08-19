// Global guard: stop mouse-wheel and arrow keys from changing number-input values.
// Applied once at app startup — covers every <input type="number"> app-wide.
export function disableNumberInputSpin() {
  // Mouse wheel: blur the focused number input so the wheel scrolls the page
  // instead of incrementing the value.
  document.addEventListener(
    "wheel",
    (e) => {
      const t = e.target;
      if (
        t &&
        t.tagName === "INPUT" &&
        t.type === "number" &&
        document.activeElement === t
      ) {
        t.blur();
      }
    },
    { passive: true }
  );

  // Arrow Up/Down + PageUp/PageDown: prevent native increment/decrement.
  document.addEventListener("keydown", (e) => {
    const t = e.target;
    if (
      t &&
      t.tagName === "INPUT" &&
      t.type === "number" &&
      document.activeElement === t &&
      ["ArrowUp", "ArrowDown", "PageUp", "PageDown"].includes(e.key)
    ) {
      e.preventDefault();
    }
  });
}