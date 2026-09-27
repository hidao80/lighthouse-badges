import { describe, expect, it } from 'vitest';
import { generateSvg } from '../../src/generate-svg.js';
import type { LighthouseScores } from '../../src/types.js';

const baseScores: LighthouseScores = {
  performance: 95,
  accessibility: 100,
  bestPractices: 92,
  seo: 88,
};

describe('generateSvg', () => {
  it('renders a standalone SVG sized 480x120', () => {
    const svg = generateSvg(baseScores);

    expect(svg).toMatch(/^<svg width="480" height="120"/);
    expect(svg).toContain('viewBox="0 0 480 120"');
    expect(svg.trim().endsWith('</svg>')).toBe(true);
  });

  it('renders one donut per category with its score as the label', () => {
    const svg = generateSvg(baseScores);

    for (const score of Object.values(baseScores)) {
      expect(svg).toMatch(new RegExp(`<text[^>]*>\\s*${score}\\s*</text>`));
    }
  });

  it('uses the green stroke color for scores of 90 and above', () => {
    const svg = generateSvg({ ...baseScores, seo: 90 });
    const seoDonut = svg.split('translate(360, 0)')[1] ?? '';

    expect(seoDonut).toContain('#0cce6b');
  });

  it('uses the amber stroke color for scores between 50 and 89', () => {
    const svg = generateSvg({ ...baseScores, seo: 50 });
    const seoDonut = svg.split('translate(360, 0)')[1] ?? '';

    expect(seoDonut).toContain('#ffa400');
  });

  it('uses the red stroke color for scores below 50', () => {
    const svg = generateSvg({ ...baseScores, seo: 49 });
    const seoDonut = svg.split('translate(360, 0)')[1] ?? '';

    expect(seoDonut).toContain('#ff4e42');
  });

  it('sets a full stroke-dashoffset of 0 for a perfect score', () => {
    const svg = generateSvg({ ...baseScores, accessibility: 100 });
    const radius = 16;
    const circumference = 2 * Math.PI * radius;

    expect(svg).toContain(`stroke-dasharray="${circumference}"`);
    expect(svg).toContain('stroke-dashoffset="0"');
  });

  it('renders a null score as an N/A label with a grey, empty donut', () => {
    const svg = generateSvg({ ...baseScores, seo: null });
    const radius = 16;
    const circumference = 2 * Math.PI * radius;
    const seoDonut = svg.split('translate(360, 0)')[1] ?? '';

    expect(seoDonut).toContain('#9e9e9e');
    expect(seoDonut).toContain(`stroke-dashoffset="${circumference}"`);
    expect(svg).toMatch(/<text[^>]*>\s*N\/A\s*<\/text>/);
  });
});
