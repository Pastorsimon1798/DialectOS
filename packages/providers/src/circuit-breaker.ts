/**
 * Circuit Breaker pattern implementation
 * Prevents cascading failures by temporarily disabling failing services
 */

export type CircuitState = "closed" | "open" | "half-open";

export class CircuitBreaker {
  private state: CircuitState = "closed";
  private failureCount = 0;
  private lastFailureTime?: number;
  private nextAttemptTime?: number;
  private probeLock = false;

  constructor(
    private readonly failureThreshold: number,
    private readonly resetTimeoutMs: number
  ) {}

  /**
   * Check if execution is allowed through the circuit.
   * Only ONE concurrent request is allowed through in half-open state.
   */
  canExecute(): boolean {
    const now = Date.now();

    // If circuit is open, check if we can transition to half-open
    if (this.state === "open") {
      if (this.nextAttemptTime && now >= this.nextAttemptTime) {
        this.state = "half-open";
        this.failureCount = 0;
        this.probeLock = true; // This call becomes the probe request
        return true;
      }
      return false;
    }

    // If circuit is half-open, only allow one probe request at a time
    if (this.state === "half-open") {
      if (this.probeLock) {
        return false;
      }
      this.probeLock = true;
      return true;
    }

    return true;
  }

  /**
   * Record a successful execution
   */
  recordSuccess(): void {
    this.failureCount = 0;
    this.state = "closed";
    this.lastFailureTime = undefined;
    this.nextAttemptTime = undefined;
    this.probeLock = false;
  }

  /**
   * Record a failed execution
   */
  recordFailure(): void {
    this.failureCount++;
    this.lastFailureTime = Date.now();

    // If in half-open state, any failure should immediately reopen
    if (this.state === "half-open") {
      this.state = "open";
      this.nextAttemptTime = Date.now() + this.resetTimeoutMs;
      this.probeLock = false;
      return;
    }

    // Check if we should open the circuit
    if (this.failureCount >= this.failureThreshold) {
      this.state = "open";
      this.nextAttemptTime = Date.now() + this.resetTimeoutMs;
    }
  }

  /**
   * Get the current circuit state (pure, no side effects)
   */
  getState(): CircuitState {
    return this.state;
  }

  /**
   * Reset the circuit breaker to closed state
   */
  reset(): void {
    this.state = "closed";
    this.failureCount = 0;
    this.lastFailureTime = undefined;
    this.nextAttemptTime = undefined;
    this.probeLock = false;
  }
}
