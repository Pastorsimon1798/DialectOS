/**
 * Built-in glossary display helpers.
 * Canonical glossary data lives in @dialectos/types so CLI and MCP share one corpus.
 */

import type { GlossaryEntry } from "@dialectos/types";
export {
  GLOSSARY_CATEGORIES,
  GLOSSARY_DATA,
  getGlossaryByCategory,
  searchGlossary,
} from "@dialectos/types";

/**
 * Format glossary results for display
 */
export function formatGlossaryResults(
  entries: GlossaryEntry[],
  format: "text" | "json"
): string {
  if (entries.length === 0) {
    return format === "json"
      ? JSON.stringify([], null, 2)
      : "No results found.";
  }

  if (format === "json") {
    return JSON.stringify(entries, null, 2);
  }

  // Text format
  const lines: string[] = [];

  // Group by category
  const grouped = entries.reduce((acc, entry) => {
    const category = entry.category || "uncategorized";
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(entry);
    return acc;
  }, {} as Record<string, GlossaryEntry[]>);

  // Display by category
  for (const [category, categoryEntries] of Object.entries(grouped)) {
    lines.push(`\n${category.toUpperCase()}`);
    lines.push("=".repeat(category.length));

    for (const entry of categoryEntries) {
      const source = entry.source ? ` [${entry.source}]` : "";
      lines.push(`  ${entry.term} → ${entry.translation}${source}`);
    }
  }

  return lines.join("\n").trim();
}
