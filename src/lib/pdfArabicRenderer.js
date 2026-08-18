/**
 * PDF Arabic Text Renderer
 *
 * jsPDF's built-in fonts (Helvetica, Times, Courier) don't include Arabic glyphs.
 * Instead of embedding a large Arabic font file (which would bloat the bundle and
 * still lack proper shaping/joining), we leverage the browser's native canvas API
 * which handles Arabic shaping, bidi ordering, and glyph rendering automatically.
 *
 * Text containing Arabic characters is rendered to a canvas, converted to PNG,
 * and placed as an image in the PDF — producing visually correct Arabic text.
 */

const ARABIC_RANGE = /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]/;

export function hasArabicText(text) {
  return ARABIC_RANGE.test(String(text || ''));
}

/**
 * Renders text to a canvas image for placement in a jsPDF document.
 * The browser's canvas API natively handles Arabic shaping and RTL bidi ordering.
 *
 * @param {string} text - The text to render
 * @param {number} fontSizePt - Font size in points (matching the jsPDF font size)
 * @param {number} maxWidthMm - Maximum cell width in millimeters
 * @param {number} lineHeightMm - Line height in millimeters
 * @param {[number, number, number]} color - RGB text color [r, g, b]
 * @returns {{ dataUrl: string, linesCount: number }}
 */
export function renderCellToImage(text, fontSizePt, maxWidthMm, lineHeightMm, color = [30, 30, 30]) {
  const SCALE = 3; // High DPI for crisp text in print
  const MM_TO_PX = 3.779528;
  const pxPerMm = MM_TO_PX * SCALE;
  const fontPx = fontSizePt * 1.3333 * SCALE;
  const maxWidthPx = Math.max(1, Math.floor(maxWidthMm * pxPerMm));
  const lineHeightPx = lineHeightMm * pxPerMm;

  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');

  // Set font for measuring
  ctx.font = `${fontPx}px sans-serif`;

  // Word-wrap using canvas metrics
  const words = String(text || '').split(/\s+/).filter(Boolean);
  const lines = [];
  let currentLine = '';

  for (const word of words) {
    const testLine = currentLine ? `${currentLine} ${word}` : word;
    if (ctx.measureText(testLine).width <= maxWidthPx) {
      currentLine = testLine;
    } else {
      if (currentLine) lines.push(currentLine);
      currentLine = word;
    }
  }
  if (currentLine) lines.push(currentLine);
  if (lines.length === 0) lines.push('');

  // Set canvas dimensions
  canvas.width = maxWidthPx;
  canvas.height = Math.ceil(lines.length * lineHeightPx);

  // Re-apply context settings after resize (resizing clears the context state)
  ctx.font = `${fontPx}px sans-serif`;
  ctx.fillStyle = `rgb(${color[0]}, ${color[1]}, ${color[2]})`;
  ctx.textBaseline = 'top';

  lines.forEach((line, i) => {
    // Detect RTL content and draw right-to-left
    const isRtl = ARABIC_RANGE.test(line);
    if (isRtl) {
      ctx.direction = 'rtl';
      ctx.fillText(line, maxWidthPx, i * lineHeightPx);
    } else {
      ctx.direction = 'ltr';
      ctx.fillText(line, 0, i * lineHeightPx);
    }
  });

  return {
    dataUrl: canvas.toDataURL('image/png'),
    linesCount: lines.length,
  };
}