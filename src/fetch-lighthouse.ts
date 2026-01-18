import lighthouse from 'lighthouse';
import * as chromeLauncher from 'chrome-launcher';
import { mkdtempSync, rmSync } from 'fs';
import { resolve } from 'path';
import type { LighthouseScores } from './types.js';

// Set TEMP to current directory for lighthouse temp files
const cwd = resolve('.');

export async function fetchLighthouseScores(url: string): Promise<LighthouseScores> {
  const userDataDir = mkdtempSync(resolve(cwd, '.lighthouse-'));

  const chrome = await chromeLauncher.launch({
    chromeFlags: [
      '--headless',
      '--disable-gpu',
      '--no-sandbox',
      `--user-data-dir=${userDataDir}`,
    ],
    userDataDir: userDataDir
  });

  try {
    const result = await lighthouse(
      url,
      {
        port: chrome.port,
        output: 'json',
        logLevel: 'silent',
        onlyCategories: ['performance', 'accessibility', 'best-practices', 'seo'],
      },
      undefined
    );

    if (!result) {
      throw new Error('Lighthouse failed to run');
    }

    const categories = result.lhr.categories;

    return {
      performance: Math.round((categories.performance?.score ?? 0) * 100),
      accessibility: Math.round((categories.accessibility?.score ?? 0) * 100),
      bestPractices: Math.round((categories['best-practices']?.score ?? 0) * 100),
      seo: Math.round((categories.seo?.score ?? 0) * 100),
    };
  } finally {
    await chrome.kill();

    // Wait for the chrome object to release the temporary folder
    await new Promise(resolve => setTimeout(resolve, 500));

    // Delete the temporary folder again. We waited for chrome to release the lock.
    rmSync(userDataDir, { recursive: true, force: true });
  }
}
