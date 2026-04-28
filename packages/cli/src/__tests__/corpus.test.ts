import { describe, expect, it, beforeEach, afterEach } from "vitest";
import * as fs from "node:fs";
import * as path from "node:path";
import * as os from "node:os";
import { TranslationCorpus } from "@dialectos/providers";
import { executeCorpusStats, executeCorpusExport } from "../commands/corpus.js";

describe("corpus CLI commands", () => {
  let tmpDir: string;
  const origEnv = process.env.DIALECTOS_CORPUS_DIR;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "dialectos-corpus-cli-"));
    process.env.DIALECTOS_CORPUS_DIR = tmpDir;
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
    if (origEnv) {
      process.env.DIALECTOS_CORPUS_DIR = origEnv;
    } else {
      delete process.env.DIALECTOS_CORPUS_DIR;
    }
  });

  it("executeCorpusStats reports empty corpus", async () => {
    await executeCorpusStats();
    // Should not throw — just outputs to stdout
  });

  it("executeCorpusStats reports entries", async () => {
    const corpus = new TranslationCorpus({ corpusDir: tmpDir });
    await corpus.append({
      source: "Hello",
      translated: "Hola",
      dialect: "es-MX",
      qualityScore: 90,
      timestamp: new Date().toISOString(),
      accepted: true,
    });

    await executeCorpusStats();
    // Should not throw — outputs stats to stdout
  });

  it("executeCorpusExport writes JSONL file", async () => {
    const corpus = new TranslationCorpus({ corpusDir: tmpDir });
    await corpus.append({
      source: "Hello",
      translated: "Hola",
      dialect: "es-MX",
      qualityScore: 90,
      timestamp: new Date().toISOString(),
      accepted: true,
    });

    const outputPath = path.join(process.cwd(), "test-export.jsonl");
    try {
      await executeCorpusExport({ output: outputPath });

      const content = fs.readFileSync(outputPath, "utf-8");
      expect(content).toContain("Hello");
      expect(content).toContain("Hola");
    } finally {
      try { fs.unlinkSync(outputPath); } catch { /* ignore */ }
    }
  });

  it("executeCorpusExport filters by dialect", async () => {
    const corpus = new TranslationCorpus({ corpusDir: tmpDir });
    await corpus.append({
      source: "Hello",
      translated: "Hola",
      dialect: "es-MX",
      qualityScore: 90,
      timestamp: new Date().toISOString(),
      accepted: true,
    });
    await corpus.append({
      source: "Goodbye",
      translated: "Chau",
      dialect: "es-AR",
      qualityScore: 85,
      timestamp: new Date().toISOString(),
      accepted: true,
    });

    const outputPath = path.join(process.cwd(), "test-export-mx.jsonl");
    try {
      await executeCorpusExport({ dialect: "es-MX", output: outputPath });

      const content = fs.readFileSync(outputPath, "utf-8");
      expect(content).toContain("Hello");
      expect(content).not.toContain("Goodbye");
    } finally {
      try { fs.unlinkSync(outputPath); } catch { /* ignore */ }
    }
  });
});
