import { describe, expect, it } from "vitest";
import { generateGlossarySuggestions } from "../lib/glossary-suggest.js";
import type { CorrectionEntry } from "@dialectos/providers";

describe("generateGlossarySuggestions", () => {
  const baseCorrection: CorrectionEntry = {
    source: "Click the button",
    original: "Hace clic en el boton",
    corrected: "Haz clic en el botón",
    dialect: "es-MX",
    timestamp: new Date().toISOString(),
  };

  it("returns empty when corrections are below minOccurrences", () => {
    const suggestions = generateGlossarySuggestions([baseCorrection, baseCorrection]);
    expect(suggestions).toEqual([]);
  });

  it("returns suggestions when corrections meet threshold", () => {
    const corrections: CorrectionEntry[] = [];
    for (let i = 0; i < 5; i++) {
      corrections.push({
        ...baseCorrection,
        source: "Click the button to submit",
        original: "Hace clic en el boton para enviar",
        corrected: "Haz clic en el botón para enviar",
      });
    }

    const suggestions = generateGlossarySuggestions(corrections, { minOccurrences: 3, minConfidence: 0.3 });
    expect(suggestions.length).toBeGreaterThan(0);
  });

  it("sorts suggestions by confidence descending", () => {
    const corrections: CorrectionEntry[] = [];

    // High frequency term
    for (let i = 0; i < 10; i++) {
      corrections.push({
        source: "Click the button",
        original: "Apreta el boton",
        corrected: "Haz clic en el botón",
        dialect: "es-MX",
        timestamp: new Date().toISOString(),
      });
    }

    // Lower frequency term
    for (let i = 0; i < 3; i++) {
      corrections.push({
        source: "Open the file",
        original: "Abri el archivo",
        corrected: "Abre el archivo",
        dialect: "es-AR",
        timestamp: new Date().toISOString(),
      });
    }

    const suggestions = generateGlossarySuggestions(corrections, { minOccurrences: 3 });
    for (let i = 1; i < suggestions.length; i++) {
      expect(suggestions[i - 1].confidence).toBeGreaterThanOrEqual(suggestions[i].confidence);
    }
  });

  it("respects minConfidence filter", () => {
    const corrections: CorrectionEntry[] = [];
    for (let i = 0; i < 3; i++) {
      corrections.push({
        ...baseCorrection,
        source: "Click the button",
        original: "Hace clic en el boton",
        corrected: "Haz clic en el botón",
      });
    }

    const low = generateGlossarySuggestions(corrections, { minConfidence: 0 });
    const high = generateGlossarySuggestions(corrections, { minConfidence: 0.99 });
    expect(low.length).toBeGreaterThanOrEqual(high.length);
  });

  it("tracks dialects in evidence", () => {
    const corrections: CorrectionEntry[] = [
      { ...baseCorrection, dialect: "es-MX", source: "Click the button", corrected: "Haz clic en el botón" },
      { ...baseCorrection, dialect: "es-AR", source: "Click the button", corrected: "Hacé clic en el botón" },
      { ...baseCorrection, dialect: "es-CO", source: "Click the button", corrected: "Haz clic en el botón" },
    ];

    const suggestions = generateGlossarySuggestions(corrections, { minOccurrences: 2 });
    if (suggestions.length > 0) {
      expect(suggestions[0].evidence.uniqueDialects.length).toBeGreaterThan(0);
    }
  });

  it("returns empty for empty corrections", () => {
    const suggestions = generateGlossarySuggestions([]);
    expect(suggestions).toEqual([]);
  });
});
