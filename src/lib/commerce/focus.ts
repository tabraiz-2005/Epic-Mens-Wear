/** Phone crop position for the homepage hero, as a percentage from the photo's left edge. */
export function focusPct(v: string | null | undefined): number {
  if (v === 'left') return 20;
  if (v === 'right') return 80;
  if (v === 'center' || v == null || v === '') return 50;
  const n = Number(v);
  return Number.isFinite(n) ? Math.min(100, Math.max(0, Math.round(n))) : 50;
}
