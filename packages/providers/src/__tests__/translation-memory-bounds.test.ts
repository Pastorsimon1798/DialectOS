import { describe, expect, it, beforeEach, afterEach } from "vitest";
import * as fs from "node:fs";
import * as path from "node:path";
import * as os from "node:os";
import { TranslationMemory } from "../translation-memory.js";

describe("TranslationMemory bounds validation", () => {
  let tempDir: string;

  beforeEach(() => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "tm-bounds-"));
  });

  afterEach(() => {
    try {
      fs.rmSync(tempDir, { recursive: true, force: true });
    } catch {
      // ignore cleanup errors
    }
  });

  it("accepts positive integer maxSize", () => {
    expect(() => new TranslationMemory({ cacheDir: tempDir, maxSize: 1 })).not.toThrow();
    expect(() => new TranslationMemory({ cacheDir: tempDir, maxSize: 10_000 })).not.toThrow();
  });

  it("accepts zero maxSize as documented unbounded mode", () => {
    const mem = new TranslationMemory({ cacheDir: tempDir, maxSize: 0 });
    expect(mem.getSize()).toBe(0);
  });

  it("accepts negative maxSize as documented unbounded mode", () => {
    const mem = new TranslationMemory({ cacheDir: tempDir, maxSize: -1 });
    expect(mem.getSize()).toBe(0);
  });

  it("rejects NaN maxSize", () => {
    expect(() => new TranslationMemory({ cacheDir: tempDir, maxSize: NaN })).toThrow("maxSize must be an integer");
  });

  it("rejects float maxSize", () => {
    expect(() => new TranslationMemory({ cacheDir: tempDir, maxSize: 10.5 })).toThrow("maxSize must be an integer");
  });
});
