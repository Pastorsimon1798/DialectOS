import { promises as fs } from "node:fs";
import { writeOutput } from "../lib/output.js";
import { validateFilePath } from "@dialectos/security";

interface GlossaryMapping {
  [key: string]: string;
}

export async function executeGlossaryDiff(before: string, after: string): Promise<void> {
  const beforePath = validateFilePath(before);
  const afterPath = validateFilePath(after);

  const beforeContent = await fs.readFile(beforePath, "utf-8");
  const afterContent = await fs.readFile(afterPath, "utf-8");

  const beforeData = JSON.parse(beforeContent) as GlossaryMapping;
  const afterData = JSON.parse(afterContent) as GlossaryMapping;

  const added: string[] = [];
  const removed: string[] = [];
  const changed: Array<{ key: string; before: string; after: string }> = [];

  for (const key of Object.keys(afterData)) {
    if (!(key in beforeData)) {
      added.push(key);
    } else if (beforeData[key] !== afterData[key]) {
      changed.push({ key, before: beforeData[key], after: afterData[key] });
    }
  }

  for (const key of Object.keys(beforeData)) {
    if (!(key in afterData)) {
      removed.push(key);
    }
  }

  writeOutput(`Glossary diff: ${added.length} added, ${removed.length} removed, ${changed.length} changed`);

  if (added.length > 0) {
    writeOutput("\nAdded:");
    for (const key of added) {
      writeOutput(`  + ${key}: ${afterData[key]}`);
    }
  }

  if (removed.length > 0) {
    writeOutput("\nRemoved:");
    for (const key of removed) {
      writeOutput(`  - ${key}: ${beforeData[key]}`);
    }
  }

  if (changed.length > 0) {
    writeOutput("\nChanged:");
    for (const { key, before: b, after: a } of changed) {
      writeOutput(`  ~ ${key}: ${b} → ${a}`);
    }
  }
}
