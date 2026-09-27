/**
 * Classify a 0-100 Lighthouse score into the shared good/average/poor tiers
 * (thresholds fixed by ADR-0003), or 'unknown' for a category Lighthouse
 * couldn't evaluate (`null`). Markdown and SVG renderers each map this to
 * their own color representation instead of duplicating the 90/50 checks.
 * @param score - Lighthouse score (0-100), or null if unevaluated.
 * @returns 'good' (>=90), 'average' (>=50), 'poor', or 'unknown' (null).
 */
export function getScoreLevel(score) {
    if (score === null)
        return 'unknown';
    if (score >= 90)
        return 'good';
    if (score >= 50)
        return 'average';
    return 'poor';
}
//# sourceMappingURL=score-level.js.map