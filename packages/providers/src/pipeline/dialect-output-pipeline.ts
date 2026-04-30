import type { PipelineContext, PipelineStep } from "./types.js";
import {
  lexicalSubstitutionStep,
  untranslatedWordsStep,
  voseoStep,
  agreementStep,
  punctuationStep,
  accentuationStep,
  capitalizationStep,
  typographyStep,
  sentinelRestoreStep,
} from "./steps.js";

export type { PipelineContext, PipelineStep } from "./types.js";

/**
 * Result of a pipeline run. Currently just the final text, but structured
 * so we can add per-step metadata (timing, diagnostics) later without
 * breaking callers.
 */
export interface PipelineRunResult {
  text: string;
}

const DEFAULT_STEPS: readonly PipelineStep[] = [
  lexicalSubstitutionStep,
  untranslatedWordsStep,
  voseoStep,
  agreementStep,
  punctuationStep,
  accentuationStep,
  capitalizationStep,
  typographyStep,
  sentinelRestoreStep,
];

/**
 * Deep module: owns the ordering and conditional execution of all
 * post-processing steps that turn raw LLM output into polished dialect text.
 *
 * The pipeline is stateless and pure — the same inputs always produce the
 * same outputs. This makes it trivial to test, mock, and extend.
 */
export class DialectOutputPipeline {
  constructor(private readonly steps: readonly PipelineStep[] = DEFAULT_STEPS) {}

  /**
   * Run the full post-processing sequence on the given text.
   * Steps that declare `requiresDialect: true` are skipped when
   * `context.dialect` is missing.
   */
  run(text: string, context: PipelineContext): PipelineRunResult {
    let result = text;
    for (const step of this.steps) {
      if (step.requiresDialect && !context.dialect) continue;
      result = step.process(result, context);
    }
    return { text: result };
  }

  /** Factory for the canonical step ordering used by LLMProvider. */
  static createDefault(): DialectOutputPipeline {
    return new DialectOutputPipeline(DEFAULT_STEPS);
  }
}

/** Shared default instance — safe because the pipeline is stateless. */
export const defaultDialectOutputPipeline = DialectOutputPipeline.createDefault();
