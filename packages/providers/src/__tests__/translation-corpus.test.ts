import { describe, expect, it, beforeEach, afterEach } from "vitest";
import * as fs from "node:fs";
import * as path from "node:path";
import * as os from "node:os";
import { TranslationCorpus } from "../translation-corpus.js";
import type { CorpusEntry, CorrectionEntry } from "../corpus-types.js";

describe("TranslationCorpus", () => {
  let tmpDir: string;
  let corpus: TranslationCorpus;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "dialectos-corpus-test-"));
    corpus = new TranslationCorpus({ corpusDir: tmpDir });
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  const sampleEntry: CorpusEntry = {
    source: "Hello world",
    translated: "Hola mundo",
    dialect: "es-MX",
    qualityScore: 85,
    timestamp: new Date().toISOString(),
    accepted: true,
  };

  const sampleCorrection: CorrectionEntry = {
    source: "Pick up the package",
    original: "Recoge el paquete",
    corrected: "Recoge el paquete",
    dialect: "es-PR",
    timestamp: new Date().toISOString(),
  };

  it("appends and reads entries by dialect", async () => {
    await corpus.append(sampleEntry);
    const entries = await corpus.getEntries("es-MX");

    expect(entries).toHaveLength(1);
    expect(entries[0].source).toBe("Hello world");
    expect(entries[0].translated).toBe("Hola mundo");
    expect(entries[0].dialect).toBe("es-MX");
  });

  it("appends multiple entries to same dialect", async () => {
    await corpus.append(sampleEntry);
    await corpus.append({ ...sampleEntry, source: "Goodbye", translated: "Adiós" });

    const entries = await corpus.getEntries("es-MX");
    expect(entries).toHaveLength(2);
  });

  it("separates entries by dialect", async () => {
    await corpus.append(sampleEntry);
    await corpus.append({ ...sampleEntry, dialect: "es-AR" });

    const mx = await corpus.getEntries("es-MX");
    const ar = await corpus.getEntries("es-AR");

    expect(mx).toHaveLength(1);
    expect(ar).toHaveLength(1);
  });

  it("returns empty array for dialect with no entries", async () => {
    const entries = await corpus.getEntries("es-ES");
    expect(entries).toEqual([]);
  });

  it("appends and reads corrections", async () => {
    await corpus.appendCorrection(sampleCorrection);
    const corrections = await corpus.getCorrections();

    expect(corrections).toHaveLength(1);
    expect(corrections[0].source).toBe("Pick up the package");
    expect(corrections[0].dialect).toBe("es-PR");
  });

  it("returns empty corrections when none exist", async () => {
    const corrections = await corpus.getCorrections();
    expect(corrections).toEqual([]);
  });

  it("computes stats across dialects", async () => {
    await corpus.append(sampleEntry);
    await corpus.append({ ...sampleEntry, dialect: "es-AR", qualityScore: 60 });
    await corpus.append({ ...sampleEntry, dialect: "es-AR", qualityScore: 30 });
    await corpus.appendCorrection(sampleCorrection);

    const stats = await corpus.getStats();

    expect(stats.totalEntries).toBe(3);
    expect(stats.totalCorrections).toBe(1);
    expect(stats.byDialect["es-MX"]).toBe(1);
    expect(stats.byDialect["es-AR"]).toBe(2);
    expect(stats.qualityDistribution.high).toBe(1);
    expect(stats.qualityDistribution.medium).toBe(1);
    expect(stats.qualityDistribution.low).toBe(1);
  });

  it("returns zero stats when corpus is empty", async () => {
    const stats = await corpus.getStats();

    expect(stats.totalEntries).toBe(0);
    expect(stats.totalCorrections).toBe(0);
    expect(Object.keys(stats.byDialect)).toHaveLength(0);
  });

  it("exports corpus for a specific dialect", async () => {
    await corpus.append(sampleEntry);
    await corpus.append({ ...sampleEntry, dialect: "es-AR" });

    const outputPath = path.join(tmpDir, "export.jsonl");
    await corpus.exportCorpus(outputPath, "es-MX");

    const content = fs.readFileSync(outputPath, "utf-8");
    const lines = content.trim().split("\n");
    expect(lines).toHaveLength(1);
    expect(JSON.parse(lines[0]).dialect).toBe("es-MX");
  });

  it("exports entire corpus when no dialect specified", async () => {
    await corpus.append(sampleEntry);
    await corpus.append({ ...sampleEntry, dialect: "es-AR" });

    const outputPath = path.join(tmpDir, "export-all.jsonl");
    await corpus.exportCorpus(outputPath);

    const content = fs.readFileSync(outputPath, "utf-8");
    const lines = content.trim().split("\n");
    expect(lines).toHaveLength(2);
  });

  it("respects limit on getEntries", async () => {
    for (let i = 0; i < 5; i++) {
      await corpus.append({ ...sampleEntry, source: `Entry ${i}` });
    }

    const entries = await corpus.getEntries("es-MX", 2);
    expect(entries).toHaveLength(2);
    // Returns the most recent entries (last N)
    expect(entries[0].source).toBe("Entry 3");
    expect(entries[1].source).toBe("Entry 4");
  });

  it("rejects path traversal in corpus dir", () => {
    expect(() => new TranslationCorpus({ corpusDir: "/tmp/../etc" })).toThrow();
  });

  it("rejects path traversal in export path", async () => {
    await expect(
      corpus.exportCorpus("../etc/passwd")
    ).rejects.toThrow();
  });

  it("handles concurrent appends to same dialect", async () => {
    const promises = [];
    for (let i = 0; i < 10; i++) {
      promises.push(corpus.append({ ...sampleEntry, source: `Concurrent ${i}` }));
    }
    await Promise.all(promises);

    const entries = await corpus.getEntries("es-MX");
    expect(entries).toHaveLength(10);
  });

  it("persists data across instances", async () => {
    await corpus.append(sampleEntry);

    const corpus2 = new TranslationCorpus({ corpusDir: tmpDir });
    const entries = await corpus2.getEntries("es-MX");

    expect(entries).toHaveLength(1);
    expect(entries[0].source).toBe("Hello world");
  });
});
