import { describe, expect, it } from "vitest";
import { normalizeCapitalization } from "../capitalization.js";

describe("normalizeCapitalization", () => {
  it("lowercases days of the week mid-sentence", () => {
    expect(normalizeCapitalization("Voy el Lunes al médico.")).toContain("el lunes");
  });

  it("preserves day capitalization at sentence start", () => {
    expect(normalizeCapitalization("Lunes es un buen día.")).toContain("Lunes");
  });

  it("lowercases months mid-sentence", () => {
    expect(normalizeCapitalization("Nací en Enero de 1990.")).toContain("en enero");
  });

  it("preserves month at sentence start", () => {
    expect(normalizeCapitalization("Enero es frío.")).toContain("Enero");
  });

  it("lowercases languages mid-sentence", () => {
    expect(normalizeCapitalization("Hablo Español e Inglés.")).toContain("español");
    expect(normalizeCapitalization("Hablo Español e Inglés.")).toContain("inglés");
  });

  it("fixes multiple capitalized words in one sentence", () => {
    const result = normalizeCapitalization("El Viernes de Marzo hablé Francés.");
    expect(result).toContain("viernes");
    expect(result).toContain("marzo");
    expect(result).toContain("francés");
  });

  it("preserves sentence-start El/La", () => {
    expect(normalizeCapitalization("El carro es rojo.")).toBe("El carro es rojo.");
  });

  it("handles text with no changes needed", () => {
    const original = "El lunes fui a la casa.";
    expect(normalizeCapitalization(original)).toBe(original);
  });

  it("fixes mid-sentence Yo pronoun", () => {
    expect(normalizeCapitalization("Dijo que Yo era alto.")).toContain("que yo era");
  });

  it("preserves Yo at sentence start", () => {
    expect(normalizeCapitalization("Yo fui a la tienda.")).toContain("Yo");
  });
});
