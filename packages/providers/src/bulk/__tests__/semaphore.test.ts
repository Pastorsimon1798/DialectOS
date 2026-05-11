import { describe, it, expect } from "vitest";
import { Semaphore } from "../semaphore.js";

describe("Semaphore bounds", () => {
  it("accepts positive integer permits", () => {
    expect(() => new Semaphore(1)).not.toThrow();
    expect(() => new Semaphore(4)).not.toThrow();
    expect(() => new Semaphore(100)).not.toThrow();
  });

  it("rejects zero permits", () => {
    expect(() => new Semaphore(0)).toThrow("Semaphore permits must be a positive integer");
  });

  it("rejects negative permits", () => {
    expect(() => new Semaphore(-1)).toThrow("Semaphore permits must be a positive integer");
    expect(() => new Semaphore(-100)).toThrow("Semaphore permits must be a positive integer");
  });

  it("rejects non-integer permits", () => {
    expect(() => new Semaphore(1.5)).toThrow("Semaphore permits must be a positive integer");
    expect(() => new Semaphore(NaN)).toThrow("Semaphore permits must be a positive integer");
  });

  it("blocks acquire when permits are exhausted", async () => {
    const sem = new Semaphore(1);
    await sem.acquire();
    let released = false;
    const pending = sem.acquire().then(() => {
      released = true;
    });
    expect(released).toBe(false);
    sem.release();
    await pending;
    expect(released).toBe(true);
  });
});
