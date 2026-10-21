/**
 * Fixed palette of 8 saturated mid-tone background fills with white text (contrast >= 4.5:1).
 * Excludes strong blue (#3B82F6) and pink (#EC4899) used for gender dots.
 */
export const AVATAR_PALETTE = [
  'bg-emerald-600 text-white',
  'bg-amber-600 text-white',
  'bg-teal-600 text-white',
  'bg-purple-600 text-white',
  'bg-orange-700 text-white',
  'bg-indigo-600 text-white',
  'bg-stone-600 text-white',
  'bg-cyan-700 text-white',
];

/**
 * Deterministic hash function (djb2) to map customer ID to an avatar color index.
 * Never uses Math.random() so colors remain stable across re-renders, scroll, and sync.
 */
export function getAvatarColorClass(id: string): string {
  if (!id) return AVATAR_PALETTE[0];
  let hash = 5381;
  for (let i = 0; i < id.length; i++) {
    hash = (hash * 33) ^ id.charCodeAt(i);
  }
  const index = Math.abs(hash) % AVATAR_PALETTE.length;
  return AVATAR_PALETTE[index];
}
