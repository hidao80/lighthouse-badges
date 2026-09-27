import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const launchMock = vi.fn();
const lighthouseMock = vi.fn();
const mkdtempSyncMock = vi.fn();
const rmSyncMock = vi.fn();

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

const { fetchLighthouseScores } = await import('../../src/fetch-lighthouse.js');

describe('fetchLighthouseScores', () => {
  const killMock = vi.fn().mockResolvedValue(undefined);

  beforeEach(() => {
    vi.useFakeTimers();
    mkdtempSyncMock.mockReturnValue('/tmp/.lighthouse-abc123');
    launchMock.mockResolvedValue({ port: 9222, kill: killMock });
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.clearAllMocks();
  });

  it('rounds category scores to the nearest integer 0-100', async () => {
    lighthouseMock.mockResolvedValue({
      lhr: {
        categories: {
          performance: { score: 0.954 },
          accessibility: { score: 1 },
          'best-practices': { score: 0.916 },
          seo: { score: 0.5 },
        },
      },
    });

    const promise = fetchLighthouseScores('https://example.com');
    await vi.runAllTimersAsync();
    const scores = await promise;

    expect(scores).toEqual({
      performance: 95,
      accessibility: 100,
      bestPractices: 92,
      seo: 50,
    });
  });

  it('defaults missing categories to a score of 0', async () => {
    lighthouseMock.mockResolvedValue({
      lhr: { categories: {} },
    });

    const promise = fetchLighthouseScores('https://example.com');
    await vi.runAllTimersAsync();
    const scores = await promise;

    expect(scores).toEqual({
      performance: 0,
      accessibility: 0,
      bestPractices: 0,
      seo: 0,
    });
  });

  it('throws when lighthouse returns no result', async () => {
    lighthouseMock.mockResolvedValue(undefined);

    const promise = fetchLighthouseScores('https://example.com');
    const assertion = expect(promise).rejects.toThrow(
      'Lighthouse failed to run',
    );
    await vi.runAllTimersAsync();

    await assertion;

    expect(killMock).toHaveBeenCalledTimes(1);
    expect(rmSyncMock).toHaveBeenCalledWith('/tmp/.lighthouse-abc123', {
      recursive: true,
      force: true,
    });
  });

  it('always kills chrome and removes the temp user data dir', async () => {
    lighthouseMock.mockResolvedValue({
      lhr: { categories: {} },
    });

    const promise = fetchLighthouseScores('https://example.com');
    await vi.runAllTimersAsync();
    await promise;

    expect(killMock).toHaveBeenCalledTimes(1);
    expect(rmSyncMock).toHaveBeenCalledWith('/tmp/.lighthouse-abc123', {
      recursive: true,
      force: true,
    });
  });
});
