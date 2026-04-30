import { describe, expect, it } from "vitest";
import { detectFalseFriends } from "../false-friends.js";

describe("detectFalseFriends", () => {
  it("detects 'embarazada' used for 'embarrassed'", () => {
    const warnings = detectFalseFriends("Estaba embarazada por la situación.");
    expect(warnings.length).toBeGreaterThanOrEqual(1);
    expect(warnings[0].found).toBe("embarazada");
    expect(warnings[0].correctWord).toContain("avergonzado");
  });

  it("detects 'librería' used for 'library'", () => {
    const warnings = detectFalseFriends("Fui a la librería para estudiar.");
    expect(warnings.some((w) => w.found === "librería")).toBe(true);
  });

  it("detects 'actualmente' used for 'actually'", () => {
    const warnings = detectFalseFriends("Actualmente, no lo sé.");
    expect(warnings.some((w) => w.found === "actualmente")).toBe(true);
  });

  it("detects 'discutir' used for 'discuss'", () => {
    const warnings = detectFalseFriends("Vamos a discutir el tema.");
    expect(warnings.some((w) => w.found === "discutir")).toBe(true);
  });

  it("detects 'realizar' infinitive for 'realize'", () => {
    const warnings = detectFalseFriends("No realizar que estaba aquí.");
    expect(warnings.some((w) => w.found === "realizar")).toBe(true);
  });

  it("detects multiple false friends in one text", () => {
    const warnings = detectFalseFriends("Fui a la librería y no realizar que estaba embarazada.");
    expect(warnings.length).toBeGreaterThanOrEqual(3);
  });

  it("returns empty for clean text", () => {
    expect(detectFalseFriends("El carro está en la casa.")).toHaveLength(0);
  });

  it("handles punctuation attached to words", () => {
    const warnings = detectFalseFriends("Fui a la librería, y luego salí.");
    expect(warnings.some((w) => w.found === "librería")).toBe(true);
  });
});
