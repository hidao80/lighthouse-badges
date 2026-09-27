import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const launchMock = vi.fn();
const lighthouseMock = vi.fn();
const mkdtempSyncMock = vi.fn();
const rmSyncMock = vi.fn();
const existsSyncMock = vi.fn().mockReturnValue(false);

vi.mock('chrome-launcher', () => ({
  launch: (...args: unknown[]) => launchMock(...args),
}));

vi.mock('lighthouse', () => ({
  default: (...args: unknown[]) => lighthouseMock(...args),
}));

vi.mock('node:fs', () => ({
  mkdtempSync: (...args: unknown[]) => mkdtempSyncMock(...args),
  rmSync: (...args: unknown[]) => rmSyncMock(...args),
  existsSync: (...args: unknown[]) => existsSyncMock(...args),
}));

const { fetchLighthouseScores } = await import('../../src/fetch-lighthouse.js');

describe('fetchLighthouseScores', () => {
  const killMock = vi.fn().mockResolvedValue(undefined);

  beforeEach(() => {
    mkdtempSyncMock.mockReturnValue('/tmp/.lighthouse-abc123');
    launchMock.mockResolvedValue({ port: 9222, kill: killMock });
  });

  afterEach(() => {
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

    const scores = await fetchLighthouseScores('https://example.com');

    expect(scores).toEqual({
      performance: 95,
      accessibility: 100,
      bestPractices: 92,
      seo: 50,
    });
  });

  it('returns null for categories missing from the result', async () => {
    lighthouseMock.mockResolvedValue({
      lhr: { categories: {} },
    });

    const scores = await fetchLighthouseScores('https://example.com');

    expect(scores).toEqual({
      performance: null,
      accessibility: null,
      bestPractices: null,
      seo: null,
    });
  });

  it('returns null for a category present but with a null score', async () => {
    lighthouseMock.mockResolvedValue({
      lhr: {
        categories: {
          performance: { score: null },
          accessibility: { score: 1 },
          'best-practices': { score: 0.916 },
          seo: { score: 0.5 },
        },
      },
    });

    const scores = await fetchLighthouseScores('https://example.com');

    expect(scores).toEqual({
      performance: null,
      accessibility: 100,
      bestPractices: 92,
      seo: 50,
    });
  });

  it('throws when lighthouse returns no result', async () => {
    lighthouseMock.mockResolvedValue(undefined);

    const promise = fetchLighthouseScores('https://example.com');

    await expect(promise).rejects.toThrow('Lighthouse failed to run');

    expect(killMock).toHaveBeenCalledTimes(1);
    expect(rmSyncMock).toHaveBeenCalledWith('/tmp/.lighthouse-abc123', {
      recursive: true,
      force: true,
      maxRetries: 3,
      retryDelay: 200,
    });
  });

  it('always kills chrome and removes the temp user data dir', async () => {
    lighthouseMock.mockResolvedValue({
      lhr: { categories: {} },
    });

    await fetchLighthouseScores('https://example.com');

    expect(killMock).toHaveBeenCalledTimes(1);
    expect(rmSyncMock).toHaveBeenCalledWith('/tmp/.lighthouse-abc123', {
      recursive: true,
      force: true,
      maxRetries: 3,
      retryDelay: 200,
    });
  });

  it('propagates the error and still removes the temp dir when launch fails', async () => {
    launchMock.mockRejectedValue(new Error('Chrome failed to launch'));

    const promise = fetchLighthouseScores('https://example.com');

    await expect(promise).rejects.toThrow('Chrome failed to launch');

    expect(killMock).not.toHaveBeenCalled();
    expect(rmSyncMock).toHaveBeenCalledWith('/tmp/.lighthouse-abc123', {
      recursive: true,
      force: true,
      maxRetries: 3,
      retryDelay: 200,
    });
  });

  it('swallows a chrome.kill() rejection and still returns the scores', async () => {
    killMock.mockRejectedValueOnce(new Error('kill failed'));
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

    const scores = await fetchLighthouseScores('https://example.com');

    expect(scores).toEqual({
      performance: 95,
      accessibility: 100,
      bestPractices: 92,
      seo: 50,
    });
    expect(rmSyncMock).toHaveBeenCalledWith('/tmp/.lighthouse-abc123', {
      recursive: true,
      force: true,
      maxRetries: 3,
      retryDelay: 200,
    });
  });
});
