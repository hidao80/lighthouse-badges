import { getScoreLevel } from './score-level.js';
const BADGE_COLORS = {
    good: 'brightgreen',
    average: 'yellow',
    poor: 'red',
    unknown: 'lightgrey',
};
/**
 * Map a 0-100 score (or null) to a shields.io badge color name.
 * @param score - Lighthouse score (0-100), or null if unevaluated.
 * @returns shields.io color name.
 */
function getColor(score) {
    return BADGE_COLORS[getScoreLevel(score)];
}
/**
 * Render a score as badge message text, using a URL-encoded "N/A" for a
 * category Lighthouse couldn't evaluate so it survives shields.io's URL path.
 * @param score - Lighthouse score (0-100), or null if unevaluated.
 * @returns The score as a string, or `N%2FA`.
 */
function formatScore(score) {
    return score === null ? 'N%2FA' : String(score);
}
/**
 * Render Lighthouse scores as a row of Markdown shields.io badges.
 * @param scores - Lighthouse scores to render.
 * @returns Markdown string with one badge per category, separated by `&emsp;`.
 */
export function generateMarkdown(scores) {
    return [
        `![Accessibility](https://img.shields.io/badge/Accessibility-${formatScore(scores.accessibility)}-${getColor(scores.accessibility)}?style=flat-square)`,
        `![Best_Practices](https://img.shields.io/badge/Best_Practices-${formatScore(scores.bestPractices)}-${getColor(scores.bestPractices)}?style=flat-square)`,
        `![Performance](https://img.shields.io/badge/Performance-${formatScore(scores.performance)}-${getColor(scores.performance)}?style=flat-square)`,
        `![SEO](https://img.shields.io/badge/SEO-${formatScore(scores.seo)}-${getColor(scores.seo)}?style=flat-square)`,
    ].join('&emsp;');
}
//# sourceMappingURL=generate-markdown.js.map