# Basic Translation Example

This example demonstrates how to use DialectOS to translate a README file to multiple Spanish dialects.

## Setup

Clone the repository and install dependencies:

```bash
pnpm install
pnpm build
```

## Translate to Mexican Spanish

```bash
node packages/cli/dist/index.js translate-readme README.md \
  --dialect es-MX \
  --output README.es-MX.md \
  --policy balanced
```

## Translate to Argentine Spanish

```bash
node packages/cli/dist/index.js translate-readme README.md \
  --dialect es-AR \
  --output README.es-AR.md \
  --policy strict
```

## Batch translate i18n files

```bash
node packages/cli/dist/index.js i18n batch-translate locales \
  --base en \
  --targets es-MX,es-AR,es-CO,es-ES
```

## Check what changed

```bash
node packages/cli/dist/index.js i18n detect-missing locales/en.json locales/es-MX.json
```
