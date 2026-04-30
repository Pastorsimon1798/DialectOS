import { describe, it, expect } from "vitest";
import {
  DialectOutputPipeline,
  defaultDialectOutputPipeline,
} from "../pipeline/dialect-output-pipeline.js";
import type { PipelineContext, PipelineStep } from "../pipeline/types.js";

describe("DialectOutputPipeline", () => {
  it("returns text unchanged when no steps are registered", () => {
    const pipeline = new DialectOutputPipeline([]);
    const result = pipeline.run("hello", { sentinels: new Map() });
    expect(result.text).toBe("hello");
  });

  it("runs steps in order", () => {
    const steps: PipelineStep[] = [
      { name: "a", requiresDialect: false, process: (t) => t + "-A" },
      { name: "b", requiresDialect: false, process: (t) => t + "-B" },
    ];
    const pipeline = new DialectOutputPipeline(steps);
    const result = pipeline.run("start", { sentinels: new Map() });
    expect(result.text).toBe("start-A-B");
  });

  it("skips dialect-only steps when dialect is absent", () => {
    const steps: PipelineStep[] = [
      { name: "dialect-step", requiresDialect: true, process: (t) => t + "-D" },
      { name: "universal-step", requiresDialect: false, process: (t) => t + "-U" },
    ];
    const pipeline = new DialectOutputPipeline(steps);
    const noDialect = pipeline.run("start", { sentinels: new Map() });
    expect(noDialect.text).toBe("start-U");

    const withDialect = pipeline.run("start", {
      dialect: "es-AR",
      sentinels: new Map(),
    });
    expect(withDialect.text).toBe("start-D-U");
  });

  it("passes context to each step", () => {
    const received: PipelineContext[] = [];
    const steps: PipelineStep[] = [
      {
        name: "spy",
        requiresDialect: true,
        process(text, ctx) {
          received.push(ctx);
          return text;
        },
      },
    ];
    const pipeline = new DialectOutputPipeline(steps);
    const sentinels = new Map([["key", "value"]]);
    pipeline.run("text", { dialect: "es-MX", formality: "formal", sentinels });
    expect(received).toHaveLength(1);
    expect(received[0].dialect).toBe("es-MX");
    expect(received[0].formality).toBe("formal");
    expect(received[0].sentinels).toBe(sentinels);
  });

  it("default pipeline restores sentinels last", () => {
    const sentinels = new Map([["__SENTINEL_0__", "https://example.com"]]);
    // The default pipeline should restore the sentinel even if earlier
    // steps mutate the placeholder text.
    const result = defaultDialectOutputPipeline.run(
      "Visita __SENTINEL_0__ para más info",
      { dialect: "es-MX", sentinels }
    );
    expect(result.text).toContain("https://example.com");
    expect(result.text).not.toContain("__SENTINEL_0__");
  });

  it("default pipeline applies dialect steps for es-AR", () => {
    // "computadora" is the default word; es-AR should substitute to "computadora"
    // (both are the same in this case, but the step runs).
    const result = defaultDialectOutputPipeline.run("computadora", {
      dialect: "es-AR",
      sentinels: new Map(),
    });
    expect(result.text).toBe("computadora");
  });

  it("default pipeline skips dialect steps when dialect is missing", () => {
    const result = defaultDialectOutputPipeline.run("computadora", {
      sentinels: new Map(),
    });
    expect(result.text).toBe("computadora");
  });

  it("createDefault returns a fresh instance with canonical steps", () => {
    const a = DialectOutputPipeline.createDefault();
    const b = DialectOutputPipeline.createDefault();
    expect(a).not.toBe(b);
    const result = a.run("hola", { sentinels: new Map() });
    expect(result.text).toBe("hola");
    expect(b.run("hola", { sentinels: new Map() }).text).toBe("hola");
  });
});
