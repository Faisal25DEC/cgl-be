/**
 * Visible numbering utilities.
 * Book & Chapter: start 000.00, step 5
 * Record: start 000.00, step 10 (per-book scope)
 */

/** Format a number with two decimals as a string with leading zeros up to 3 integer digits. */
export function formatVisible(n) {
  const fixed = n.toFixed(2);
  // ensure at least 3 integer digits
  const [int, dec] = fixed.split('.');
  const padded = int.padStart(3, '0');
  return `${padded}.${dec}`;
}

/** Returns the next visible number given the last one and a step size. */
export function nextVisible(lastStr, step) {
  if (!lastStr) return formatVisible(0);
  const n = parseFloat(lastStr);
  const next = n + step;
  return formatVisible(next);
}

/** Compare (for sorting) two visible numbers like "012.50". */
export function cmpVisible(a, b) {
  return parseFloat(a) - parseFloat(b);
}
