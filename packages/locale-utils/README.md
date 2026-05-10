# @dialectos/locale-utils

Utilities for locale file read, write, flatten, unflatten, and diff.

## Features

- Read and write JSON locale files
- Flatten nested locale objects to dot-notation keys
- Unflatten dot-notation keys back to nested objects
- Diff two locale objects to find added, removed, and changed keys

## Usage

```typescript
import { readLocaleFile, writeLocaleFile, diffLocales, flattenLocale, unflattenLocale } from "@dialectos/locale-utils";

// Read a locale JSON file
const entries = readLocaleFile("locales/en.json");
// Returns: [{ key: "nav.home", value: "Home" }, ...]

// Write entries back to a locale file
writeLocaleFile("locales/es.json", entries, 2);

// Diff two locale files
const diff = diffLocales(sourceEntries, targetEntries);
// Returns: { added: [...], removed: [...], changed: [...] }
```
