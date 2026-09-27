import { existsSync, mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import * as chromeLauncher from 'chrome-launcher';
import lighthouse from 'lighthouse';
import type { LighthouseScores } from './types.js';

// Chrome's own sandbox needs privileges that most container runtimes deny;
// only drop it when we detect we're actually inside a container.
function isRunningInContainer(): boolean {
  return existsSync('/.dockerenv') || process.env.container !== undefined;
}

/**
 * Round a Lighthouse category's 0-1 score to a 0-100 integer, preserving
 * `null` for a category that wasn't evaluated instead of coercing it to 0.
 * @param score - Raw category score (0-1), or null/undefined if unevaluated.
 * @returns Rounded 0-100 score, or null if the category has no score.
 */
function roundScore(score: number | null | undefined): number | null {
  return score == null ? null : Math.round(score * 100);
}

/**
 * Launch headless Chrome and run Lighthouse against the given URL.
 * @param url - The URL to audit.
 * @returns Rounded 0-100 scores for performance, accessibility, best practices, and SEO.
 */
export async function fetchLighthouseScores(
  url: string,
): Promise<LighthouseScores> {
  const userDataDir = mkdtempSync(join(tmpdir(), '.lighthouse-'));

  let chrome: chromeLauncher.LaunchedChrome | undefined;

  try {
    chrome = await chromeLauncher.launch({
      chromeFlags: [
        '--headless',
        '--disable-gpu',
        ...(isRunningInContainer() ? ['--no-sandbox'] : []),
        `--user-data-dir=${userDataDir}`,
      ],
      userDataDir: userDataDir,
    });

    const result = await lighthouse(
      url,
      {
        port: chrome.port,
        output: 'json',
        logLevel: 'silent',
        onlyCategories: [
          'performance',
          'accessibility',
          'best-practices',
          'seo',
        ],
      },
      undefined,
    );

    if (!result) {
      throw new Error('Lighthouse failed to run');
    }

    const categories = result.lhr.categories;

    return {
      performance: roundScore(categories.performance?.score),
      accessibility: roundScore(categories.accessibility?.score),
      bestPractices: roundScore(categories['best-practices']?.score),
      seo: roundScore(categories.seo?.score),
    };
  } finally {
    if (chrome) {
      try {
        await chrome.kill();
      } catch {
        // Chrome may already be gone; the temp dir still needs removing below.
      }
    }

    // Chrome may briefly keep the folder locked after kill(); retry instead
    // of always paying a fixed delay.
    rmSync(userDataDir, {
      recursive: true,
      force: true,
      maxRetries: 3,
      retryDelay: 200,
    });
  }
}
