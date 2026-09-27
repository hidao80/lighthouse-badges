import { describe, expect, it } from 'vitest';
import { generateMarkdown } from '../../src/generate-markdown.js';
import type { LighthouseScores } from '../../src/types.js';

const baseScores: LighthouseScores = {
  performance: 95,
  accessibility: 100,
  bestPractices: 92,
  seo: 88,
};

describe('generateMarkdown', () => {
  it('renders one shields.io badge per category', () => {
    const markdown = generateMarkdown(baseScores);
    const badges = markdown.split('&emsp;');

    expect(badges).toHaveLength(4);
    expect(badges[0]).toContain('Accessibility-100-brightgreen');
    expect(badges[1]).toContain('Best_Practices-92-brightgreen');
    expect(badges[2]).toContain('Performance-95-brightgreen');
    expect(badges[3]).toContain('SEO-88-yellow');
  });

  it('uses brightgreen for scores of 90 and above', () => {
    const markdown = generateMarkdown({ ...baseScores, seo: 90 });

    expect(markdown).toContain('SEO-90-brightgreen');
  });

  it('uses yellow for scores between 50 and 89', () => {
    const markdown = generateMarkdown({ ...baseScores, seo: 50 });

    expect(markdown).toContain('SEO-50-yellow');
  });

  it('uses red for scores below 50', () => {
    const markdown = generateMarkdown({ ...baseScores, seo: 49 });

    expect(markdown).toContain('SEO-49-red');
  });

  it('uses red for a score of 0', () => {
    const markdown = generateMarkdown({ ...baseScores, seo: 0 });

    expect(markdown).toContain('SEO-0-red');
  });

  it('renders a null score as N/A with a lightgrey badge', () => {
    const markdown = generateMarkdown({ ...baseScores, seo: null });

    expect(markdown).toContain('SEO-N%2FA-lightgrey');
  });
});
