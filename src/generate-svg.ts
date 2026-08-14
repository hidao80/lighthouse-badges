import type { LighthouseScores } from './types.js';

/**
 * Map a 0-100 score to a donut-chart stroke color.
 * @param score - Lighthouse score (0-100).
 * @returns Hex color: green (>=90), amber (>=50), or red.
 */
function getSvgColor(score: number): string {
  if (score >= 90) return '#0cce6b';
  if (score >= 50) return '#ffa400';
  return '#ff4e42';
}

/**
 * Build a single donut-chart SVG fragment for one score.
 * @param score - Lighthouse score (0-100).
 * @param color - Stroke color for the filled arc and label text.
 * @param x - Horizontal translate offset for this donut within the parent SVG.
 * @returns SVG `<g>` markup for the donut and its centered score label.
 */
function createDonut(score: number, color: string, x: number): string {
  const radius = 16;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - score / 100);

  return `
    <g transform="translate(${x}, 0)">
      <circle cx="60" cy="60" r="${radius}" fill="none" stroke="#e0e0e0" stroke-width="8" transform="rotate(-90 60 60)" />
      <circle cx="60" cy="60" r="${radius}" fill="none" stroke="${color}" stroke-width="8"
        stroke-dasharray="${circumference}" stroke-dashoffset="${offset}"
        stroke-linecap="round" transform="rotate(-90 60 60)" />
      <text x="60" y="70" text-anchor="middle" font-size="22" font-family="Arial" fill="${color}">
        ${score}
      </text>
    </g>
  `;
}

/**
 * Render Lighthouse scores as an SVG containing one donut chart per category.
 * @param scores - Lighthouse scores to render.
 * @returns Standalone SVG markup, 480x120, with donuts for accessibility,
 * best practices, performance, and SEO in that order.
 */
export function generateSvg(scores: LighthouseScores): string {
  return `
<svg width="480" height="120" viewBox="0 0 480 120" xmlns="http://www.w3.org/2000/svg">
  ${createDonut(scores.accessibility, getSvgColor(scores.accessibility), 0)}
  ${createDonut(scores.bestPractices, getSvgColor(scores.bestPractices), 120)}
  ${createDonut(scores.performance, getSvgColor(scores.performance), 240)}
  ${createDonut(scores.seo, getSvgColor(scores.seo), 360)}
</svg>
  `.trim();
}
