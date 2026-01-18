export interface LighthouseScores {
  performance: number;
  accessibility: number;
  bestPractices: number;
  seo: number;
}

export type OutputMode = 'markdown' | 'json' | 'svg';
