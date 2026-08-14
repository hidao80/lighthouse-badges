# Architecture Decision Record (ADR) — lighthouse-badges

This document analyzes the `git log` history (26 commits, 2026-01-18 to
2026-08-14) and reconstructs the project's major design decisions in ADR
format.

---

## ADR-0001: Local Lighthouse + chrome-launcher instead of the PageSpeed Insights API

- **Status**: Accepted
- **Date**: 2026-01-18
- **Related commits**: `ce66290` first commit, `354469f` Add core functionality

### Context

There are two ways to obtain Lighthouse scores: calling Google's PageSpeed
Insights API, or launching headless Chrome locally and running the
`lighthouse` npm package directly. The former requires managing an API key
and rate limits.

### Decision

`src/fetch-lighthouse.ts` launches headless Chrome
(`--headless --disable-gpu --no-sandbox`) via `chrome-launcher` on every run
and executes the `lighthouse` package locally to obtain scores. A temporary
user data directory (`.lighthouse-*`) is created per run and deleted after
waiting for the Chrome process to release it.

### Consequences

- No external API key is required, and the tool works against any URL
  (including internal-only sites).
- Chrome/Chromium becomes a hard runtime requirement (documented in the
  README's Requirements section; the Docker image also bundles Chromium:
  [ADR-0005](#adr-0005)).
- Chrome startup/shutdown cost is incurred on every request.

---

## ADR-0002: Unify output modes to Markdown / JSON / SVG

- **Status**: Accepted
- **Date**: 2026-01-18
- **Related commits**: `ce66290` first commit, `295aa2d` Update example outputs and add SVG representation

### Context

Different use cases need different output formats: CI badges (Markdown),
integration with other tools (JSON), and README embedding (SVG).

### Decision

`src/types.ts` defines `OutputMode = 'markdown' | 'json' | 'svg'`, with
renderers split out into `generate-markdown.ts` / `generate-svg.ts`. The CLI
switches between them via `-b/--badge` (default), `-j/--json`, `-s/--svg`.

### Consequences

- Adding a new output format only requires extending `OutputMode` and adding
  a renderer.
- The SVG is a custom donut-chart implementation that renders all 4 scores
  in one image, with no dependency on an external image-generation service.

---

## ADR-0003: Fixed score color thresholds (90 / 50)

- **Status**: Accepted
- **Date**: 2026-01-18
- **Related commits**: `ce66290` first commit

### Context

Lighthouse scores (0–100) need color coding so they can be judged at a
glance, in both the badge and the SVG.

### Decision

Adopted the threshold 90–100 = green, 50–89 = yellow, 0–49 = red as shared
logic across both the Markdown badge (shields.io color names) and the SVG
rendering (`#0cce6b` / `#ffa400` / red tones). Also documented as a table in
the README.

### Consequences

- Matches the color convention used by the official Lighthouse tooling,
  which is familiar to users.
- Changing the thresholds requires updating the Markdown and SVG
  implementations in sync.

---

## ADR-0004: Commit build output (`dist/`) to the repo to enable direct `npx github:...` execution

- **Status**: Accepted
- **Date**: 2026-01-18
- **Related commits**: `354469f` Add core functionality (removed `dist/` from `.gitignore`),
  `91e5c12` Update command from pnpm to npx for running script

### Context

`.gitignore` originally excluded `dist/` (standard practice for a TypeScript
project). However, the README's Quick Start wants to offer a
"no clone, no build" way to run the tool via
`npx github:hidao80/lighthouse-badges <URL>`. `npx github:` fetches the
repository as-is and runs the `bin` entry, so the compiled JS must already be
committed.

### Decision

Removed `dist/` from `.gitignore` and switched to committing the compiled JS
(`dist/**/*.js`, `*.d.ts`, `*.map`) directly to the repository. The README's
run command was also changed from `pnpm ...` to
`npx github:hidao80/lighthouse-badges`.

### Consequences

- Users can run the tool with a single `npx` command as long as they have
  Node.js and Chrome.
- Developers bear the operational cost of running `pnpm run build` on every
  source change and committing the resulting `dist/` diff (risk of
  src/dist drift if the build step is forgotten).

---

## ADR-0005: Distribute a Chromium-bundled image via a Docker multi-stage build

- **Status**: Accepted
- **Date**: 2026-01-18
- **Related commits**: `ce66290` first commit

### Context

Running Lighthouse requires Chrome/Chromium ([ADR-0001](#adr-0001)). Users
need a way to run the tool without having to set up Chrome in their local
environment.

### Decision

Structured the `Dockerfile` as two stages:
1. `node:20-alpine` + pnpm builds the source (`builder` stage)
2. `node:20-bookworm-slim` installs the `chromium` package, and only `dist/`
   and `node_modules` are copied over from `builder` (`runner` stage)

Runs as a non-root user (`nodejs`, uid/gid 1001), with `ENTRYPOINT` launching
the CLI directly.

### Consequences

- Separating the build environment (alpine) from the runtime environment
  (bookworm-slim + Chromium) keeps unnecessary build tools out of the final
  image.
- Chromium package updates track Debian's apt repository.
- Running as non-root improves container security.

---

## ADR-0006: Split CI into lint / audit / build workflows

- **Status**: Accepted
- **Date**: 2026-01-18
- **Related commits**: `ce66290` first commit

### Context

Static analysis, dependency vulnerability auditing, and Docker build
verification each have different goals and different frequency
requirements.

### Decision

Split `.github/workflows/` into three files: `lint.yml` (ESLint), `audit.yml`
(`pnpm audit --audit-level=high`), and `build.yml` (`docker build`), all
triggered on `push`/`pull_request` to the `main` branch.

### Consequences

- Easier to isolate the cause of a failure per job.
- Three workflow files now need to be maintained individually.

---

## ADR-0007: Split CI runners between `ubuntu-slim` and `ubuntu-latest` (a trial-and-error record)

- **Status**: Accepted (current state: `build` alone uses `ubuntu-latest`; lint/audit use `ubuntu-slim`)
- **Date**: 2026-01-18
- **Related commits**: `f712e1c` Update workflow configurations to use ubuntu-slim instead of
  ubuntu-latest → `f0afad5` Change build environment from ubuntu-slim to ubuntu-latest

### Context

An attempt was made to standardize on the lightweight `ubuntu-slim` runner,
but `build.yml` verifies a Docker image build and `ubuntu-slim` lacked the
Docker-related tooling and dependencies needed to satisfy that job.

### Decision

All workflows were briefly unified on `ubuntu-slim` (`f712e1c`), then the
very next commit reverted `build.yml` alone to `ubuntu-latest` (`f0afad5`).
The result: `lint`/`audit`, which only need Node.js/pnpm, use `ubuntu-slim`;
`build`, which involves a Docker build, uses `ubuntu-latest`.

### Consequences

- This effectively established a rule of thumb: pick the runner based on the
  nature of the job (lightweight static check vs. Docker build).
- Future jobs that don't involve a Docker build should default to
  `ubuntu-slim`.

---

## ADR-0008: Supply-chain hardening via `.npmrc` (`ignore-scripts` / `min-release-age`)

- **Status**: Accepted
- **Date**: 2026-04-04
- **Related commits**: `94866a5` Add .npmrc configuration file

### Context

The postinstall scripts that npm packages run on install are one of the main
entry points for supply-chain attacks (automatic execution of malicious
scripts). Additionally, versions published very recently carry a relatively
higher risk of unintended bugs or malicious code.

### Decision

Added an `.npmrc` at the repository root with:
- `ignore-scripts=true` (disables arbitrary script execution on install)
- `min-release-age=7` (avoids adopting package versions published less than
  7 days ago)

### Consequences

- Dependencies that need native builds via postinstall may require manual
  intervention on a case-by-case basis.
- Picking up new vulnerability fixes is delayed by at least 7 days.
- Adds one more layer of defense against supply-chain attacks.

---

## ADR-0009: Adopt the MIT license and surface it via a badge

- **Status**: Accepted
- **Date**: 2026-01-18 to 2026-02-04
- **Related commits**: `6bf7f70` Add MIT License, `63ce480` Add MIT license badge to README,
  `8380c00` Fix license badge link in README

### Context

Publishing as OSS requires clarifying the terms of use.

### Decision

Added the full MIT license text as a `LICENSE` file and set the `license`
field in `package.json` to `MIT`. Added a license badge to the README and
fixed its link target to point at the `LICENSE` file.

### Consequences

- Free use, modification, and redistribution is now allowed for both
  commercial and non-commercial purposes.
- The badge's broken link was fixed one commit later, recorded here as a
  minor post-launch adjustment.

---

## ADR-0010: Run the README as a "result-driven" document (simplified usage explanation)

- **Status**: Accepted
- **Date**: 2026-01-18
- **Related commits**: `43c46e2` Remove 'How do I use it?' section from README,
  `295aa2d` Update example outputs and add SVG representation for Lighthouse scores,
  `5e1e301` Add Ask DeepWiki badge to README

### Context

The CLI usage explanation had become duplicated and verbose (the Usage
section and a "How do I use it?" section coexisted). There were also no
actual output samples (Markdown/JSON/SVG), making it hard for users to
picture the tool's behavior.

### Decision

Removed the redundant "How do I use it?" section and consolidated everything
into `Usage`/`Options`/`Examples`. Added the actual command and its output
(including the rendered result) to the README for each output mode. Also
added a DeepWiki badge, providing a path to AI-generated documentation.

### Consequences

- README information is now consolidated in one place, reducing the surface
  area to maintain.
- Because the output examples are hardcoded, changing the output format
  requires manually updating the README samples to match.

---

## ADR-0011: Replace pnpm with Bun as the package manager and runtime

- **Status**: Accepted
- **Date**: 2026-08-14
- **Related commits**: `18c7e75` remove pnpm workspace overrides for @opentelemetry/core,
  `62f51c7` Update Dockerfile and docker-compose to use Bun instead of PNPM,
  `0c4545c` Migrate from PNPM to Bun for package management in audit and lint workflows

### Context

The project used pnpm (via corepack) for dependency management in `package.json`
scripts, `Dockerfile`, `docker-compose.yml`, and the `lint`/`audit` GitHub
Actions workflows, with `pnpm-lock.yaml` and `pnpm-workspace.yaml` (holding an
`overrides` entry for `@opentelemetry/core`) checked into the repo. Bun offers
a single self-contained binary (install, run, and built-in `audit`), removing
the need for `corepack enable && corepack prepare pnpm@latest`.

### Decision

Replaced pnpm with Bun across the toolchain:
- `package.json`: `prepublishOnly` now runs `bun run build`; the pnpm
  `overrides` moved into a top-level `overrides` field (npm-compatible format
  Bun reads directly).
- `Dockerfile` builder stage: `oven/bun:1-alpine` base image, `bun install
  --frozen-lockfile` / `bun run build`, and `bun.lock` is copied instead of
  `pnpm-lock.yaml` / `pnpm-workspace.yaml` (workspace file removed entirely —
  this is a single-package repo, so it only ever held the override).
- `docker-compose.yml`: dev command changed to `bun run dev`.
- `.github/workflows/lint.yml` / `audit.yml`: `pnpm/setup@v1` replaced with
  `oven-sh/setup-bun@v2`; `pnpm audit --audit-level=high` replaced with
  `bun audit` (Bun's built-in advisory scanner).
- `pnpm-lock.yaml` and `pnpm-workspace.yaml` deleted; `bun.lock` generated via
  `bun install`.

### Consequences

- One tool covers install, script running, and vulnerability auditing,
  shrinking the CI setup step from a corepack/pnpm activation dance to a
  single action.
- `bun audit` has a smaller advisory database track record than
  `pnpm audit`/`npm audit`; false negatives should be watched for until Bun's
  audit feature matures.
- Contributors need Bun installed locally instead of pnpm; README/CONTRIBUTING
  instructions referencing `pnpm` should be updated separately if present.

---

## ADR-0012: Replace ESLint with Biome for linting and formatting

- **Status**: Accepted
- **Date**: 2026-08-14
- **Related commits**: `7eec887` add biome configuration file for code formatting and linting,
  `18c7e75` remove pnpm workspace overrides for @opentelemetry/core (also drops `eslint.config.js` and the ESLint devDependencies)

### Context

Linting relied on ESLint 9 (flat config) plus `@eslint/js`, `typescript-eslint`,
and `globals` as separate devDependencies. Biome bundles a linter and a
formatter in a single Rust binary with no plugin resolution step, and the
project had just moved to Bun ([ADR-0011](#adr-0011)), which made a
single-binary tool a natural fit.

### Decision

Added `biome.json` (2-space indent, single quotes, to match the existing
source style) and removed `eslint.config.js` along with the `eslint`,
`@eslint/js`, `globals`, and `typescript-eslint` devDependencies. The
`lint` script in `package.json` changed from `eslint src/` to
`biome check src/`. `bun run lint` picks up two `useNodejsImportProtocol`
suggestions in `fetch-lighthouse.ts` (`fs`/`path` → `node:fs`/`node:path`);
those were applied via `biome check --write --unsafe src/` in the same pass.

### Consequences

- One dependency instead of four, and lint/format now share one config file
  and one tool invocation instead of two.
- `.github/workflows/lint.yml` needed no changes beyond what
  [ADR-0011](#adr-0011) already did — it still runs `bun run lint`, only the
  underlying tool changed.
- Biome's rule set differs from ESLint's `recommended` + `typescript-eslint`
  `recommended`; new lint findings (like the `node:` protocol suggestions
  above) can surface on the next run even without a source change.

---

## ADR-0013: Fix `dist/bin/lighthouse-badges.js` — a stale entry path that broke `npm install -g` and Docker

- **Status**: Accepted
- **Date**: 2026-08-14
- **Related commits**: `640ced3` remove deprecated lighthouse-badges CLI files and source maps,
  `18c7e75` remove pnpm workspace overrides for @opentelemetry/core (package.json `bin`/`start` fix),
  `62f51c7` Update Dockerfile and docker-compose to use Bun instead of PNPM (Dockerfile `ENTRYPOINT` fix)

### Context

`package.json#bin` and `package.json#scripts.start` pointed at
`./dist/bin/lighthouse-badges.js`, and the Dockerfile's `ENTRYPOINT` pointed
at `dist/bin/lighthouse-badges.js`. `tsconfig.json` has `rootDir: "./src"`
with a flat `src/` (no `src/bin/` subfolder), so `tsc` has only ever emitted
`dist/lighthouse-badges.js` directly under `dist/`. `dist/bin/*` was stale
build output from an earlier project layout, committed to git ([ADR-0004](#adr-0004))
and never cleaned up — so a fresh `bun run build` reproduced the correct
`dist/lighthouse-badges.js`, while the tracked-but-orphaned `dist/bin/*`
files sat alongside it, silently pointed to by `bin`/`start`/`ENTRYPOINT`.
This meant `npm install -g lighthouse-badges` and `docker run
lighthouse-badges` would have failed outright, since the file they tried to
execute did not exist post-build.

### Decision

Deleted the tracked `dist/bin/` directory and updated all three references
to the actual build output path: `package.json#bin` and `#scripts.start` to
`./dist/lighthouse-badges.js`, and the Dockerfile `ENTRYPOINT` to `["node",
"dist/lighthouse-badges.js"]`.

### Consequences

- `npm install -g`, `bunx`/`npx github:...`, and `docker run` all execute
  the file `tsc` actually produces.
- If `src/` is ever restructured (e.g. an entry point moved into a
  subfolder), `package.json#bin`/`#scripts.start` and the Dockerfile
  `ENTRYPOINT` must be updated together — this class of bug (a path that
  drifts from the compiler's actual output) has no automated check today.

---

## Commit timeline (reference)

| Date | Commit | Summary |
|---|---|---|
| 2026-01-18 | `ce66290` | Initial commit (CLI, Lighthouse execution, SVG/Markdown generation, Docker, full CI setup) |
| 2026-01-18 | `6bf7f70` | Added MIT license |
| 2026-01-18 | `80b908e` | Fixed README badge link |
| 2026-01-18 | `43c46e2` | Removed duplicate README section |
| 2026-01-18 | `354469f` | Made `dist/` a commit target, added core functionality |
| 2026-01-18 | `f712e1c` | Unified CI runners to `ubuntu-slim` (trial) |
| 2026-01-18 | `f0afad5` | Reverted `build.yml` alone to `ubuntu-latest` |
| 2026-01-18 | `91e5c12` | Changed run command from `pnpm` to `npx` |
| 2026-01-18 | `295aa2d` | Added real output examples and SVG representation to README |
| 2026-02-04 | `5e1e301` | Added Ask DeepWiki badge |
| 2026-02-04 | `63ce480` | Added MIT license badge |
| 2026-02-04 | `8380c00` | Fixed license badge link |
| 2026-04-04 | `94866a5` | Added `.npmrc` (supply-chain hardening) |
| 2026-08-14 | `640ced3` | Removed stale `dist/bin/` build output |
| 2026-08-14 | `18c7e75` | pnpm → Bun (lockfile, `package.json`, `bin`/`start` path fix, ESLint removed) |
| 2026-08-14 | `7eec887` | Added `biome.json` |
| 2026-08-14 | `b49e6aa` | Added `graphify-out` to `.dockerignore`/`.gitignore` |
| 2026-08-14 | `7600e76` | Rebuilt `dist/` after JSDoc + Biome formatting changes |
| 2026-08-14 | `62f51c7` | Dockerfile/docker-compose: pnpm → Bun, `ENTRYPOINT` path fix |
| 2026-08-14 | `33a61fe` | Reformatted `tsconfig.json` `include`/`exclude` (Biome) |
| 2026-08-14 | `fa52e22` | Added JSDoc to `fetchLighthouseScores`, `generateMarkdown`, `generateSvg` |
| 2026-08-14 | `0c4545c` | `lint.yml`/`audit.yml`: pnpm → Bun |
| 2026-08-14 | `f9e3ac2` | Added `AGENTS.md` |
| 2026-08-14 | `6c6baf3` | Added Claude command docs (`code-analyze`, `make-lp`, `make-social-preview`, `update-adr`) |
| 2026-08-14 | `7084d50` | Updated `.claude/settings.local.json` permissions for Bun |
| 2026-08-14 | `c0c7dce` | `docs/index.html`: theme-toggle script to arrow functions |
