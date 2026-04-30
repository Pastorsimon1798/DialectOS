import { describe, expect, it } from "vitest";
import { normalizePunctuation } from "../punctuation-normalizer.js";
import { fixAccentuation } from "../accentuation.js";
import { validateAgreement } from "../agreement-validator.js";

describe("normalizePunctuation", () => {
  it("adds ¿ to questions missing it", () => {
    expect(normalizePunctuation("Cómo estás?")).toContain("¿Cómo estás?");
  });

  it("does not double ¿ if already present", () => {
    expect(normalizePunctuation("¿Cómo estás?")).toBe("¿Cómo estás?");
  });

  it("adds ¡ to exclamations missing it", () => {
    expect(normalizePunctuation("Qué frío!")).toContain("¡Qué frío!");
  });

  it("does not double ¡ if already present", () => {
    expect(normalizePunctuation("¡Qué frío!")).toBe("¡Qué frío!");
  });

  it("returns unchanged text without questions or exclamations", () => {
    const text = "El carro está en la casa.";
    expect(normalizePunctuation(text)).toBe(text);
  });

  it("handles multiple sentences", () => {
    const result = normalizePunctuation("Hola. Cómo estás? Qué frío!");
    expect(result).toContain("¿Cómo estás?");
    expect(result).toContain("¡Qué frío!");
  });
});

describe("fixAccentuation", () => {
  it("fixes tambien → también", () => {
    expect(fixAccentuation("Yo tambien quiero")).toBe("Yo también quiero");
  });

  it("fixes ademas → además", () => {
    expect(fixAccentuation("Es ademas muy bueno")).toBe("Es además muy bueno");
  });

  it("fixes algun → algún", () => {
    expect(fixAccentuation("Necesito algun libro")).toBe("Necesito algún libro");
  });

  it("fixes ningun → ningún", () => {
    expect(fixAccentuation("No hay ningun problema")).toBe("No hay ningún problema");
  });

  it("fixes quizas → quizás", () => {
    expect(fixAccentuation("Quizas venga manana")).toBe("Quizás venga manana");
  });

  it("does not change already-accented text", () => {
    expect(fixAccentuation("También es además")).toBe("También es además");
  });

  it("returns unchanged text without targets", () => {
    expect(fixAccentuation("El carro está roto")).toBe("El carro está roto");
  });
});

describe("validateAgreement (number)", () => {
  it("detects plural article with singular noun", () => {
    const result = validateAgreement("Los carro son rojos.");
    const numberWarnings = result.warnings.filter((w) => w.type === "number");
    expect(numberWarnings.length).toBeGreaterThanOrEqual(1);
  });

  it("passes for correct plural agreement", () => {
    const result = validateAgreement("Los carros son rojos.");
    const numberWarnings = result.warnings.filter((w) => w.type === "number");
    expect(numberWarnings).toHaveLength(0);
  });

  it("detects gender mismatch in plural", () => {
    const result = validateAgreement("Los computadoras son nuevas.");
    const genderWarnings = result.warnings.filter((w) => w.type === "gender");
    expect(genderWarnings.length).toBeGreaterThanOrEqual(1);
  });
});
