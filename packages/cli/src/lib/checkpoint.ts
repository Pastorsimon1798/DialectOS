import { promises as fs } from "node:fs";
import { createHash } from "node:crypto";

export interface TranslationCheckpoint {
  sourcePath: string;
  sourceHash?: string;
  totalSections: number;
  translatedByIndex: Record<number, string>;
}

export async function loadCheckpoint(path: string): Promise<TranslationCheckpoint | null> {
  try {
    const raw = await fs.readFile(path, "utf-8");
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object" || !parsed.sourcePath) {
      return null;
    }
    return parsed as TranslationCheckpoint;
  } catch {
    return null;
  }
}

export async function saveCheckpoint(path: string, data: TranslationCheckpoint): Promise<void> {
  await fs.writeFile(path, JSON.stringify(data, null, 2), "utf-8");
}

export function hashSource(content: string): string {
  return createHash("sha256").update(content).digest("hex");
}
