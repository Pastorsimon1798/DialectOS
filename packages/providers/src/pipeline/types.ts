import type { SpanishDialect } from "@dialectos/types";

/**
 * Context passed through every step of the dialect output pipeline.
 */
export interface PipelineContext {
  /** Target Spanish dialect (e.g. "es-AR", "es-MX"). */
  dialect?: SpanishDialect;
  /** Register hint for voseo adaptation. */
  formality?: string;
  /** Sentinel map produced by extractSentinels and consumed by restoreSentinels. */
  sentinels: Map<string, string>;
}

/**
 * A single post-processing step in the dialect output pipeline.
 */
export interface PipelineStep {
  /** Human-readable identifier for observability and debugging. */
  readonly name: string;
  /** When true, the step is skipped if no dialect is set in the context. */
  readonly requiresDialect: boolean;
  /** Transform the text. Must be pure (no side effects). */
  process(text: string, context: PipelineContext): string;
}
