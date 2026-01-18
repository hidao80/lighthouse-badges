# lighthouse-badges

![Lint](https://github.com/hidao80/lighthouse-badges/actions/workflows/lint.yml/badge.svg)
![Audit](https://github.com/hidao80/lighthouse-badges/actions/workflows/audit.yml/badge.svg)
![Build](https://github.com/hidao80/lighthouse-badges/actions/workflows/build.yml/badge.svg)

A CLI tool to generate Lighthouse score badges, JSON, or SVG using local Chrome and the Lighthouse npm package.

```copilot prompt copy
How do I use it?
```

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
![Accessibility](https://img.shields.io/badge/Accessibility-100-brightgreen?style=flat-square)&emsp;![Best_Practices](https://img.shields.io/badge/Best_Practices-93-brightgreen?style=flat-square)&emsp;![Performance](https://img.shields.io/badge/Performance-100-brightgreen?style=flat-square)&emsp;![SEO](https://img.shields.io/badge/SEO-80-yellow?style=flat-square)
```

Rendered:

![Accessibility](https://img.shields.io/badge/Accessibility-100-brightgreen?style=flat-square)&emsp;![Best_Practices](https://img.shields.io/badge/Best_Practices-93-brightgreen?style=flat-square)&emsp;![Performance](https://img.shields.io/badge/Performance-100-brightgreen?style=flat-square)&emsp;![SEO](https://img.shields.io/badge/SEO-80-yellow?style=flat-square)

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
  "seo": 80
}
```

### SVG Output

```bash copy
lighthouse-badges https://example.com -s
```

Outputs an SVG string with donut charts for each score.

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
pnpm dlx github:hidao80/lighthouse-badges https://example.com
```

## License

MIT
