/**
 * End-to-end execution verification for recent LLM-path fixes.
 * These are real-code-execution tests, not mocks.
 */

import { describe, it, expect, vi } from "vitest";
import { LLMProvider } from "@espanol/providers";
import { executeTranslate } from "../commands/translate.js";
import { buildSemanticTranslationContext } from "../lib/semantic-context.js";
import { buildLexicalAmbiguityExpectations, checkLexicalCompliance } from "../lib/lexical-ambiguity.js";
import { calculateQualityScore } from "../lib/quality-score.js";

describe("LLM path execution verification", () => {
  it("always includes base output constraints in semantic context", () => {
    const ctx = buildSemanticTranslationContext({
      text: "Hello world",
      dialect: "es-ES",
      formality: "auto",
      documentKind: "plain",
    });
    expect(ctx).toContain("Do not copy forbidden examples");
    expect(ctx).toContain("avoid-by-default");
  });

  it("detects lexical compliance failures for wrong dialect terms", () => {
    // es-MX forbids "china" for orange juice; es-PR allows both "china" and "naranja"
    const mxExpectations = buildLexicalAmbiguityExpectations("Orange juice is ready.", "es-MX");
    expect(mxExpectations.matchedRuleIds).toContain("citrus-orange-juice");

    // "china" is forbidden in es-MX
    const bad = checkLexicalCompliance("Jugo de china está listo.", mxExpectations);
    expect(bad.passed).toBe(false);
    expect(bad.violations.some((v) => v.includes("china"))).toBe(true);

    // "naranja" is required in es-MX
    const good = checkLexicalCompliance("Jugo de naranja está listo.", mxExpectations);
    expect(good.passed).toBe(true);
    expect(good.score).toBe(1);
  });

  it("integrates lexical compliance into quality score", () => {
    const expectations = buildLexicalAmbiguityExpectations("Take the bus to work.", "es-CU");
    const good = checkLexicalCompliance("Toma la guagua al trabajo.", expectations);
    const quality = calculateQualityScore(
      "Take the bus to work.",
      "Toma la guagua al trabajo.",
      [], {}, true, good.score
    );
    expect(quality.lexicalCompliance).toBe(1);
    expect(quality.score).toBeGreaterThanOrEqual(80);
  });

  it("parses OpenAI string and array content blocks", () => {
    const provider = new LLMProvider({ endpoint: "https://example.com/v1", model: "test" });
    const extract = (provider as any)["extractResponseText"].bind(provider);

    expect(extract({ choices: [{ message: { content: "Hola mundo" } }] }))
      .toBe("Hola mundo");

    expect(extract({ choices: [{ message: { content: [
      { type: "text", text: "Hola " },
      { type: "text", text: "mundo" }
    ] } }] }))
      .toBe("Hola mundo");

    expect(extract({ choices: [{ message: { content: [] } }] }))
      .toBeUndefined();
  });

  it("executes full translate CLI with dialect context and constraints", async () => {
    let capturedOptions: any = null;
    const mockProvider = {
      name: "llm",
      async translate(text: string, sourceLang: string, targetLang: string, options: any) {
        capturedOptions = options;
        return { translatedText: "Hola mundo", provider: "llm" };
      },
    };
    const stdoutSpy = vi.spyOn(process.stdout, "write").mockImplementation(() => true);
    const stderrSpy = vi.spyOn(process.stderr, "write").mockImplementation(() => true);

    await executeTranslate("Hello world", { dialect: "es-PR" }, () => mockProvider as any);

    expect(capturedOptions).toBeTruthy();
    expect(capturedOptions.context).toContain("Puerto Rican");
    expect(capturedOptions.context).toContain("Do not copy forbidden examples");

    stdoutSpy.mockRestore();
    stderrSpy.mockRestore();
  });
});
