import { execFileSync } from "node:child_process";
import * as path from "node:path";
import * as fs from "node:fs";
import { writeOutput, writeError } from "../lib/output.js";

export async function executeBenchmarkRun(options: {
  provider?: string;
  dialects?: string;
  categories?: string;
  out?: string;
  live?: boolean;
}): Promise<void> {
  const scriptPath = path.resolve(process.cwd(), "scripts/benchmark.mjs");
  if (!fs.existsSync(scriptPath)) {
    throw new Error("Benchmark script not found at scripts/benchmark.mjs");
  }

  const args = ["scripts/benchmark.mjs"];
  if (options.provider) args.push(`--provider=${options.provider}`);
  if (options.dialects) args.push(`--dialects=${options.dialects}`);
  if (options.categories) args.push(`--categories=${options.categories}`);
  if (options.out) args.push(`--out=${options.out}`);
  if (options.live) args.push("--live=true");

  try {
    const output = execFileSync("node", args, {
      cwd: process.cwd(),
      encoding: "utf-8",
      timeout: 300_000,
    });
    writeOutput(output);
  } catch (error: unknown) {
    const execError = error as { stdout?: string; stderr?: string };
    if (execError.stdout) writeOutput(execError.stdout);
    if (execError.stderr) writeError(execError.stderr);
    throw new Error("Benchmark completed with failures");
  }
}

export async function executeBenchmarkReport(options: {
  file: string;
}): Promise<void> {
  const filePath = path.resolve(options.file);
  if (!fs.existsSync(filePath)) {
    throw new Error(`Report file not found: ${filePath}`);
  }

  const data = JSON.parse(fs.readFileSync(filePath, "utf-8"));

  writeOutput(`Benchmark Report: ${data.generatedAt}`);
  writeOutput(`Provider: ${data.provider} (live: ${data.live})`);
  writeOutput(`Total: ${data.total} | Passed: ${data.passed} | Failed: ${data.failed}`);
  writeOutput(
    `Pass rate: ${data.total > 0 ? ((data.passed / data.total) * 100).toFixed(1) : 0}%`
  );
  writeOutput(`Avg quality score: ${data.avgQualityScore}`);

  if (data.byCategory) {
    writeOutput("\nBy Category:");
    for (const [cat, info] of Object.entries(data.byCategory) as [string, { total: number; passed: number }][]) {
      const rate = info.total > 0 ? ((info.passed / info.total) * 100).toFixed(1) : "0.0";
      writeOutput(`  ${cat}: ${info.passed}/${info.total} (${rate}%)`);
    }
  }

  if (data.byDialect) {
    writeOutput("\nBy Dialect:");
    for (const [d, info] of Object.entries(data.byDialect) as [string, { total: number; passed: number }][]) {
      const rate = info.total > 0 ? ((info.passed / info.total) * 100).toFixed(1) : "0.0";
      writeOutput(`  ${d}: ${info.passed}/${info.total} (${rate}%)`);
    }
  }
}
