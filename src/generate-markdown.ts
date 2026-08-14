import type { LighthouseScores } from './types.js';

/**
 * Map a 0-100 score to a shields.io badge color name.
 * @param score - Lighthouse score (0-100).
 * @returns Color name: 'brightgreen' (>=90), 'yellow' (>=50), or 'red'.
 */
function getColor(score: number): string {
  if (score >= 90) return 'brightgreen';
  if (score >= 50) return 'yellow';
  return 'red';
}

/**
 * Render Lighthouse scores as a row of Markdown shields.io badges.
 * @param scores - Lighthouse scores to render.
 * @returns Markdown string with one badge per category, separated by `&emsp;`.
 */
export function generateMarkdown(scores: LighthouseScores): string {
  return [
    `![Accessibility](https://img.shields.io/badge/Accessibility-${scores.accessibility}-${getColor(scores.accessibility)}?style=flat-square)`,
    `![Best_Practices](https://img.shields.io/badge/Best_Practices-${scores.bestPractices}-${getColor(scores.bestPractices)}?style=flat-square)`,
    `![Performance](https://img.shields.io/badge/Performance-${scores.performance}-${getColor(scores.performance)}?style=flat-square)`,
    `![SEO](https://img.shields.io/badge/SEO-${scores.seo}-${getColor(scores.seo)}?style=flat-square)`,
  ].join('&emsp;');
}
