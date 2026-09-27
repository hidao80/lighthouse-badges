import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const launchMock = vi.fn();
const lighthouseMock = vi.fn();
const mkdtempSyncMock = vi.fn();
const rmSyncMock = vi.fn();
const killMock = vi.fn().mockResolvedValue(undefined);

vi.mock('chrome-launcher', () => ({
  launch: (...args: unknown[]) => launchMock(...args),
}));

vi.mock('lighthouse', () => ({
  default: (...args: unknown[]) => lighthouseMock(...args),
}));

vi.mock('node:fs', () => ({
  mkdtempSync: (...args: unknown[]) => mkdtempSyncMock(...args),
  rmSync: (...args: unknown[]) => rmSyncMock(...args),
}));

const sampleCategories = {
  performance: { score: 0.954 },
  accessibility: { score: 1 },
  'best-practices': { score: 0.916 },
  seo: { score: 0.5 },
};

/**
 * Run the CLI entry point with the given argv, letting the real
 * fetchLighthouseScores/generateMarkdown/generateSvg pipeline execute
 * against mocked Chrome/Lighthouse, and return whatever it printed.
 */
async function runCli(argv: string[]) {
  const originalArgv = process.argv;
  const logSpy = vi.spyOn(console, 'log').mockImplementation(() => undefined);
  const errorSpy = vi
    .spyOn(console, 'error')
    .mockImplementation(() => undefined);
  const exitSpy = vi
    .spyOn(process, 'exit')
    .mockImplementation(() => undefined as never);

  try {
    process.argv = ['node', 'lighthouse-badges.js', ...argv];
    vi.resetModules();
    await import('../../src/lighthouse-badges.js');
    await vi.runAllTimersAsync();
  } finally {
    process.argv = originalArgv;
  }

  return { logSpy, errorSpy, exitSpy };
}

describe('lighthouse-badges CLI (integration)', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    mkdtempSyncMock.mockReturnValue('/tmp/.lighthouse-abc123');
    launchMock.mockResolvedValue({ port: 9222, kill: killMock });
    lighthouseMock.mockResolvedValue({ lhr: { categories: sampleCategories } });
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.clearAllMocks();
  });

  it('defaults to markdown output built from real fetch + render functions', async () => {
    const { logSpy, exitSpy } = await runCli(['https://example.com']);

    const output = logSpy.mock.calls.at(0)?.[0] as string;
    expect(output).toContain('Accessibility-100-brightgreen');
    expect(output).toContain('Performance-95-brightgreen');
    expect(output).toContain('SEO-50-yellow');
    expect(exitSpy).not.toHaveBeenCalled();
  });

  it('prints raw JSON scores for -j/--json', async () => {
    const { logSpy } = await runCli(['https://example.com', '--json']);

    const output = logSpy.mock.calls.at(0)?.[0] as string;
    expect(JSON.parse(output)).toEqual({
      performance: 95,
      accessibility: 100,
      bestPractices: 92,
      seo: 50,
    });
  });

  it('renders an SVG donut chart for -s/--svg', async () => {
    const { logSpy } = await runCli(['https://example.com', '-s']);

    const output = logSpy.mock.calls.at(0)?.[0] as string;
    expect(output).toMatch(/^<svg width="480" height="120"/);
    expect(output).toContain('#0cce6b');
  });

  it('exits with an error when no URL is given', async () => {
    const { errorSpy, exitSpy } = await runCli([]);

    expect(errorSpy).toHaveBeenCalledWith(
      expect.stringContaining('Usage: lighthouse-badges'),
    );
    expect(exitSpy).toHaveBeenCalledWith(1);
  });

  it('exits with an error when the first arg looks like a flag', async () => {
    const { errorSpy, exitSpy } = await runCli(['--json']);

    expect(errorSpy).toHaveBeenCalledWith(
      expect.stringContaining('Usage: lighthouse-badges'),
    );
    expect(exitSpy).toHaveBeenCalledWith(1);
  });

  it('reports the underlying error and exits 1 when Lighthouse fails', async () => {
    lighthouseMock.mockResolvedValue(undefined);

    const { errorSpy, exitSpy } = await runCli(['https://example.com']);

    expect(errorSpy).toHaveBeenCalledWith('Error:', 'Lighthouse failed to run');
    expect(exitSpy).toHaveBeenCalledWith(1);
  });
});
