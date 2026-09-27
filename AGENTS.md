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

## Repository layout

```
src/                  TypeScript source (5 files, flat — no subfolders)
  lighthouse-badges.ts   CLI entry point (argv parsing, mode dispatch)
  fetch-lighthouse.ts    Launches headless Chrome, runs Lighthouse, returns scores
  generate-markdown.ts   Renders scores as shields.io badge Markdown
  generate-svg.ts        Renders scores as an SVG with donut charts
  types.ts               LighthouseScores, OutputMode
tests/
  unit/                 Vitest unit tests, one file per src/ module (imports from ../../src/*.js)
    fetch-lighthouse.test.ts  Mocks chrome-launcher/lighthouse/node:fs
    generate-markdown.test.ts
    generate-svg.test.ts
  integration/          Full-CLI integration tests (Chrome/Lighthouse mocked, renderers real)
    lighthouse-badges.test.ts
dist/                 Compiled output (tsc), COMMITTED to git — see ADR-0004
docs/                 ADR.md, landing page (index.html), llms.txt, social-preview.png
.github/workflows/    lint.yml, audit.yml, build.yml
```

## Build, lint, run

```bash
bun install              # install deps
bun run build             # tsc -> dist/
bun run dev               # tsc --watch
bun run lint               # biome check src/ tests/
node dist/lighthouse-badges.js <URL> [-j|-s]   # run built CLI
bunx github:hidao80/lighthouse-badges <URL>    # run without cloning (also: npx github:...)
```

`dist/` is intentionally tracked in git so `npx`/`bunx github:...` works without
a build step for end users. **Whenever you change `src/`, run `bun run build`
and commit the resulting `dist/` diff in the same change** — a source/dist
mismatch is a real bug users will hit directly, not just a stale-artifact
nuisance.

The package's `bin` entry and the Docker `ENTRYPOINT` both point at
`dist/lighthouse-badges.js` (flat, no `dist/bin/` subfolder — `tsc`'s
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
- Non-obvious decisions (why Bun, why `dist/` is committed, why CI splits
  into three workflows, why `.npmrc` hardens installs, etc.) were deliberate.
  Check `git log`/`git blame` before re-litigating one or "fixing" something
  that was intentional.

## CI

Four independent GitHub Actions workflows, all triggered on push/PR to
`main`: `lint.yml` (Biome), `test.yml` (`bun run test -- --run`), `audit.yml`
(`bun audit`), `build.yml` (Docker build verification). Lint/test/audit run on
`ubuntu-slim`; build needs the full `ubuntu-latest` runner for Docker tooling.

## Docker

Multi-stage build: `oven/bun:1-alpine` compiles `src/` → `dist/`, then a
`node:22-bookworm-slim` + `chromium` runtime stage copies only `dist/`,
`node_modules`, and `package.json` in, running as a non-root `nodejs` user.
Lighthouse needs a real Chrome/Chromium binary at runtime — that's the entire
reason the runtime stage exists instead of shipping the builder image.
