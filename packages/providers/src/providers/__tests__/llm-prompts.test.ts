import { describe, expect, it } from "vitest";
import {
  isCompactModel,
  detectModelTier,
  buildSystemPrompt,
  buildDialectSystemPrompt,
  buildUserPrompt,
} from "../llm-prompts.js";

const PROMPT_BUDGET = 8_000; // chars

describe("model capability detection", () => {
  it("detects compact models by param count", () => {
    expect(isCompactModel("llama-3.1-8b")).toBe(true);
    expect(isCompactModel("llama-3.1-70b")).toBe(false);
    expect(isCompactModel("qwen2.5-0.5b")).toBe(true);
    expect(isCompactModel("minimax-m2")).toBe(true);
    expect(isCompactModel(undefined)).toBe(false);
  });

  it("classifies model tiers", () => {
    expect(detectModelTier("qwen2.5-0.5b")).toBe("tiny");
    expect(detectModelTier("llama-3.1-8b")).toBe("small");
    expect(detectModelTier("llama-3.1-70b")).toBe("medium");
    expect(detectModelTier("gpt-4o")).toBe("large");
  });
});

describe("prompt size budget", () => {
  it("buildSystemPrompt is compact", () => {
    expect(buildSystemPrompt().length).toBeLessThan(PROMPT_BUDGET);
  });

  it("buildDialectSystemPrompt for tiny input stays under budget", () => {
    const prompt = buildDialectSystemPrompt("es-MX", "Hello");
    expect(prompt.length).toBeLessThan(PROMPT_BUDGET);
  });

  it("buildUserPrompt for tiny input stays under budget", () => {
    const prompt = buildUserPrompt("Hello", "en", "es", { dialect: "es-MX" }, "gpt-4o");
    expect(prompt.length).toBeLessThan(PROMPT_BUDGET);
  });

  it("compact model user prompt is bare source text", () => {
    const prompt = buildUserPrompt("Hello world", "en", "es", { dialect: "es-MX" }, "qwen2.5-0.5b");
    expect(prompt).toContain("Hello world");
    expect(prompt).not.toContain("Translate the above text");
  });

  it("full model user prompt includes instruction", () => {
    const prompt = buildUserPrompt("Hello world", "en", "es", { dialect: "es-MX" }, "gpt-4o");
    expect(prompt).toContain("Translate the above text");
    expect(prompt).toContain("es-MX");
  });
});
