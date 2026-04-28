/**
 * @dialectos/providers
 *
 * Translation providers with strategy pattern, circuit breaker, and retry logic
 */

// Core types
export * from "./types.js";

// Circuit breaker and retry
export { CircuitBreaker } from "./circuit-breaker.js";
export { RetryPolicy } from "./retry.js";
export { ProviderRegistry } from "./registry.js";

// Translation memory and caching
export { TranslationMemory } from "./translation-memory.js";
export type { CachedTranslation, TranslationMemoryOptions } from "./translation-memory.js";
export { CachedProvider } from "./cached-provider.js";

// Providers
export { DeepLProvider } from "./providers/deepl.js";
export { LibreTranslateProvider } from "./providers/libre-translate.js";
export { MyMemoryProvider } from "./providers/my-memory.js";
export { LLMProvider } from "./providers/llm.js";

// Translation corpus
export { TranslationCorpus } from "./translation-corpus.js";
export type { TranslationCorpusOptions } from "./translation-corpus.js";
export type { CorpusEntry, CorrectionEntry, CorpusStats } from "./corpus-types.js";

// Chaos testing
export { ChaosProvider } from "./chaos-provider.js";
export type { ChaosScenario, ChaosMode } from "./chaos-provider.js";
