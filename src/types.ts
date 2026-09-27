export interface LighthouseScores {
  performance: number | null;
  accessibility: number | null;
  bestPractices: number | null;
  seo: number | null;
}

export type OutputMode = 'markdown' | 'json' | 'svg';
