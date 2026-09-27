export type ScoreLevel = 'good' | 'average' | 'poor' | 'unknown';
/**
 * Classify a 0-100 Lighthouse score into the shared good/average/poor tiers
 * (thresholds fixed by ADR-0003), or 'unknown' for a category Lighthouse
 * couldn't evaluate (`null`). Markdown and SVG renderers each map this to
 * their own color representation instead of duplicating the 90/50 checks.
 * @param score - Lighthouse score (0-100), or null if unevaluated.
 * @returns 'good' (>=90), 'average' (>=50), 'poor', or 'unknown' (null).
 */
export declare function getScoreLevel(score: number | null): ScoreLevel;
//# sourceMappingURL=score-level.d.ts.map