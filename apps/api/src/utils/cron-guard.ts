import { randomUUID } from "node:crypto";
import { logger } from "./logger";

export interface CronGuardOptions {
  /** Maximum number of retry attempts (default: 3). */
  maxAttempts?: number;
  /** Initial backoff delay in milliseconds (default: 5000). */
  initialDelayMs?: number;
  /** Maximum total time allowed for all attempts in milliseconds (default: 300000 = 5 min). */
  maxTotalMs?: number;
}

const DEFAULT_OPTIONS: Required<CronGuardOptions> = {
  maxAttempts: 3,
  initialDelayMs: 5_000,
  maxTotalMs: 300_000,
};

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Wraps an async cron job so that:
 * 1. Errors never crash the process.
 * 2. Transient failures are retried with exponential backoff.
 * 3. Every attempt is logged with job name and attempt count.
 */
export function cronGuard(
  jobName: string,
  fn: () => Promise<unknown>,
  opts?: CronGuardOptions,
): () => Promise<void> {
  const { maxAttempts, initialDelayMs, maxTotalMs } = {
    ...DEFAULT_OPTIONS,
    ...opts,
  };

  return async () => {
    const runId = randomUUID();
    const deadline = Date.now() + maxTotalMs;

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        logger.info("CRON_ATTEMPT_START", {
          event: "CRON_ATTEMPT_START",
          job: jobName,
          runId,
          attempt,
          maxAttempts,
        });

        await fn();

        logger.info("CRON_ATTEMPT_OK", {
          event: "CRON_ATTEMPT_OK",
          job: jobName,
          runId,
          attempt,
        });
        return; // success - stop retrying
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);

        logger.error("CRON_ATTEMPT_FAILED", {
          event: "CRON_ATTEMPT_FAILED",
          job: jobName,
          runId,
          attempt,
          maxAttempts,
          message,
        });

        const isLastAttempt = attempt >= maxAttempts;
        const pastDeadline = Date.now() >= deadline;

        if (isLastAttempt || pastDeadline) {
          logger.error("CRON_JOB_EXHAUSTED", {
            event: "CRON_JOB_EXHAUSTED",
            job: jobName,
            runId,
            attempts: attempt,
            reason: pastDeadline ? "deadline_exceeded" : "max_attempts_reached",
            lastError: message,
          });
          return; // give up gracefully - never crash
        }

        // Exponential backoff: initialDelay * 2^(attempt-1), capped by remaining time
        const backoff = initialDelayMs * Math.pow(2, attempt - 1);
        const remaining = deadline - Date.now();
        const delay = Math.min(backoff, Math.max(remaining, 0));

        logger.info("CRON_RETRY_WAIT", {
          event: "CRON_RETRY_WAIT",
          job: jobName,
          runId,
          nextAttempt: attempt + 1,
          delayMs: delay,
        });

        await sleep(delay);
      }
    }
  };
}
