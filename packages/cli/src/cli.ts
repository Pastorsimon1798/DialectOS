#!/usr/bin/env node
/**
 * @dialectos/cli
 *
 * Spanish translation CLI — binary entry point
 */

import { program } from "./index.js";
import { SecurityError, createSafeError } from "@dialectos/security";
import { writeError } from "./lib/output.js";

// Parse arguments
program.parseAsync(process.argv).catch((error: unknown) => {
  if (error instanceof SecurityError) {
    const safeError = createSafeError(error);
    writeError(`Security Error [${safeError.code}]: ${safeError.error}`);
  } else {
    const safeError = createSafeError(error instanceof Error ? error : new Error(String(error)));
    writeError(safeError.error);
  }
  process.exit(1);
});
