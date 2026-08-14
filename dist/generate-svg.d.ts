import type { LighthouseScores } from './types.js';
/**
 * Render Lighthouse scores as an SVG containing one donut chart per category.
 * @param scores - Lighthouse scores to render.
 * @returns Standalone SVG markup, 480x120, with donuts for accessibility,
 * best practices, performance, and SEO in that order.
 */
export declare function generateSvg(scores: LighthouseScores): string;
//# sourceMappingURL=generate-svg.d.ts.map