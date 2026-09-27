# Architecture Decision Record (ADR) — lighthouse-badges

This document analyzes the `git log` history (56 commits, 2026-01-18 to
2026-09-27) and reconstructs the project's major design decisions in ADR
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

- **Status**: Superseded by [ADR-0014](#adr-0014)
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

## ADR-0014: Stop committing `dist/`; build on install via `prepare` / `prepack`

- **Status**: Superseded by [ADR-0021](#adr-0021) (supersedes [ADR-0004](#adr-0004))
- **Date**: 2026-08-16
- **Related commits**: `6e46b7f` stop tracking dist/ build output (deletes tracked `dist/*`),
  `6372b55` add takumi-guard security gate (adds `dist/` to `.gitignore`),
  `9724344` update README and package.json for automatic dist build,
  `ad9748b` build script back to plain `tsc`,
  `80f4885` Dockerfile `bun install --ignore-scripts`

### Context

[ADR-0004](#adr-0004) committed `dist/` so `npx github:...` could run without a
build step, at the cost of manual rebuild-and-commit on every `src/` change.
[ADR-0013](#adr-0013) showed that cost materializing: stale tracked output
(`dist/bin/*`) silently broke `bin`, `start` and the Docker `ENTRYPOINT`.
Speculative: removing the src/dist drift class of bug was the main motive;
the commit messages state only what changed, not why.

### Decision

- Deleted all tracked `dist/*` files (`6e46b7f`) and added `dist/` to
  `.gitignore` (`6372b55`; the `.gitignore` line landed in the following
  commit, not the one whose message announces it).
- Added `"prepare": "bun run build"` and `"prepack": "bun run build"` to
  `package.json` so `npx`/`bunx github:...` and `npm pack`/publish compile
  `dist/` at install time (`9724344`). `build` briefly became `tsc -b` and was
  reverted to `tsc` (`ad9748b`).
- README contributor note rewritten: `dist/` no longer needs to be committed.
- Dockerfile builder stage installs with `--ignore-scripts` (`80f4885`).
  Speculative: `bun.lock`/`package.json` are copied before the sources, so
  `prepare` would run `tsc` with no `src/` present; skipping lifecycle
  scripts there and building explicitly after `COPY . .` avoids that.

### Consequences

- The src/dist drift class of bug from [ADR-0013](#adr-0013) disappears from
  the repository; the tracked tree holds source only.
- `npx github:hidao80/lighthouse-badges` now depends on the install-time
  build succeeding on the user's machine. `prepare` calls `bun run build`, so
  an environment without Bun may fail at this step (Unconfirmed; tracked as
  KB-09 in `known_bugs.md`).
- Speculative: the repo's own `.npmrc` sets `ignore-scripts=true`
  ([ADR-0008](#adr-0008)); whether a consumer's `npx github:` install honors or
  bypasses its own `ignore-scripts` setting for `prepare` was not verified.
- `docs/ADR.md` (the published ADR) and `AGENTS.md` still describe the
  committed-`dist/` policy; they are out of sync with this decision (KB-03).

---

## ADR-0015: Gate CI dependency installs with takumi-guard and let Dependabot track Actions

- **Status**: Accepted
- **Date**: 2026-08-16 (takumi-guard), 2026-09-05 (Dependabot)
- **Related commits**: `6372b55` add takumi-guard security gate to workflows,
  `25c093d` Add GitHub Actions to Dependabot configuration

### Context

[ADR-0008](#adr-0008) hardened local installs through `.npmrc`
(`ignore-scripts`, `min-release-age`). CI still installed packages with only
`bun audit` as a check, which reports known advisories but does not block a
freshly published malicious package. Workflow actions (`actions/checkout`,
`oven-sh/setup-bun`, etc.) were pinned by major tag with no update mechanism.

### Decision

- Added `flatt-security/setup-takumi-guard-npm@v1` as the first step of the
  `audit`, `lint` and `build` jobs, before `bun install`. The commit message
  states the intent: "so supply-chain checks gate every CI job".
- Added `.github/dependabot.yml` with the `github-actions` ecosystem on a
  weekly schedule.

### Consequences

- Every CI job depends on a third-party action and its availability
  (Speculative: an outage of that service would block all jobs).
- Dependabot covers GitHub Actions only; no `npm`/`bun` ecosystem entry exists,
  so npm dependency bumps stay manual.
- Actions remain referenced by tag, not commit SHA; Dependabot bumps tags but
  does not pin to SHAs.

---

## ADR-0016: Run GitHub Actions locally with `act`

- **Status**: Accepted
- **Date**: 2026-08-16
- **Related commits**: `efd4287` scaffold local act configuration,
  `6372b55` (adds the act-only docker CLI step to `build.yml`),
  `466239f` migrate slash-command docs to skills (adds `setup-act` skill)

### Context

The three workflows ([ADR-0006](#adr-0006)) could only be validated by pushing.
The runners mix `ubuntu-slim` and `ubuntu-latest` ([ADR-0007](#adr-0007)),
which `act` does not map to images by default.

### Decision

- Added `.actrc` mapping both `ubuntu-latest` and `ubuntu-slim` to
  `catthehacker/ubuntu:act-24.04`.
- Added `package.json` scripts `act`, `act:audit`, `act:build`, `act:lint`.
- `build.yml` gained an `Install docker CLI (act only)` step guarded by
  `if: ${{ env.ACT }}`, so the `docker build` step works inside the act
  container while GitHub-hosted runs skip it.

### Consequences

- Workflows can be exercised locally before pushing.
- Both runner labels share one image under act, so `ubuntu-slim`-specific
  differences are not reproduced locally.
- Speculative: the act-only step mounts/uses the host Docker daemon, so local
  `act:build` requires Docker access from inside the act container.

---

## ADR-0017: Major dependency upgrade — Lighthouse 13, TypeScript 7, `@types/node` 26

- **Status**: Accepted
- **Date**: 2026-08-14
- **Related commits**: `dc142e4` update dependencies for improved compatibility and features

### Context

The commit message gives only "improved compatibility and features"; the
concrete motive is not recorded (Speculative: keeping pace with upstream
Lighthouse audit changes).

### Decision

- `lighthouse`: `^12.8.2` → `^13.4.1`
- `typescript`: `^5.9.3` → `^7.0.2`
- `@types/node`: `^20.19.43` → `^26.2.0`

### Consequences

- `package.json#engines` and the README still declare Node `>=18`, while
  the resolved Lighthouse 13 line requires a much newer Node (KB-01 in
  `known_bugs.md`). The declared support range no longer reflects reality.
- Lighthouse major versions can change category scoring; badge values for the
  same site may shift across the upgrade (Speculative, not measured).

---

## ADR-0018: Restructure the landing page — split assets, client-side i18n via CDN, OS-driven theme

- **Status**: Accepted
- **Date**: 2026-08-16
- **Related commits**: `21670ba` add multi-language support and copy buttons to landing page,
  `ec840da` update installation command on the landing page

### Context

`docs/index.html` (GitHub Pages) carried inline CSS and JS and a manual theme
toggle (last touched in `c0c7dce`), in English only.

### Decision

Per the commit message and diff:
- Split inline assets into `docs/style.css`, `docs/main.js` and a
  `docs/main.min.js` (the page loads the minified file; no `package.json`
  script generates it).
- Added `multilanguagejs@2.0.1` loaded from `unpkg.com` for en/ja/zh/es/ru,
  with browser-language detection and `localStorage` persistence.
- Dropped the manual theme toggle in favor of `prefers-color-scheme`.
- Added copy-to-clipboard buttons on command blocks and a max content width.

### Consequences

- The page gains a runtime third-party script dependency on unpkg without
  Subresource Integrity (Speculative risk: CDN compromise or outage affects
  the page).
- `main.js` and `main.min.js` must be kept in sync manually; no build step
  generates the minified file.
- Users lose the explicit theme override and follow the OS setting only.

---

## ADR-0019: Add a vitest unit/integration test suite and wire it into CI

- **Status**: Accepted
- **Date**: 2026-09-27
- **Related commits**: `67153fd` add integration and unit tests for lighthouse-badges CLI
  and related functions, `8729ab6` add GitHub Actions workflow for testing on push and
  pull request, `cf2632c` update dependencies and enhance linting configuration (adds
  `act:test` script, extends `lint` to `tests/`)

### Context

`package.json` has declared a `"test": "vitest"` script and the `vitest`
devDependency since the very first commit (`ce66290`), but no test file ever
existed and no CI job ran it — a gap the code-analyze audit had been tracking
as an open finding (KB-04 in `known_bugs.md`). `src/fetch-lighthouse.ts`,
`generate-markdown.ts`, and `generate-svg.ts` had no automated coverage.

### Decision

- Added `tests/unit/fetch-lighthouse.test.ts`, `tests/unit/generate-markdown.test.ts`,
  `tests/unit/generate-svg.test.ts`, and `tests/integration/lighthouse-badges.test.ts`
  (341 lines total), mocking Chrome launch/Lighthouse/filesystem calls.
- Added `.github/workflows/test.yml`: a `test` job on `ubuntu-slim` running
  `bun run test -- --run` on `push`/`pull_request` to `main`, following the
  same runner-by-job-nature rule as [ADR-0007](#adr-0007) (no Docker build
  involved) and the same setup steps (`checkout` → `setup-takumi-guard-npm` →
  `setup-bun`) as the other three workflows.
- Added an `act:test` script to `package.json` (mirrors `act:audit`/`act:build`/
  `act:lint` from [ADR-0016](#adr-0016)) and widened the `lint` script from
  `biome check src/` to `biome check src/ tests/` so the new test files are
  linted too.

### Consequences

- CI now runs 21 test cases across 4 files (verified via `bun run test -- --run`)
  on every push/PR, closing the previously-declared-but-unused test
  infrastructure gap.
- `src/`, `tests/`, and CI now form a closed loop: `lint`, `test`, and (for
  `main`) `build`/`audit` all gate the same branch.
- Test files mock Chrome/Lighthouse rather than launching a real browser, so
  CI does not need Chromium installed for `test.yml` (unlike `build.yml`'s
  Docker image, which still bundles it per [ADR-0005](#adr-0005)).

---

## ADR-0020: Pin third-party GitHub Actions to commit SHAs instead of version tags

- **Status**: Accepted
- **Date**: 2026-09-27
- **Related commits**: `f22727d` update action versions in workflow files for consistency

### Context

`audit.yml`, `build.yml`, `lint.yml`, and (per [ADR-0019](#adr-0019)) `test.yml`
referenced `actions/checkout`, `flatt-security/setup-takumi-guard-npm`, and
`oven-sh/setup-bun` by mutable version tag (`@v7`, `@v1`, `@v2`). A tag can be
moved to point at different code after the fact, which weakens the
supply-chain gate [ADR-0015](#adr-0015) had just added via takumi-guard and
Dependabot. Speculative: the commit message ("for consistency") does not state
the security rationale explicitly.

### Decision

Replaced the tag reference in all four workflow files with the resolved
commit SHA, keeping the version as a trailing comment for readability:
`actions/checkout@3d3c42e5aac5ba805825da76410c181273ba90b1 # v7.0.1`,
`flatt-security/setup-takumi-guard-npm@6d4182745c1e474c35a023573c2612c085be45a4 # v1.2.0`,
`oven-sh/setup-bun@0c5077e51419868618aeaa5fe8019c62421857d6 # v2.2.0`.

### Consequences

- A tag being re-pointed after the fact (accidentally or maliciously) can no
  longer silently change what a workflow runs.
- Dependabot ([ADR-0015](#adr-0015)) must now bump both the SHA and the
  version comment on every update, instead of a one-line tag bump; the two
  can drift out of sync if one is edited without the other.
- All four workflow files (`audit.yml`, `build.yml`, `lint.yml`, `test.yml`)
  now share the identical three-step setup sequence pinned to the same SHAs.

---

## ADR-0021: Recommit `bin/`; drop the install-time `prepare`/`prepack` build (supersedes ADR-0014)

- **Status**: Accepted (supersedes [ADR-0014](#adr-0014))
- **Date**: 2026-09-27

### Context

[ADR-0014](#adr-0014) moved the build to install time (`prepare`/`prepack`
running `bun run build`) so `dist/` would not need to be committed. This
repo's own `.npmrc` sets `ignore-scripts=true` ([ADR-0008](#adr-0008)) and
was flagged as an open risk to that approach (KB-09 in `known_bugs.md`): an
end user's `bunx`/`npx github:hidao80/lighthouse-badges` install runs
`bun install`/`npm install` as a root project, which is exactly the install
path `ignore-scripts` is designed to suppress lifecycle scripts for.

This was verified empirically in this session by copying the working tree
(with `prepare: "tsc"`, the state KB-09 left `package.json` in) into an
isolated directory and running `bun install` there, simulating the
clone-then-install step `bunx`/`npx github:...` performs internally: no
`dist/` was produced and the CLI failed to start (`Cannot find module
'.../dist/lighthouse-badges.js'`). Removing `.npmrc` from that same directory
and repeating the install did produce `dist/` and a runnable CLI, confirming
`ignore-scripts=true` — not a separate bug — was the cause. Since `.npmrc`
ships with the repository and is not something an end user opts out of,
`bunx`/`npx github:...` was broken for every consumer, not just an edge case
(KB-09's "Unconfirmed" is now confirmed, and worse than speculated: the
install doesn't merely "possibly fail without Bun" — it fails outright
regardless of Bun's presence, because the lifecycle script never runs at
all).

### Decision

- Renamed the compiled-output directory from `dist/` to `bin/`
  (`tsconfig.json#compilerOptions.outDir`) and committed it to git
  (`package.json#files`, `.gitignore` no longer excludes it) — the opposite
  direction from [ADR-0014](#adr-0014), back toward [ADR-0004](#adr-0004)'s
  original approach, but under a new directory name to signal "distribution
  artifact" rather than reusing the now-loaded term `dist/`.
- Removed the `"prepare"` and `"prepack"` scripts from `package.json`
  entirely, since no install-time build is needed once `bin/` is committed;
  `"prepublishOnly"` (`bun run build`) remains as the pre-`npm publish`
  safety net for maintainers, who run it in an environment where they
  control `ignore-scripts` themselves.
- `.npmrc`'s `ignore-scripts=true` is kept as-is ([ADR-0008](#adr-0008)) —
  the fix works around it rather than weakening it, so the supply-chain
  hardening it provides is preserved for both maintainers and consumers.
- Updated `package.json#bin`, `#scripts.start`, and the Dockerfile
  `ENTRYPOINT`/`COPY` from `dist/` to `bin/` (mirroring the path-sync
  discipline [ADR-0013](#adr-0013) established).
- Added `package.json#repository`/`#homepage`/`#bugs` in preparation for an
  eventual `npm publish` to npmjs.org, so `npm install -g lighthouse-badges`
  and `npx lighthouse-badges` (registry install, not `github:`) also have
  the metadata npm expects on a published package page.

### Consequences

- `bunx`/`npx github:hidao80/lighthouse-badges` now runs the committed
  `bin/lighthouse-badges.js` immediately after `git clone`, with no build
  step and no dependency on `ignore-scripts` behavior at all — the KB-09
  failure mode is eliminated by construction, not by relying on an install
  flag a consumer doesn't control.
- The src/`bin` drift risk that motivated [ADR-0014](#adr-0014) (and that
  [ADR-0013](#adr-0013) show materializing under the old `dist/bin/` layout)
  returns: `src/` changes require `bun run build` and a `bin/` diff commit,
  with no CI check enforcing that today.
- `docs/ADR.md`/`AGENTS.md`/`README.md` were updated in the same pass to
  describe `bin/` as committed and to drop references to install-time
  `prepare`/`prepack` building `dist/`, avoiding the kind of doc/code
  divergence [ADR-0014](#adr-0014) itself left behind (KB-03).

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
| 2026-08-14 | `39c608b` | README Bun install/dev commands; added `docs/ADR.md` |
| 2026-08-14 | `526eceb` | Added `.editorconfig` |
| 2026-08-14 | `dc142e4` | Lighthouse 13 / TypeScript 7 / `@types/node` 26 ([ADR-0017](#adr-0017)) |
| 2026-08-16 | `6e46b7f` | Deleted tracked `dist/*` ([ADR-0014](#adr-0014)) |
| 2026-08-16 | `6372b55` | takumi-guard in all workflows, act docker step, `dist/` in `.gitignore` ([ADR-0014](#adr-0014), [ADR-0015](#adr-0015)) |
| 2026-08-16 | `466239f` | `.claude/commands/*` → `.claude/skills/*`; added `setup-act` skill |
| 2026-08-16 | `efd4287` | `.actrc` + `act:*` scripts ([ADR-0016](#adr-0016)) |
| 2026-08-16 | `b888ed9` | README/llms.txt: `bun add -g` / `npx github:` as primary commands |
| 2026-08-16 | `21670ba` | Landing page i18n, asset split, copy buttons ([ADR-0018](#adr-0018)) |
| 2026-08-16 | `9724344` | `prepare`/`prepack` build hooks; README drops committed-`dist/` note |
| 2026-08-16 | `ec840da` | Landing page install command fix |
| 2026-08-16 | `ad9748b` | `build`: `tsc -b` → `tsc` |
| 2026-08-16 | `e6289c3` | `bun.lock` version pins |
| 2026-08-16 | `80f4885` | Dockerfile `bun install --ignore-scripts` |
| 2026-08-16 | `b1ee329` | `make-social-preview` skill: Twemoji vector instructions |
| 2026-09-05 | `25c093d` | Dependabot for GitHub Actions ([ADR-0015](#adr-0015)) |
| 2026-09-27 | `1058ac8` | Updated `.claude/skills/*` SKILL.md docs (Claude tooling, not product architecture) |
| 2026-09-27 | `cf2632c` | Dependency bumps (lighthouse/biome/@types/node) + `act:test` script + `lint` covers `tests/` ([ADR-0019](#adr-0019)) |
| 2026-09-27 | `67153fd` | Added unit/integration test suite ([ADR-0019](#adr-0019)) |
| 2026-09-27 | `8729ab6` | Added `.github/workflows/test.yml` ([ADR-0019](#adr-0019)) |
| 2026-09-27 | `f22727d` | Pinned workflow Actions to commit SHAs ([ADR-0020](#adr-0020)) |
| 2026-09-27 | `3ef97f9` | Updated `AGENTS.md` tech-stack/testing description (docs only) |
