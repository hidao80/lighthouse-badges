# AGENTS.md

Guidance for AI coding agents working in this repository.

## What this is

`lighthouse-badges` is a small CLI tool that runs Google Lighthouse locally
(via `chrome-launcher` + headless Chrome) against a URL and prints the result
as Markdown badges, JSON, or an SVG donut chart. No server, no database, no
config beyond a URL and an output-mode flag.

## Tech stack

- **Runtime/package manager**: Bun. Use `bun install`, `bun run <script>`, `bun add`, not npm/pnpm/yarn.
- **Language**: TypeScript, compiled with `tsc` (not bundled). `type: module`, `NodeNext` module resolution — internal imports use explicit `.js` extensions (e.g. `from './types.js'`), Node builtins use the `node:` prefix (e.g. `node:fs`).
- **Lint/format**: Biome (`biome.json`), not ESLint/Prettier. 2-space indent, single quotes — matches the existing source style.
- **Test runner**: `vitest`, listed in `devDependencies`. Unit tests live under `tests/unit/`, one file per `src/` module, importing from `../../src/*.js` and mocking external deps (`chrome-launcher`, `lighthouse`, `node:fs`); `tests/integration/` drives `lighthouse-badges.ts` end to end, mocking only that same Chrome/Lighthouse boundary so the real `generateMarkdown`/`generateSvg` wiring runs. `bun run test` runs Vitest in watch mode; use `bun run test -- --run` for a single pass.

## Build, lint, run

```bash
bun install              # install deps
bun run build             # tsc -> bin/
bun run dev               # tsc --watch
bun run lint               # biome check src/ tests/
node bin/lighthouse-badges.js <URL> [-j|-s]    # run built CLI
bunx github:hidao80/lighthouse-badges <URL>    # run without cloning (also: npx @hidao/lighthouse-badges once published to npmjs)
```

`bin/` is committed to git (`package.json#files`, tsc's `outDir`). Run
`bun run build` after changing `src/` and commit the resulting `bin/` diff —
CI does not do this for you. This repo's `.npmrc` sets `ignore-scripts=true`
([ADR-0008](#adr-0008)), which also suppresses lifecycle scripts (`prepare`/
`prepack`) during `npx`/`bunx github:...` installs; committing `bin/` means
those installs need no build step at all, so `ignore-scripts` doesn't have to
be relaxed for end users (ADR-0021, supersedes ADR-0014's install-time build).

The package's `bin` entry and the Docker `ENTRYPOINT` both point at
`bin/lighthouse-badges.js` (flat, no `bin/bin/` subfolder — `tsc`'s
`outDir`/`rootDir` mirror `src/` exactly). If you ever restructure `src/`,
keep `package.json#bin`, `package.json#scripts.start`, and the Dockerfile's
`ENTRYPOINT` in sync with wherever `tsc` actually emits the entry file.

## Conventions

- **No dependencies beyond what's declared.** This is a two-dependency CLI
  (`chrome-launcher`, `lighthouse`). Don't add a framework, a bundler, or a
  CLI-arg-parsing library for a tool that reads `argv[2]` and two flags.
- **Output modes are closed and parallel.** `OutputMode` in `types.ts` is
  `'markdown' | 'json' | 'svg'`; each mode has exactly one renderer
  (`generate-markdown.ts` / `generate-svg.ts` / raw `JSON.stringify`). Adding a
  mode means extending the union, adding a renderer, and wiring the CLI
  dispatch in `lighthouse-badges.ts` — all three, not just one.
- **Score color thresholds are duplicated by design, not by accident.**
  90/50 green-yellow-red logic exists once in `generate-markdown.ts`
  (`getColor`, shields.io names) and once in `generate-svg.ts` (`getSvgColor`,
  hex values) because they serialize to different formats. If you change the
  thresholds, change both and check they still agree.
- **JSDoc on exported and module-internal functions.** Existing functions in
  `fetch-lighthouse.ts`, `generate-markdown.ts`, `generate-svg.ts` carry
  `@param`/`@returns` JSDoc blocks — match that pattern for new functions.
- Non-obvious decisions (why Bun, why `bin/` is committed instead of built at
  install time, why CI splits into separate workflows, why `.npmrc` hardens
  installs, etc.) were deliberate. Check `git log`/`git blame` or
  `docs/ADR.md` before re-litigating one or "fixing" something that was
  intentional.
