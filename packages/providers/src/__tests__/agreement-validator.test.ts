import { describe, expect, it } from "vitest";
import { validateAgreement, applyAgreementFixes } from "../agreement-validator.js";

describe("validateAgreement", () => {
  it("passes for correct text", () => {
    const result = validateAgreement("El carro está en la casa.");
    expect(result.passed).toBe(true);
    expect(result.warnings).toHaveLength(0);
  });

  it("detects el computadora as gender mismatch", () => {
    const result = validateAgreement("El computadora está rota.");
    expect(result.passed).toBe(false);
    expect(result.warnings.length).toBeGreaterThanOrEqual(1);
    const w = result.warnings[0];
    expect(w.type).toBe("gender");
    expect(w.found).toContain("computadora");
    expect(w.suggestion).toContain("la computadora");
  });

  it("detects la carro as gender mismatch", () => {
    const result = validateAgreement("La carro es rojo.");
    expect(result.passed).toBe(false);
    expect(result.warnings.some((w) => w.found.includes("carro"))).toBe(true);
  });

  it("detects el guagua mismatch", () => {
    const result = validateAgreement("Fui al guagua al centro.");
    expect(result.passed).toBe(false);
    const guaguaWarning = result.warnings.find((w) => w.found.includes("guagua"));
    expect(guaguaWarning).toBeDefined();
    expect(guaguaWarning?.suggestion).toContain("la guagua");
  });

  it("passes for la guagua", () => {
    const result = validateAgreement("Fui en la guagua al centro.");
    expect(result.warnings.filter((w) => w.found.includes("guagua"))).toHaveLength(0);
  });

  it("handles multiple mismatches in one sentence", () => {
    const result = validateAgreement("El computadora está en el casa.");
    expect(result.warnings.length).toBeGreaterThanOrEqual(2);
  });

  it("does not flag non-noun words", () => {
    const result = validateAgreement("La verdad es que el libro es bueno.");
    expect(result.passed).toBe(true);
  });

  it("handles text without articles", () => {
    const result = validateAgreement("Necesito manejar mi carro a trabajo.");
    expect(result.passed).toBe(true);
  });

  it("detects plural article with singular noun (number mismatch)", () => {
    const result = validateAgreement("Los carro son rojos.");
    const numberWarnings = result.warnings.filter((w) => w.type === "number");
    expect(numberWarnings.length).toBeGreaterThanOrEqual(1);
  });

  it("passes for correct plural agreement", () => {
    const result = validateAgreement("Los carros son rojos.");
    const numberWarnings = result.warnings.filter((w) => w.type === "number");
    expect(numberWarnings).toHaveLength(0);
  });

  it("detects gender mismatch in plural (los computadoras)", () => {
    const result = validateAgreement("Los computadoras son nuevas.");
    const genderWarnings = result.warnings.filter((w) => w.type === "gender");
    expect(genderWarnings.length).toBeGreaterThanOrEqual(1);
  });
});

describe("applyAgreementFixes", () => {
  it("fixes el computadora to la computadora", () => {
    const fixed = applyAgreementFixes("El computadora está rota.");
    expect(fixed).toContain("la computadora");
    expect(fixed).not.toContain("El computadora");
  });

  it("fixes el guagua to la guagua", () => {
    const fixed = applyAgreementFixes("Fui al guagua al centro.");
    expect(fixed).toContain("la guagua");
  });

  it("returns unchanged text when no fixes needed", () => {
    const original = "El carro está en la casa.";
    expect(applyAgreementFixes(original)).toBe(original);
  });
});
