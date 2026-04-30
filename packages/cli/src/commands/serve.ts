/**
 * serve command — Start the DialectOS demo HTTP server
 */

import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";
import * as path from "node:path";
import { writeInfo, writeError } from "../lib/output.js";

export interface ServeOptions {
  port?: number;
  host?: string;
}

export async function executeServe(options: ServeOptions = {}): Promise<void> {
  const port = options.port ?? 8080;
  const host = options.host ?? "127.0.0.1";

  // Resolve the demo server script path relative to this package
  const __dirname = path.dirname(fileURLToPath(import.meta.url));
  const projectRoot = path.resolve(__dirname, "../../../../");
  const demoServerPath = path.join(projectRoot, "scripts", "demo-server.mjs");

  writeInfo(`Starting DialectOS demo server on ${host}:${port}...`);
  writeInfo(`Demo server: ${demoServerPath}`);

  const child = spawn(
    process.execPath,
    [demoServerPath],
    {
      stdio: "inherit",
      env: {
        ...process.env,
        DIALECTOS_DEMO_PORT: String(port),
        DIALECTOS_DEMO_HOST: host,
      },
    }
  );

  return new Promise((resolve, reject) => {
    child.on("error", (err) => {
      writeError(`Failed to start demo server: ${err.message}`);
      reject(err);
    });

    child.on("exit", (code) => {
      if (code === 0 || code === null) {
        resolve();
      } else {
        writeError(`Demo server exited with code ${code}`);
        reject(new Error(`Demo server exited with code ${code}`));
      }
    });
  });
}
