#!/usr/bin/env node
import { fetchLighthouseScores } from './fetch-lighthouse.js';
import { generateMarkdown } from './generate-markdown.js';
import { generateSvg } from './generate-svg.js';
import { parseMode } from './parse-mode.js';
const args = process.argv.slice(2);
const url = args[0];
if (!url || url.startsWith('-')) {
    console.error('Usage: lighthouse-badges <URL> [--markdown|--json|--svg]');
    process.exit(1);
}
const isHttpUrl = (() => {
    try {
        return ['http:', 'https:'].includes(new URL(url).protocol);
    }
    catch {
        return false;
    }
})();
if (!isHttpUrl) {
    console.error('Error: URL must use the http or https scheme');
    process.exit(1);
}
let mode;
try {
    mode = parseMode(args);
}
catch (error) {
    console.error('Error:', error instanceof Error ? error.message : error);
    process.exit(1);
}
(async () => {
    try {
        const scores = await fetchLighthouseScores(url);
        if (mode === 'json') {
            console.log(JSON.stringify(scores, null, 2));
            return;
        }
        if (mode === 'svg') {
            console.log(generateSvg(scores));
            return;
        }
        console.log(generateMarkdown(scores));
    }
    catch (error) {
        console.error('Error:', error instanceof Error ? error.message : error);
        process.exit(1);
    }
})();
//# sourceMappingURL=lighthouse-badges.js.map