import { describe, expect, it } from 'vitest';
import { parseMode } from '../../src/parse-mode.js';

describe('parseMode', () => {
  it('defaults to markdown when no mode flag is given', () => {
    expect(parseMode([])).toBe('markdown');
  });

  it.each([['-j'], ['--json']])('returns json for %s', (flag) => {
    expect(parseMode([flag])).toBe('json');
  });

  it.each([['-s'], ['--svg']])('returns svg for %s', (flag) => {
    expect(parseMode([flag])).toBe('svg');
  });

  it('prioritizes json over svg when both are given', () => {
    expect(parseMode(['-j', '-s'])).toBe('json');
    expect(parseMode(['--svg', '--json'])).toBe('json');
  });

  it('throws for an unknown flag', () => {
    expect(() => parseMode(['--unknown-flag'])).toThrow(
      'Unknown option: --unknown-flag',
    );
  });

  it.each([['-b'], ['--badge'], ['--markdown']])(
    'treats %s as an explicit alias for markdown',
    (flag) => {
      expect(parseMode([flag])).toBe('markdown');
    },
  );

  it('ignores a leading URL argument that does not start with -', () => {
    expect(parseMode(['https://example.com', '-j'])).toBe('json');
  });
});
