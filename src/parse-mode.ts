import type { OutputMode } from './types.js';

const KNOWN_FLAGS: Record<string, OutputMode> = {
  '-j': 'json',
  '--json': 'json',
  '-s': 'svg',
  '--svg': 'svg',
  '-b': 'markdown',
  '--badge': 'markdown',
  '--markdown': 'markdown',
};

/**
 * Determine the output mode from CLI args. `-j`/`--json` takes priority
 * over `-s`/`--svg`; `-b`/`--badge`/`--markdown` are explicit aliases for
 * the (also default) markdown mode. `args[0]` is expected to be the URL,
 * not a flag, so only `-`-prefixed entries are checked against the known
 * flag set.
 * @param args - CLI arguments, URL first followed by any flags.
 * @throws {Error} If an argument starts with `-` but isn't a known flag.
 */
export function parseMode(args: string[]): OutputMode {
  const modes = new Set<OutputMode>();

  for (const arg of args) {
    if (!arg.startsWith('-')) continue;

    const mode = KNOWN_FLAGS[arg];
    if (!mode) {
      throw new Error(`Unknown option: ${arg}`);
    }
    modes.add(mode);
  }

  if (modes.has('json')) return 'json';
  if (modes.has('svg')) return 'svg';
  return 'markdown';
}
