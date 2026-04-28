import * as fs from "node:fs";
import * as path from "node:path";
import * as os from "node:os";
import { SecurityError, ErrorCode, createSecureTempPath } from "@dialectos/security";
import type { SpanishDialect } from "@dialectos/types";
import type { CorpusEntry, CorrectionEntry, CorpusStats } from "./corpus-types.js";

export interface TranslationCorpusOptions {
  corpusDir?: string;
}

const DEFAULT_DIR = path.join(os.homedir(), ".cache", "dialectos", "corpus");

export class TranslationCorpus {
  private readonly corpusDir: string;

  constructor(options: TranslationCorpusOptions = {}) {
    this.corpusDir = this.resolveDir(options.corpusDir);
  }

  private resolveDir(override?: string): string {
    const dir = override ?? process.env.DIALECTOS_CORPUS_DIR;
    if (dir) {
      if (dir.includes("..")) {
        throw new SecurityError(
          "Corpus directory cannot contain path traversal sequences",
          ErrorCode.PATH_TRAVERSAL
        );
      }
      if (dir.includes("\x00")) {
        throw new SecurityError(
          "Corpus directory cannot contain null bytes",
          ErrorCode.INVALID_INPUT
        );
      }
      return path.resolve(dir);
    }
    return DEFAULT_DIR;
  }

  private dialectPath(dialect: SpanishDialect): string {
    return path.join(this.corpusDir, `${dialect}.jsonl`);
  }

  private correctionsPath(): string {
    return path.join(this.corpusDir, "corrections.jsonl");
  }

  private async ensureDir(): Promise<void> {
    await fs.promises.mkdir(this.corpusDir, { recursive: true });
  }

  private async atomicAppend(filePath: string, line: string): Promise<void> {
    await this.ensureDir();
    const tempPath = createSecureTempPath(filePath);
    try {
      await fs.promises.appendFile(filePath, line + "\n", "utf-8");
    } catch {
      // File may not exist yet — write via temp for atomicity
      await fs.promises.writeFile(tempPath, line + "\n", "utf-8");
      await fs.promises.rename(tempPath, filePath);
    }
  }

  async append(entry: CorpusEntry): Promise<void> {
    const filePath = this.dialectPath(entry.dialect);
    const line = JSON.stringify(entry);
    await this.atomicAppend(filePath, line);
  }

  async appendCorrection(entry: CorrectionEntry): Promise<void> {
    const filePath = this.correctionsPath();
    const line = JSON.stringify(entry);
    await this.atomicAppend(filePath, line);
  }

  async getEntries(dialect: SpanishDialect, limit?: number): Promise<CorpusEntry[]> {
    const filePath = this.dialectPath(dialect);
    return this.readJsonl<CorpusEntry>(filePath, limit);
  }

  async getCorrections(limit?: number): Promise<CorrectionEntry[]> {
    const filePath = this.correctionsPath();
    return this.readJsonl<CorrectionEntry>(filePath, limit);
  }

  private async readJsonl<T>(filePath: string, limit?: number): Promise<T[]> {
    try {
      const raw = await fs.promises.readFile(filePath, "utf-8");
      const lines = raw.split("\n").filter((l) => l.trim());
      const items = lines.map((l) => JSON.parse(l) as T);
      return limit ? items.slice(-limit) : items;
    } catch {
      return [];
    }
  }

  async getStats(): Promise<CorpusStats> {
    const byDialect: Record<string, number> = {};
    let totalEntries = 0;
    const qualityDistribution = { high: 0, medium: 0, low: 0 };

    try {
      const files = await fs.promises.readdir(this.corpusDir);
      for (const file of files) {
        if (!file.endsWith(".jsonl") || file === "corrections.jsonl") continue;
        const dialect = file.replace(".jsonl", "") as SpanishDialect;
        const entries = await this.getEntries(dialect);
        byDialect[dialect] = entries.length;
        totalEntries += entries.length;
        for (const entry of entries) {
          if (entry.qualityScore >= 80) qualityDistribution.high++;
          else if (entry.qualityScore >= 50) qualityDistribution.medium++;
          else qualityDistribution.low++;
        }
      }
    } catch {
      // Directory may not exist yet
    }

    let totalCorrections = 0;
    try {
      const corrections = await this.getCorrections();
      totalCorrections = corrections.length;
    } catch {
      // Ignore
    }

    return { totalEntries, totalCorrections, byDialect, qualityDistribution };
  }

  async exportCorpus(outputPath: string, dialect?: SpanishDialect): Promise<void> {
    const resolved = path.resolve(outputPath);
    if (resolved.includes("..")) {
      throw new SecurityError(
        "Output path cannot contain path traversal sequences",
        ErrorCode.PATH_TRAVERSAL
      );
    }

    if (dialect) {
      const entries = await this.getEntries(dialect);
      const lines = entries.map((e) => JSON.stringify(e)).join("\n") + "\n";
      await fs.promises.writeFile(resolved, lines, "utf-8");
    } else {
      const allEntries: CorpusEntry[] = [];
      try {
        const files = await fs.promises.readdir(this.corpusDir);
        for (const file of files) {
          if (!file.endsWith(".jsonl") || file === "corrections.jsonl") continue;
          const d = file.replace(".jsonl", "") as SpanishDialect;
          const entries = await this.getEntries(d);
          allEntries.push(...entries);
        }
      } catch {
        // empty
      }
      const lines = allEntries.map((e) => JSON.stringify(e)).join("\n") + "\n";
      await fs.promises.writeFile(resolved, lines, "utf-8");
    }
  }
}
