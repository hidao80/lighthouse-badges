import type { LighthouseScores } from './types.js';

function getColor(score: number): string {
  if (score >= 90) return 'brightgreen';
  if (score >= 50) return 'yellow';
  return 'red';
}

export function generateMarkdown(scores: LighthouseScores): string {
  return [
    `![Accessibility](https://img.shields.io/badge/Accessibility-${scores.accessibility}-${getColor(scores.accessibility)}?style=flat-square)`,
    `![Best_Practices](https://img.shields.io/badge/Best_Practices-${scores.bestPractices}-${getColor(scores.bestPractices)}?style=flat-square)`,
    `![Performance](https://img.shields.io/badge/Performance-${scores.performance}-${getColor(scores.performance)}?style=flat-square)`,
    `![SEO](https://img.shields.io/badge/SEO-${scores.seo}-${getColor(scores.seo)}?style=flat-square)`,
  ].join('&emsp;');
}
