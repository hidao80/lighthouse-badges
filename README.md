# lighthouse-badges

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
![Lint](https://github.com/hidao80/lighthouse-badges/actions/workflows/lint.yml/badge.svg)
![Audit](https://github.com/hidao80/lighthouse-badges/actions/workflows/audit.yml/badge.svg)
![Build](https://github.com/hidao80/lighthouse-badges/actions/workflows/build.yml/badge.svg)
![Test](https://github.com/hidao80/lighthouse-badges/actions/workflows/test.yml/badge.svg)
[![Ask DeepWiki](https://img.shields.io/badge/Ask_DeepWiki-007ec6?logo=data%3Aimage%2Fpng%3Bbase64%2CiVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAACXBIWXMAAAPoAAAD6AG1e1JrAAACIUlEQVRYw%2B2XP2gUQRTGv7d3JhYWQawkIBaCVWzETos0gmAnVoKNTSoLK0E7EQQrC20sBVFBtLPQRgTBtBaKjYgIQUSxiJq7fT%2BLvCGPJZdNLt4dQj5Y3u7sznzfzLw%2Fs9IO%2FicANiniCujEfWdsQgBLxAbsbraPZcmBfcAt4DNwKQsZNfEUsAB8YRV12LfA6ZHuedg7AO7ed%2Fc%2BUBcbQhbiu%2B6wXIM6EnZWkszMJe2Ke0n6I2la0v51hFeSMLN6OwIK6jJwEBdUYb2MAxRSz6sY4geiahFgLe1Hwq6YWe3us8AN4FQQU4QM64SPY69Xyr43fADgNjAPXHb3peSsD4FDQ0VLEjAHvIhBPS6AHvA1bBO9JPAXcHFbIRtJ5yzwIQZ9CZwAusDJENIkLqsG8DpNyIZJwSUk9wLHgakcesC1JCCjiHm1kYDNOEjptCxpSVK%2F8f73OFLxPLAYM3oCzEX7MXf%2FlJbc%2F8kWpA4HgQdpYI9IWAbeh83whi84cHXL%2B58EPBoQhnmm94EzwE3gZ2p%2FDhzdbhg%2BTaRr01x7ftb4%2FjBwFzjXrCvDpmLW9crVLNeR9CaapoGemb2TdCERW1tNaBNQ8jktwmozqwtpqRNtdWAjARYk39IS12ZWRX7vmJmA71nQZgi36gN7gCvAj5xc3P0jcH7kx7Ik5IC73wsh14GZsZySow5002l4Jr0b6%2Bm4eSyvpAn8lEzsx2QHo8RfUrlN%2BuPq4ksAAAAASUVORK5CYII%3D&labelColor=010101)](https://deepwiki.com/hidao80/lighthouse-badges)

A CLI tool to generate Lighthouse score badges, JSON, or SVG using local Chrome and the Lighthouse npm package.

## Installation

```bash copy
bun add -g @hidao/lighthouse-badges
```

Or with npm:

```bash copy
npm install -g @hidao/lighthouse-badges
```

## Requirements

- Node.js >= 22.19
- Google Chrome installed on your system

## Usage

```bash copy
bunx github:hidao80/lighthouse-badges <URL> [options]
```

Or with npx:

```bash copy
npx github:hidao80/lighthouse-badges <URL> [options]
```

### Options

| Option | Description |
|--------|-------------|
| *(none)* | Output Markdown badges |
| `-b`, `--badge` | Output Markdown badges |
| `-j`, `--json` | Output JSON |
| `-s`, `--svg` | Output SVG with donut charts |

## Examples

### Markdown Badges (default)

```bash copy
bunx github:hidao80/lighthouse-badges https://example.com
```

Output:

```
![Accessibility](https://img.shields.io/badge/Accessibility-94-brightgreen?style=flat-square)&emsp;![Best_Practices](https://img.shields.io/badge/Best_Practices-100-brightgreen?style=flat-square)&emsp;![Performance](https://img.shields.io/badge/Performance-93-brightgreen?style=flat-square)&emsp;![SEO](https://img.shields.io/badge/SEO-72-yellow?style=flat-square)
```

Rendered:

![Accessibility](https://img.shields.io/badge/Accessibility-94-brightgreen?style=flat-square)&emsp;![Best_Practices](https://img.shields.io/badge/Best_Practices-100-brightgreen?style=flat-square)&emsp;![Performance](https://img.shields.io/badge/Performance-93-brightgreen?style=flat-square)&emsp;![SEO](https://img.shields.io/badge/SEO-72-brightgreen?style=flat-square)

### JSON Output

```bash copy
bunx github:hidao80/lighthouse-badges https://example.com -j
```

Output:

```json
{
  "performance": 100,
  "accessibility": 100,
  "bestPractices": 93,
  "seo": 72
}
```

### SVG Output

```bash copy
bunx github:hidao80/lighthouse-badges https://example.com -s
```

Outputs an SVG string with donut charts for each score.

Output:

<details>
<summary>Details</summary>

```svg copy
<svg width="480" height="120" viewBox="0 0 480 120" xmlns="http://www.w3.org/2000/svg">

    <g transform="translate(0, 0)">
      <circle cx="60" cy="60" r="16" fill="none" stroke="#e0e0e0" stroke-width="8" transform="rotate(-90 60 60)" />
      <circle cx="60" cy="60" r="16" fill="none" stroke="#0cce6b" stroke-width="8"
        stroke-dasharray="100.53096491487338" stroke-dashoffset="6.031857894892408"
        stroke-linecap="round" transform="rotate(-90 60 60)" />
      <text x="60" y="70" text-anchor="middle" font-size="22" font-family="Arial" fill="#0cce6b">
        94
      </text>
    </g>


    <g transform="translate(120, 0)">
      <circle cx="60" cy="60" r="16" fill="none" stroke="#e0e0e0" stroke-width="8" transform="rotate(-90 60 60)" />
      <circle cx="60" cy="60" r="16" fill="none" stroke="#0cce6b" stroke-width="8"
        stroke-dasharray="100.53096491487338" stroke-dashoffset="0"
        stroke-linecap="round" transform="rotate(-90 60 60)" />
      <text x="60" y="70" text-anchor="middle" font-size="22" font-family="Arial" fill="#0cce6b">
        100
      </text>
    </g>


    <g transform="translate(240, 0)">
      <circle cx="60" cy="60" r="16" fill="none" stroke="#e0e0e0" stroke-width="8" transform="rotate(-90 60 60)" />
      <circle cx="60" cy="60" r="16" fill="none" stroke="#0cce6b" stroke-width="8"
        stroke-dasharray="100.53096491487338" stroke-dashoffset="10.053096491487336"
        stroke-linecap="round" transform="rotate(-90 60 60)" />
      <text x="60" y="70" text-anchor="middle" font-size="22" font-family="Arial" fill="#0cce6b">
        90
      </text>
    </g>


    <g transform="translate(360, 0)">
      <circle cx="60" cy="60" r="16" fill="none" stroke="#e0e0e0" stroke-width="8" transform="rotate(-90 60 60)" />
      <circle cx="60" cy="60" r="16" fill="none" stroke="#0cce6b" stroke-width="8"
        stroke-dasharray="100.53096491487338" stroke-dashoffset="10.053096491487336"
        stroke-linecap="round" transform="rotate(-90 60 60)" />
      <text x="60" y="70" text-anchor="middle" font-size="22" font-family="Arial" fill="#0cce6b">
        72
      </text>
    </g>

</svg>
```

</details>

Rendered:

<svg width="480" height="120" viewBox="0 0 480 120" xmlns="http://www.w3.org/2000/svg">
    <g transform="translate(0, 0)">
      <circle cx="60" cy="60" r="16" fill="none" stroke="#e0e0e0" stroke-width="8" transform="rotate(-90 60 60)" />
      <circle cx="60" cy="60" r="16" fill="none" stroke="#0cce6b" stroke-width="8"
        stroke-dasharray="100.53096491487338" stroke-dashoffset="6.031857894892408"
        stroke-linecap="round" transform="rotate(-90 60 60)" />
      <text x="60" y="70" text-anchor="middle" font-size="22" font-family="Arial" fill="#0cce6b">
        94
      </text>
    </g>
    <g transform="translate(120, 0)">
      <circle cx="60" cy="60" r="16" fill="none" stroke="#e0e0e0" stroke-width="8" transform="rotate(-90 60 60)" />
      <circle cx="60" cy="60" r="16" fill="none" stroke="#0cce6b" stroke-width="8"
        stroke-dasharray="100.53096491487338" stroke-dashoffset="0"
        stroke-linecap="round" transform="rotate(-90 60 60)" />
      <text x="60" y="70" text-anchor="middle" font-size="22" font-family="Arial" fill="#0cce6b">
        100
      </text>
    </g>
    <g transform="translate(240, 0)">
      <circle cx="60" cy="60" r="16" fill="none" stroke="#e0e0e0" stroke-width="8" transform="rotate(-90 60 60)" />
      <circle cx="60" cy="60" r="16" fill="none" stroke="#0cce6b" stroke-width="8"
        stroke-dasharray="100.53096491487338" stroke-dashoffset="10.053096491487336"
        stroke-linecap="round" transform="rotate(-90 60 60)" />
      <text x="60" y="70" text-anchor="middle" font-size="22" font-family="Arial" fill="#0cce6b">
        90
      </text>
    </g>
    <g transform="translate(360, 0)">
      <circle cx="60" cy="60" r="16" fill="none" stroke="#e0e0e0" stroke-width="8" transform="rotate(-90 60 60)" />
      <circle cx="60" cy="60" r="16" fill="none" stroke="#ffa400" stroke-width="8"
        stroke-dasharray="100.53096491487338" stroke-dashoffset="10.053096491487336"
        stroke-linecap="round" transform="rotate(-90 60 60)" />
      <text x="60" y="70" text-anchor="middle" font-size="22" font-family="Arial" fill="#ffa400">
        72
      </text>
    </g>
</svg>

## Badge Colors

| Score | Color |
|-------|-------|
| 90-100 | Green |
| 50-89 | Yellow |
| 0-49 | Red |

## Quick Start

### Run with Docker

```bash copy
# Production build
docker build -t lighthouse-badges .
docker run lighthouse-badges https://example.com
```

### Run directly

```bash copy
bunx github:hidao80/lighthouse-badges https://example.com
```

Or with npx:

```bash copy
npx github:hidao80/lighthouse-badges https://example.com
```

## Development

```bash copy
bun install
bun run build   # tsc -> bin/
bun run dev     # tsc --watch
bun run lint    # biome check src/ tests/
```

`bin/` is the compiled CLI and is committed to git, so `npx`/`bunx github:...`
runs it directly with no install-time build step. After changing `src/`, run
`bun run build` and commit the resulting `bin/` diff. See
[AGENTS.md](AGENTS.md) for the full contributor guide and
[docs/ADR.md](docs/ADR.md) for the reasoning behind these choices.

## License

MIT
