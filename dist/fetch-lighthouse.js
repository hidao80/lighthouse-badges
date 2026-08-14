import { mkdtempSync, rmSync } from 'node:fs';
import { resolve } from 'node:path';
import * as chromeLauncher from 'chrome-launcher';
import lighthouse from 'lighthouse';
// Set TEMP to current directory for lighthouse temp files
const cwd = resolve('.');
/**
 * Launch headless Chrome and run Lighthouse against the given URL.
 * @param url - The URL to audit.
 * @returns Rounded 0-100 scores for performance, accessibility, best practices, and SEO.
 */
export async function fetchLighthouseScores(url) {
    const userDataDir = mkdtempSync(resolve(cwd, '.lighthouse-'));
    const chrome = await chromeLauncher.launch({
        chromeFlags: [
            '--headless',
            '--disable-gpu',
            '--no-sandbox',
            `--user-data-dir=${userDataDir}`,
        ],
        userDataDir: userDataDir,
    });
    try {
        const result = await lighthouse(url, {
            port: chrome.port,
            output: 'json',
            logLevel: 'silent',
            onlyCategories: [
                'performance',
                'accessibility',
                'best-practices',
                'seo',
            ],
        }, undefined);
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
    }
    finally {
        await chrome.kill();
        // Wait for the chrome object to release the temporary folder
        await new Promise((resolve) => setTimeout(resolve, 500));
        // Delete the temporary folder again. We waited for chrome to release the lock.
        rmSync(userDataDir, { recursive: true, force: true });
    }
}
//# sourceMappingURL=fetch-lighthouse.js.map