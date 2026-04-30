import { describe, expect, it } from "vitest";
import { normalizeTypography } from "../typography.js";

describe("normalizeTypography", () => {
  it("converts three dots to ellipsis", () => {
    expect(normalizeTypography("Y así...")).toContain("…");
  });

  it("converts double dash to em dash", () => {
    expect(normalizeTypography("Hola -- dijo")).toContain("—");
  });

  it("does not touch triple dash", () => {
    expect(normalizeTypography("Hola ---")).not.toContain("——");
  });

  it("converts straight quotes to curly quotes", () => {
    const result = normalizeTypography('Dijo "hola" al salir.');
    expect(result).toContain("“hola”");
    expect(result).not.toContain('"hola"');
  });

  it("handles nested quotes", () => {
    const result = normalizeTypography('Dijo "ella dijo "no"".');
    const opens = (result.match(/“/g) || []).length;
    const closes = (result.match(/”/g) || []).length;
    expect(opens).toBe(closes);
  });

  it("collapses double spaces after period", () => {
    expect(normalizeTypography("Hola.  Adiós.")).toBe("Hola. Adiós.");
  });

  it("does not touch code backtick quotes", () => {
    const result = normalizeTypography('Usa `console.log("test")` para debug.');
    expect(result).toContain('"test"');
  });

  it("handles text with no changes needed", () => {
    const original = "Hola. Adiós.";
    expect(normalizeTypography(original)).toBe(original);
  });

  it("normalizes multiple spaces to single", () => {
    expect(normalizeTypography("Hola    mundo")).toBe("Hola mundo");
  });
});
