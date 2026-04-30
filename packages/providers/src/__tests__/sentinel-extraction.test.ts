import { describe, expect, it } from "vitest";
import { extractSentinels, restoreSentinels } from "../sentinel-extraction.js";

describe("extractSentinels", () => {
  it("returns original text when nothing to extract", () => {
    const { text, sentinels } = extractSentinels("Hello world this is plain text");
    expect(text).toBe("Hello world this is plain text");
    expect(sentinels.size).toBe(0);
  });

  it("extracts fenced code blocks", () => {
    const input = "Before\n```js\nconst x = 1;\n```\nAfter";
    const { text, sentinels } = extractSentinels(input);
    expect(sentinels.size).toBe(1);
    expect([...sentinels.values()][0]).toBe("```js\nconst x = 1;\n```");
    expect(text).not.toContain("const x");
    expect(text).toContain("Before");
    expect(text).toContain("After");
  });

  it("extracts inline code", () => {
    const input = "Run `npm install` to set up the project";
    const { text, sentinels } = extractSentinels(input);
    expect(sentinels.size).toBe(1);
    expect([...sentinels.values()][0]).toBe("`npm install`");
    expect(text).not.toContain("npm install");
  });

  it("extracts URLs", () => {
    const input = "Visit https://example.com/docs for more info";
    const { text, sentinels } = extractSentinels(input);
    expect(sentinels.size).toBe(1);
    expect([...sentinels.values()][0]).toBe("https://example.com/docs");
    expect(text).toContain("Visit");
    expect(text).toContain("for more info");
  });

  it("extracts email addresses", () => {
    const input = "Contact support@example.com for help";
    const { text, sentinels } = extractSentinels(input);
    expect(sentinels.size).toBe(1);
    expect([...sentinels.values()][0]).toBe("support@example.com");
  });

  it("extracts file paths with code extensions", () => {
    const input = "Edit config.json and update settings";
    const { text, sentinels } = extractSentinels(input);
    expect(sentinels.size).toBe(1);
    expect([...sentinels.values()][0]).toBe("config.json");
  });

  it("extracts paths with slashes", () => {
    const input = "Create src/utils/helpers.ts";
    const { text, sentinels } = extractSentinels(input);
    expect(sentinels.size).toBe(1);
    expect([...sentinels.values()][0]).toBe("src/utils/helpers.ts");
  });

  it("does not extract short common words as file paths", () => {
    const input = "This is a good day";
    const { text, sentinels } = extractSentinels(input);
    expect(sentinels.size).toBe(0);
    expect(text).toBe(input);
  });

  it("handles multiple extractions in one text", () => {
    const input = "See https://docs.example.com and email admin@test.com about config.yml";
    const { text, sentinels } = extractSentinels(input);
    expect(sentinels.size).toBeGreaterThanOrEqual(2);
    expect(text).not.toContain("https://docs.example.com");
    expect(text).not.toContain("admin@test.com");
  });

  it("extracts fenced code before inline code to avoid nesting issues", () => {
    const input = "```bash\necho `hello`\n```\nThen run `npm test`";
    const { text, sentinels } = extractSentinels(input);
    const values = [...sentinels.values()];
    expect(values.some((v) => v.startsWith("```bash"))).toBe(true);
    expect(values.some((v) => v === "`npm test`")).toBe(true);
  });

  it("preserves surrounding context around extractions", () => {
    const input = "The file package.json contains dependencies";
    const { text, sentinels } = extractSentinels(input);
    expect(sentinels.size).toBe(1);
    expect(text).toContain("The file");
    expect(text).toContain("contains dependencies");
  });
});

describe("restoreSentinels", () => {
  it("returns original text when no sentinels", () => {
    expect(restoreSentinels("plain text", new Map())).toBe("plain text");
  });

  it("roundtrips URL extraction and restoration", () => {
    const input = "Visit https://example.com/docs for info";
    const { text, sentinels } = extractSentinels(input);
    const restored = restoreSentinels(text, sentinels);
    expect(restored).toBe(input);
  });

  it("roundtrips code block extraction and restoration", () => {
    const input = "Before\n```js\nconst x = 1;\n```\nAfter";
    const { text, sentinels } = extractSentinels(input);
    const restored = restoreSentinels(text, sentinels);
    expect(restored).toBe(input);
  });

  it("roundtrips multiple extractions", () => {
    const input = "Edit config.json, see https://example.com, email admin@test.com";
    const { text, sentinels } = extractSentinels(input);
    const restored = restoreSentinels(text, sentinels);
    expect(restored).toBe(input);
  });

  it("handles LLM whitespace normalization around sentinels", () => {
    const sentinels = new Map<string, string>();
    sentinels.set("{{URL_0}}", "https://example.com");
    const result = restoreSentinels("Visit {{ URL_0 }} for info", sentinels);
    expect(result).toBe("Visit https://example.com for info");
  });
});
