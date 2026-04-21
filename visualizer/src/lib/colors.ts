// Semantic color constants shared across the visualizer.
// All Cytoscape edge/highlight colors and entity default colors live here.

/** ER relationship edge highlight (selected / PathFinder) */
export const ER_HIGHLIGHT = '#84cc16'

/** Lineage edge base color */
export const LINEAGE_BASE = '#3b82f6'

/** Lineage edge highlight (selected / PathFinder) */
export const LINEAGE_HIGHLIGHT = '#f97316'

/** Consumer node default accent color */
export const CONSUMER_DEFAULT_COLOR = '#a78bfa'

/** Annotation (sticky note) default background color */
export const ANNOTATION_DEFAULT_COLOR = '#f59e0b'

/**
 * Returns '#000000' or '#ffffff' depending on the luminance of the given color,
 * so that text remains readable on any background.
 * Supports hex (#rgb / #rrggbb) and rgba(...) formats.
 */
export function contrastTextColor(bg: string): '#000000' | '#ffffff' {
  let r = 0, g = 0, b = 0
  const hex = bg.trim()
  if (hex.startsWith('#')) {
    const raw = hex.slice(1)
    if (raw.length === 3) {
      r = parseInt(raw[0] + raw[0], 16)
      g = parseInt(raw[1] + raw[1], 16)
      b = parseInt(raw[2] + raw[2], 16)
    } else {
      r = parseInt(raw.slice(0, 2), 16)
      g = parseInt(raw.slice(2, 4), 16)
      b = parseInt(raw.slice(4, 6), 16)
    }
  } else {
    const m = hex.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/)
    if (m) { r = +m[1]; g = +m[2]; b = +m[3] }
  }
  // WCAG relative luminance
  const toLinear = (v: number) => { const s = v / 255; return s <= 0.04045 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4 }
  const L = 0.2126 * toLinear(r) + 0.7152 * toLinear(g) + 0.0722 * toLinear(b)
  return L > 0.179 ? '#000000' : '#ffffff'
}
