/**
 * Output utilities for the CLI
 * Handles writing to stdout and files
 */

import * as fs from "node:fs";
import * as path from "node:path";
import * as crypto from "node:crypto";
import { validateFilePath, sanitizeErrorMessage } from "@dialectos/security";

/**
 * Create a secure temporary file path in the same directory as the target
 */
function createSecureTempPath(targetPath: string): string {
  const dir = path.dirname(targetPath);
  const ext = path.extname(targetPath);
  const basename = path.basename(targetPath, ext);
  const randomSuffix = crypto.randomBytes(8).toString("hex");
  return path.join(dir, `${basename}_${randomSuffix}${ext}`);
}

/**
 * Write output to stdout or file (atomic write for files)
 * @param output - The output content
 * @param filePath - Optional file path. If not provided, writes to stdout
 */
export async function writeOutput(
  output: string,
  filePath?: string
): Promise<void> {
  if (filePath) {
    // Validate and resolve file path
    const validatedPath = validateFilePath(filePath);

    // Atomic write: temp file + rename to prevent partial writes
    const tempPath = createSecureTempPath(validatedPath);
    try {
      await fs.promises.writeFile(tempPath, output, { encoding: "utf-8", flag: "wx" });
      // On Windows, rename cannot overwrite existing files. Handle EEXIST.
      try {
        await fs.promises.rename(tempPath, validatedPath);
      } catch (renameError) {
        const code = (renameError as NodeJS.ErrnoException).code;
        if (code === "EEXIST") {
          await fs.promises.unlink(validatedPath);
          await fs.promises.rename(tempPath, validatedPath);
        } else {
          throw renameError;
        }
      }
    } catch (error) {
      // Clean up temp file on error
      try {
        await fs.promises.unlink(tempPath);
      } catch {
        // Ignore cleanup errors
      }
      throw error;
    }
  } else {
    // Write to stdout
    process.stdout.write(output);
  }
}

/**
 * Strip ANSI escape sequences and terminal control characters
 * to prevent injection when logging untrusted content.
 */
export function sanitizeConsoleOutput(message: string): string {
  // Remove ANSI escape sequences
  let sanitized = message.replace(/\x1b\[[0-9;]*[a-zA-Z]/g, "");
  // Remove other control characters (keep tab, newline, carriage return)
  sanitized = sanitized.replace(/[\x00-\x08\x0b\x0c\x0e-\x1f\x7f]/g, "");
  return sanitized;
}

/**
 * Known error patterns and actionable hints for users.
 */
const ERROR_HINTS: Array<{ pattern: RegExp; hint: string }> = [
  {
    pattern: /No provider configured|No translation providers|Provider not available/i,
    hint: "\n  → Set LLM_API_URL and LLM_MODEL in your .env file, or run with a local model.\n    See .env.example for all options.",
  },
  {
    pattern: /LLM_API_URL|LLM_MODEL|api key|api_key|authorization/i,
    hint: "\n  → Check your .env file has LLM_API_URL, LLM_MODEL, and LLM_API_KEY (if required).\n    Copy .env.example to .env and fill in your values.",
  },
  {
    pattern: /rate limit|too many requests|429/i,
    hint: "\n  → Rate limit hit. Wait a moment or reduce concurrency with --concurrency.",
  },
  {
    pattern: /network|timeout|fetch failed|ENOTFOUND|ECONNREFUSED/i,
    hint: "\n  → Network error. Check your internet connection and LLM_API_URL reachability.",
  },
  {
    pattern: /dialect.*not.*valid|invalid.*dialect/i,
    hint: "\n  → Run 'dialectos dialects list' to see all 25 supported dialect codes.",
  },
  {
    pattern: /file.*not.*found|ENOENT/i,
    hint: "\n  → Check the file path exists and is readable.",
  },
];

function getActionableHint(message: string): string {
  for (const { pattern, hint } of ERROR_HINTS) {
    if (pattern.test(message)) return hint;
  }
  return "";
}

/**
 * Write error message to stderr with actionable hints
 * @param message - The error message
 */
export function writeError(message: string): void {
  const sanitized = sanitizeConsoleOutput(sanitizeErrorMessage(message));
  const hint = getActionableHint(sanitized);
  process.stderr.write(`Error: ${sanitized}${hint}\n`);
}

/**
 * Write info message to stdout (for non-error status messages)
 * @param message - The info message
 */
export function writeInfo(message: string): void {
  process.stdout.write(`${sanitizeConsoleOutput(message)}\n`);
}
