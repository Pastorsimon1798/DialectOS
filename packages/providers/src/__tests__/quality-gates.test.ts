import { describe, it, expect } from "vitest";
import {
  lengthSanityCheck,
  dialectComplianceCheck,
  personConsistencyCheck,
  haberTenerCheck,
  runQualityGates,
} from "../quality-gates.js";
import type { QualityGateContext } from "../quality-gates.js";

function ctx(overrides: Partial<QualityGateContext> = {}): QualityGateContext {
  return {
    sourceText: "Hello world",
    translatedText: "Hola mundo",
    dialect: "es-MX",
    modelTier: "tiny",
    ...overrides,
  };
}

describe("lengthSanityCheck", () => {
  it("passes for normal length ratio", () => {
    const result = lengthSanityCheck(ctx());
    expect(result.passed).toBe(true);
  });

  it("fails for output too long", () => {
    const result = lengthSanityCheck(
      ctx({ sourceText: "Hi", translatedText: "a".repeat(100) })
    );
    expect(result.passed).toBe(false);
    expect(result.details).toContain("4x");
  });

  it("fails for output too short", () => {
    const result = lengthSanityCheck(
      ctx({ sourceText: "Hello world this is a test", translatedText: "x" })
    );
    expect(result.passed).toBe(false);
    expect(result.details).toContain("15%");
  });
});

describe("personConsistencyCheck", () => {
  it("passes for correct person", () => {
    const result = personConsistencyCheck(
      ctx({ sourceText: "You do it well", translatedText: "Lo haces bien" })
    );
    expect(result.passed).toBe(true);
  });

  it("fails for You → Yo flip", () => {
    const result = personConsistencyCheck(
      ctx({ sourceText: "You do it well", translatedText: "Yo lo hago bien" })
    );
    expect(result.passed).toBe(false);
    expect(result.details).toContain("person flip");
  });
});

describe("haberTenerCheck", () => {
  it("passes for correct tener", () => {
    const result = haberTenerCheck(
      ctx({ sourceText: "You have a nice house", translatedText: "Tienes una casa bonita" })
    );
    expect(result.passed).toBe(true);
  });

  it("fails for haber used as possessive", () => {
    const result = haberTenerCheck(
      ctx({ sourceText: "You have a nice house", translatedText: "Te has dado una casa bonita" })
    );
    expect(result.passed).toBe(false);
    expect(result.details).toContain("haber");
  });
});

describe("runQualityGates", () => {
  it("runs all applicable gates for tiny tier", async () => {
    const results = await runQualityGates(ctx({ modelTier: "tiny" }));
    expect(results.length).toBeGreaterThanOrEqual(2);
  });

  it("skips tiny-only gates for large tier", async () => {
    const results = await runQualityGates(ctx({ modelTier: "large" }));
    // Should only run lengthSanity and dialectCompliance
    const names = results.map((r) => r.name);
    expect(names).toContain("lengthSanity");
    expect(names).toContain("dialectCompliance");
    expect(names).not.toContain("personConsistency");
    expect(names).not.toContain("haberTener");
  });
});
