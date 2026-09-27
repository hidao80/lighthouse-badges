import type { OutputMode } from './types.js';
/**
 * Determine the output mode from CLI args. `-j`/`--json` takes priority
 * over `-s`/`--svg`; `-b`/`--badge`/`--markdown` are explicit aliases for
 * the (also default) markdown mode. `args[0]` is expected to be the URL,
 * not a flag, so only `-`-prefixed entries are checked against the known
 * flag set.
 * @param args - CLI arguments, URL first followed by any flags.
 * @throws {Error} If an argument starts with `-` but isn't a known flag.
 */
export declare function parseMode(args: string[]): OutputMode;
//# sourceMappingURL=parse-mode.d.ts.map