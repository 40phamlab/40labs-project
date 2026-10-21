/**
 * Computes initials from a customer name according to Phase 3 specification:
 * - Split on whitespace, drop empties.
 * - 2+ words -> first letter of first word + first letter of last word.
 * - 1 word -> first two letters.
 * - Uppercase.
 * - Non-letter leading chars (digits/symbols) are skipped.
 * - If nothing usable -> '?'.
 */
export function getInitials(name: string): string {
  if (!name || typeof name !== 'string') return '?';

  const words = name
    .trim()
    .split(/\s+/)
    .map((w) => w.replace(/^[^a-zA-Z]+/, ''))
    .filter(Boolean);

  if (words.length === 0) return '?';

  if (words.length === 1) {
    const letters = words[0].match(/[a-zA-Z]/g);
    if (!letters || letters.length === 0) return '?';
    return letters.slice(0, 2).join('').toUpperCase();
  }

  // 2+ words: first letter of first word + first letter of last word
  const firstLetter = words[0].match(/[a-zA-Z]/)?.[0] || '';
  const lastLetter = words[words.length - 1].match(/[a-zA-Z]/)?.[0] || '';

  const initials = `${firstLetter}${lastLetter}`.toUpperCase();
  return initials.length > 0 ? initials : '?';
}
