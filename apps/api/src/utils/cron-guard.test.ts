import { describe, it, expect, mock } from "bun:test";
import { cronGuard } from "./cron-guard";

/* Silence logger output during tests */
mock.module("./logger", () => ({
  logger: {
    info: () => {},
    error: () => {},
    warn: () => {},
    child: () => ({ info: () => {}, error: () => {}, warn: () => {} }),
  },
  createRequestLogger: () => ({ info: () => {}, error: () => {}, warn: () => {} }),
  getRequestId: () => "test",
  resolveUserId: () => "test",
}));

describe("cronGuard", () => {
  it("should call the wrapped function once on success", async () => {
    let calls = 0;
    const fn = async () => { calls++; };
    const guarded = cronGuard("test-job", fn, { maxAttempts: 3, initialDelayMs: 10 });

    await guarded();

    expect(calls).toBe(1);
  });

  it("should retry on failure and succeed on a later attempt", async () => {
    let calls = 0;
    const fn = async () => {
      calls++;
      if (calls < 3) throw new Error("transient");
    };
    const guarded = cronGuard("test-job", fn, {
      maxAttempts: 5,
      initialDelayMs: 10,
      maxTotalMs: 60_000,
    });

    await guarded();

    expect(calls).toBe(3);
  });

  it("should stop after maxAttempts and never throw", async () => {
    let calls = 0;
    const fn = async () => {
      calls++;
      throw new Error("permanent");
    };
    const guarded = cronGuard("test-job", fn, {
      maxAttempts: 3,
      initialDelayMs: 10,
      maxTotalMs: 60_000,
    });

    // Must not throw
    await guarded();

    expect(calls).toBe(3);
  });

  it("should never throw even when the function throws", async () => {
    const fn = async () => {
      throw new Error("boom");
    };
    const guarded = cronGuard("failing-job", fn, {
      maxAttempts: 1,
      initialDelayMs: 10,
    });

    // This must resolve without throwing
    const result = await guarded();
    expect(result).toBeUndefined();
  });

  it("should respect maxTotalMs deadline", async () => {
    let calls = 0;
    const fn = async () => {
      calls++;
      throw new Error("slow fail");
    };
    const guarded = cronGuard("deadline-job", fn, {
      maxAttempts: 100,
      initialDelayMs: 10,
      maxTotalMs: 50, // very short deadline
    });

    await guarded();

    // Should have stopped well before 100 attempts due to deadline
    expect(calls).toBeLessThan(100);
    expect(calls).toBeGreaterThanOrEqual(1);
  });

  it("should use default options when none are provided", async () => {
    let calls = 0;
    const fn = async () => { calls++; };
    const guarded = cronGuard("default-opts-job", fn);

    await guarded();

    expect(calls).toBe(1);
  });
});
