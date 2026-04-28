import { describe, expect, it, beforeEach, afterEach } from "vitest";
import * as fs from "node:fs";
import * as path from "node:path";
import { executeGlossaryDiff } from "../commands/glossary-diff.js";

describe("executeGlossaryDiff", () => {
  const tmpDir = path.join(process.cwd(), "test-glossary-diff");
  const beforePath = path.join(tmpDir, "before.json");
  const afterPath = path.join(tmpDir, "after.json");

  beforeEach(() => {
    fs.mkdirSync(tmpDir, { recursive: true });
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it("reports added entries", async () => {
    fs.writeFileSync(beforePath, JSON.stringify({ button: "botón" }));
    fs.writeFileSync(afterPath, JSON.stringify({ button: "botón", file: "archivo" }));

    await executeGlossaryDiff(beforePath, afterPath);
    // Should not throw
  });

  it("reports removed entries", async () => {
    fs.writeFileSync(beforePath, JSON.stringify({ button: "botón", file: "archivo" }));
    fs.writeFileSync(afterPath, JSON.stringify({ button: "botón" }));

    await executeGlossaryDiff(beforePath, afterPath);
  });

  it("reports changed entries", async () => {
    fs.writeFileSync(beforePath, JSON.stringify({ button: "boton" }));
    fs.writeFileSync(afterPath, JSON.stringify({ button: "botón" }));

    await executeGlossaryDiff(beforePath, afterPath);
  });

  it("reports no changes for identical files", async () => {
    const data = JSON.stringify({ button: "botón" });
    fs.writeFileSync(beforePath, data);
    fs.writeFileSync(afterPath, data);

    await executeGlossaryDiff(beforePath, afterPath);
  });

  it("handles empty glossaries", async () => {
    fs.writeFileSync(beforePath, JSON.stringify({}));
    fs.writeFileSync(afterPath, JSON.stringify({}));

    await executeGlossaryDiff(beforePath, afterPath);
  });
});
