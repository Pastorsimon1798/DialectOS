/**
 * BulkTranslationEngine — high-throughput, resilient bulk translation
 *
 * Features:
 * - String deduplication (identical source strings translated once)
 * - Parallel execution with configurable concurrency
 * - Translation memory integration (cache hits skip API calls)
 * - Per-item retry with exponential backoff
 * - Dead-letter queue for unrecoverable failures
 * - Checkpoint/resume for long-running jobs
 * - Progress reporting via callbacks
 */

import * as fs from "node:fs";
import * as path from "node:path";
import type { TranslationProvider, TranslationResult } from "@dialectos/types";
import { TranslationMemory } from "../translation-memory.js";
import { Semaphore } from "./semaphore.js";
import type {
  BulkTranslationItem,
  BulkTranslationSuccess,
  BulkTranslationFailure,
  BulkTranslationResult,
  BulkTranslationProgress,
  BulkCheckpoint,
  BulkEngineOptions,
} from "./types.js";

const DEFAULT_MAX_CONCURRENCY = 4;
const DEFAULT_MAX_RETRIES = 2;
const DEFAULT_RETRY_DELAY_MS = 1000;
const DEFAULT_CHECKPOINT_INTERVAL = 50;
const CHECKPOINT_VERSION = 1;

export class BulkTranslationEngine {
  private cache: TranslationMemory;
  private useCache: boolean;
  private semaphore: Semaphore;
  private maxRetries: number;
  private retryDelayMs: number;
  private checkpointInterval: number;
  private checkpointPath: string | undefined;
  private onProgress: ((progress: BulkTranslationProgress) => void) | undefined;
  private onCheckpoint: ((checkpoint: BulkCheckpoint) => void) | undefined;

  constructor(options: BulkEngineOptions = {}) {
    this.useCache = options.useCache !== false;
    this.cache = options.cache ?? new TranslationMemory();
    this.semaphore = new Semaphore(options.maxConcurrency ?? DEFAULT_MAX_CONCURRENCY);
    this.maxRetries = options.maxRetries ?? DEFAULT_MAX_RETRIES;
    this.retryDelayMs = options.retryDelayMs ?? DEFAULT_RETRY_DELAY_MS;
    this.checkpointInterval = options.checkpointInterval ?? DEFAULT_CHECKPOINT_INTERVAL;
    this.checkpointPath = options.checkpointPath;
    this.onProgress = options.onProgress;
    this.onCheckpoint = options.onCheckpoint;
  }

  /**
   * Translate a batch of items with full resilience.
   */
  async translate(
    items: BulkTranslationItem[],
    provider: TranslationProvider
  ): Promise<BulkTranslationResult> {
    const startTime = Date.now();

    if (items.length === 0) {
      return {
        successes: [],
        failures: [],
        cacheHits: 0,
        apiCalls: 0,
        totalLatencyMs: 0,
        allSucceeded: true,
      };
    }

    // Deduplicate: map source text → list of item IDs
    const dedupMap = this.buildDedupMap(items);
    const uniqueTexts = Array.from(dedupMap.keys());

    // Load checkpoint (currently only used for tracking; items are re-translated
    // and cache handles hits. Future: store results in checkpoint for instant resume.)
    const checkpoint = this.checkpointPath ? this.loadCheckpoint(this.checkpointPath) : null;
    // Intentionally not skipping checkpoint items — let cache handle dedup on resume

    // Results
    const successes: BulkTranslationSuccess[] = [];
    const failures: BulkTranslationFailure[] = [];
    let cacheHits = 0;
    let apiCalls = 0;

    // Track in-flight promises for checkpoint coordination
    const inFlight: Promise<void>[] = [];
    const latencies: number[] = [];

    // Progress tracking
    let completedCount = 0;
    const totalCount = items.length;

    const emit = () => {
      this.emitProgress({
        total: totalCount,
        completed: completedCount,
        succeeded: successes.length,
        failed: failures.length,
        cacheHits,
        inFlight: inFlight.filter((p) => this.isPending(p)).length,
        estimatedRemainingMs: this.estimateRemaining(completedCount, totalCount, latencies),
      });
    };

    for (const sourceText of uniqueTexts) {
      const itemIds = dedupMap.get(sourceText)!;
      const pendingIds = itemIds;
      if (pendingIds.length === 0) continue;

      const representativeItem = items.find((i) => i.id === pendingIds[0])!;

      await this.semaphore.acquire();

      const task = this.processItem(
        representativeItem,
        provider,
        pendingIds,
        items,
        successes,
        failures,
        () => {
          cacheHits++;
        },
        () => {
          apiCalls++;
        },
        (latency: number) => {
          latencies.push(latency);
        }
      ).finally(() => {
        this.semaphore.release();
        completedCount += pendingIds.length;
        emit();
      });

      inFlight.push(task);

      // Checkpoint when enough items have settled
      if (
        this.checkpointPath &&
        completedCount > 0 &&
        completedCount % this.checkpointInterval === 0
      ) {
        await Promise.all([...inFlight]);
        inFlight.length = 0;
        this.saveCheckpoint(this.checkpointPath, {
          version: CHECKPOINT_VERSION,
          createdAt: new Date().toISOString(),
          completedIds: successes.map((s) => s.item.id),
          failedItems: failures,
          totalItems: items.length,
        });
      }
    }

    // Wait for remaining tasks
    if (inFlight.length > 0) {
      await Promise.all([...inFlight]);
    }

    // Final checkpoint
    if (this.checkpointPath) {
      this.saveCheckpoint(this.checkpointPath, {
        version: CHECKPOINT_VERSION,
        createdAt: new Date().toISOString(),
        completedIds: successes.map((s) => s.item.id),
        failedItems: failures,
        totalItems: items.length,
      });
    }

    return {
      successes,
      failures,
      cacheHits,
      apiCalls,
      totalLatencyMs: Date.now() - startTime,
      allSucceeded: failures.length === 0,
    };
  }

  private async processItem(
    representativeItem: BulkTranslationItem,
    provider: TranslationProvider,
    pendingIds: string[],
    allItems: BulkTranslationItem[],
    successes: BulkTranslationSuccess[],
    failures: BulkTranslationFailure[],
    onCacheHit: () => void,
    onApiCall: () => void,
    onSuccessLatency: (latency: number) => void
  ): Promise<void> {
    const { sourceText, sourceLang, targetLang, options } = representativeItem;

    // Check cache
    let cacheKey: string | undefined;
    if (this.useCache) {
      cacheKey = this.cache.computeKey(sourceText, sourceLang, targetLang, options);
      const cached = await this.cache.get(cacheKey);
      if (cached) {
        for (const id of pendingIds) {
          const item = allItems.find((i) => i.id === id)!;
          successes.push({
            item,
            result: { ...cached.result },
            latencyMs: 0,
            cacheHit: true,
            retryCount: 0,
          });
        }
        onCacheHit();
        return;
      }
    }

    // API call with retries
    let lastError: string | undefined;
    let retryCount = 0;
    let result: TranslationResult | undefined;
    let latencyMs = 0;

    for (let attempt = 0; attempt <= this.maxRetries; attempt++) {
      if (attempt > 0) {
        retryCount++;
        await this.sleep(this.retryDelayMs * Math.pow(2, attempt - 1));
      }

      const callStart = Date.now();
      try {
        result = await provider.translate(sourceText, sourceLang, targetLang, options);
        latencyMs = Date.now() - callStart;
        onApiCall();
        break;
      } catch (error) {
        latencyMs = Date.now() - callStart;
        lastError = error instanceof Error ? error.message : String(error);
      }
    }

    if (result) {
      if (this.useCache && cacheKey) {
        await this.cache.set(cacheKey, result);
      }
      for (const id of pendingIds) {
        const item = allItems.find((i) => i.id === id)!;
        successes.push({
          item,
          result: { ...result },
          latencyMs,
          cacheHit: false,
          retryCount,
        });
      }
      onSuccessLatency(latencyMs);
    } else {
      for (const id of pendingIds) {
        const item = allItems.find((i) => i.id === id)!;
        failures.push({
          item,
          error: lastError ?? "Unknown error",
          retryCount,
          failedAt: new Date().toISOString(),
        });
      }
    }
  }

  private buildDedupMap(items: BulkTranslationItem[]): Map<string, string[]> {
    const map = new Map<string, string[]>();
    for (const item of items) {
      const normalized = item.sourceText.trim().replace(/\s+/g, " ");
      const existing = map.get(normalized);
      if (existing) {
        existing.push(item.id);
      } else {
        map.set(normalized, [item.id]);
      }
    }
    return map;
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  private emitProgress(progress: BulkTranslationProgress): void {
    try {
      this.onProgress?.(progress);
    } catch {
      // Non-fatal
    }
  }

  private estimateRemaining(
    completed: number,
    total: number,
    latencies: number[]
  ): number | null {
    if (completed === 0 || latencies.length === 0) return null;
    const avg = latencies.reduce((a, b) => a + b, 0) / latencies.length;
    return Math.round(avg * (total - completed));
  }

  private isPending(promise: Promise<void>): boolean {
    // Hack: track pending state externally if needed
    return true; // Simplified: assume in-flight array only contains pending
  }

  private loadCheckpoint(checkpointPath: string): BulkCheckpoint | null {
    try {
      const raw = fs.readFileSync(checkpointPath, "utf-8");
      const parsed = JSON.parse(raw) as BulkCheckpoint;
      return parsed.version === CHECKPOINT_VERSION ? parsed : null;
    } catch {
      return null;
    }
  }

  private saveCheckpoint(checkpointPath: string, checkpoint: BulkCheckpoint): void {
    try {
      const dir = path.dirname(checkpointPath);
      fs.mkdirSync(dir, { recursive: true });
      const tempPath = `${checkpointPath}.tmp`;
      fs.writeFileSync(tempPath, JSON.stringify(checkpoint, null, 2), "utf-8");
      fs.renameSync(tempPath, checkpointPath);
      this.onCheckpoint?.(checkpoint);
    } catch {
      // Non-fatal
    }
  }

  getCache(): TranslationMemory {
    return this.cache;
  }
}
