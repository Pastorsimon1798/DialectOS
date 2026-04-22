import { readFileSync } from "node:fs";
import { test } from "node:test";
import assert from "node:assert/strict";

const html = readFileSync(new URL("../index.html", import.meta.url), "utf8");
const engine = readFileSync(new URL("../dialectos-engine.js", import.meta.url), "utf8");

test("static docs demo is honestly labeled as a rule explorer", () => {
  assert.match(html, /Dialect Rule Explorer/);
  assert.match(html, /not a full AI translation service/i);
  assert.match(html, /For certified translation/i);
});

test("static docs demo never claims unchanged text is already compatible", () => {
  assert.doesNotMatch(html, /already compatible/);
  assert.match(html, /No rule-based substitutions fired/);
});

test("static docs engine has common three-word regional terms", () => {
  assert.match(engine, /\baguacate\b/);
  assert.match(engine, /\bpalta\b/);
  assert.match(engine, /\bguagua\b/);
  assert.match(engine, /\bbus\b/);
});
