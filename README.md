# lighthouse-badges

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
![Lint](https://github.com/hidao80/lighthouse-badges/actions/workflows/lint.yml/badge.svg)
![Audit](https://github.com/hidao80/lighthouse-badges/actions/workflows/audit.yml/badge.svg)
![Build](https://github.com/hidao80/lighthouse-badges/actions/workflows/build.yml/badge.svg)
[![Ask DeepWiki](https://deepwiki.com/badge.svg)](https://deepwiki.com/hidao80/lighthouse-badges)

A CLI tool to generate Lighthouse score badges, JSON, or SVG using local Chrome and the Lighthouse npm package.

## Installation

```bash copy
npm install -g lighthouse-badges
```

## Requirements

- Node.js >= 18.0.0
- Google Chrome installed on your system

## Usage

```bash copy
lighthouse-badges <URL> [options]
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
lighthouse-badges https://example.com
```

Output:

```
![Accessibility](https://img.shields.io/badge/Accessibility-94-brightgreen?style=flat-square)&emsp;![Best_Practices](https://img.shields.io/badge/Best_Practices-100-brightgreen?style=flat-square)&emsp;![Performance](https://img.shields.io/badge/Performance-93-brightgreen?style=flat-square)&emsp;![SEO](https://img.shields.io/badge/SEO-90-brightgreen?style=flat-square)
```

Rendered:

![Accessibility](https://img.shields.io/badge/Accessibility-94-brightgreen?style=flat-square)&emsp;![Best_Practices](https://img.shields.io/badge/Best_Practices-100-brightgreen?style=flat-square)&emsp;![Performance](https://img.shields.io/badge/Performance-93-brightgreen?style=flat-square)&emsp;![SEO](https://img.shields.io/badge/SEO-72-brightgreen?style=flat-square)

### JSON Output

```bash copy
lighthouse-badges https://example.com -j
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
lighthouse-badges https://example.com -s
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
npx github:hidao80/lighthouse-badges https://example.com
```

## License

MIT
