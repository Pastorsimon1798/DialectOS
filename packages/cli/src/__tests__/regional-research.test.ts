import { describe, expect, it } from "vitest";
import { parseDialectList, researchRegionalTerm } from "../lib/regional-research.js";

const sources = [
  { title: "Puerto Rican food glossary", link: "https://example.com/pr", snippet: "jugo de china means orange juice" },
];

describe("regional research runtime", () => {
  it("creates source-backed proposals without mutating runtime data", async () => {
    const result = await researchRegionalTerm({
      concept: "orange juice",
      dialects: ["es-PR", "es-MX"],
      semanticField: "food-drink",
      search: async () => sources,
    });

    expect(result.mode).toBe("research-proposal");
    expect(result.mutationPolicy).toBe("never-mutates-runtime-data");
    expect(result.proposals.find((proposal) => proposal.dialect === "es-PR")?.preferred).toContain("jugo de china");
    expect(result.proposals.find((proposal) => proposal.dialect === "es-MX")?.preferred).toContain("jugo de naranja");
    expect(result.proposals.every((proposal) => proposal.sources.length > 0)).toBe(true);
    expect(result.suggestedFixtures.length).toBe(2);
  });

  it("works without search as an explicit low-evidence proposal", async () => {
    const result = await researchRegionalTerm({
      concept: "unknown concept",
      dialects: ["es-PR"],
    });

    expect(result.warnings).toContain("No search adapter configured; using built-in priors only.");
    expect(result.proposals[0].confidence).toBe("low");
  });

  it("validates dialect lists", () => {
    expect(parseDialectList("es-PR,es-MX")).toEqual(["es-PR", "es-MX"]);
    expect(() => parseDialectList("es-XX")).toThrow(/Invalid dialect/);
  });
});
