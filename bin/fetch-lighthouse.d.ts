import type { LighthouseScores } from './types.js';
/**
 * Launch headless Chrome and run Lighthouse against the given URL.
 * @param url - The URL to audit.
 * @returns Rounded 0-100 scores for performance, accessibility, best practices, and SEO.
 */
export declare function fetchLighthouseScores(url: string): Promise<LighthouseScores>;
//# sourceMappingURL=fetch-lighthouse.d.ts.map