import { describe, expect, it } from "vitest";
import {
  GLOSSARY_CATEGORIES,
  GLOSSARY_DATA,
  getGlossaryByCategory,
  searchGlossary,
} from "../glossary-data.js";

describe("canonical glossary data", () => {
  it("should include a substantial source-attributed built-in glossary", () => {
    expect(GLOSSARY_DATA.length).toBeGreaterThanOrEqual(250);
    expect(GLOSSARY_DATA.every((entry) => entry.source && entry.sourceUrl)).toBe(true);
  });

  it("should cover product-critical localization and AI terminology", () => {
    const terms = new Set(GLOSSARY_DATA.map((entry) => entry.term.toLowerCase()));
    for (const term of [
      "translation memory",
      "locale",
      "accessibility",
      "embedding",
      "prompt injection",
      "rate limit",
      "model context protocol",
    ]) {
      expect(terms.has(term)).toBe(true);
    }
  });

  it("should expose expanded categories and searchable entries", () => {
    expect(GLOSSARY_CATEGORIES).toEqual(
      expect.arrayContaining([
        "programming",
        "technical",
        "business",
        "general",
        "localization",
        "security",
        "ai",
        "web",
      ])
    );
    expect(getGlossaryByCategory("AI").length).toBeGreaterThan(10);
    expect(searchGlossary("prompt injection")[0]).toMatchObject({
      term: "prompt injection",
      translation: "inyección de instrucciones",
      category: "security",
    });
  });
});
