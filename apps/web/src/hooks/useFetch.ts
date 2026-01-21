import { useCallback, useEffect, useRef, useState } from "react";

type UseFetchOptions = {
  init?: RequestInit;
  immediate?: boolean;
  signal?: AbortSignal;
};

type UseFetchResult<T> = {
  data: T | null;
  loading: boolean;
  error: string | null;
  retry: () => void;
};

const RETRY_BACKOFF_MS = [1000, 2000, 4000];
const MAX_RETRIES = RETRY_BACKOFF_MS.length;
const REQUEST_TIMEOUT_MS = 10_000;

const sleep = (ms: number, signal: AbortSignal) =>
  new Promise<void>((resolve, reject) => {
    const timeoutId = window.setTimeout(() => resolve(), ms);

    if (signal.aborted) {
      window.clearTimeout(timeoutId);
      reject(new Error("Το αίτημα ακυρώθηκε."));
      return;
    }

    signal.addEventListener(
      "abort",
      () => {
        window.clearTimeout(timeoutId);
        reject(new Error("Το αίτημα ακυρώθηκε."));
      },
      { once: true }
    );
  });

const mapNetworkError = (error: unknown) => {
  if (error instanceof Error) {
    if (error.name === "TypeError") {
      return "Σφάλμα δικτύου. Ελέγξτε τη σύνδεσή σας.";
    }

    return error.message;
  }

  return "Προέκυψε άγνωστο σφάλμα.";
};

export const useFetch = <T,>(
  url: string | null,
  options: UseFetchOptions = {}
): UseFetchResult<T> => {
  const { init, immediate = true, signal: externalSignal } = options;
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const cacheRef = useRef<T | null>(null);

  const fetchData = useCallback(async () => {
    if (!url) {
      return;
    }

    abortControllerRef.current?.abort();
    const controller = new AbortController();
    abortControllerRef.current = controller;

    let didTimeout = false;
    const timeoutId = window.setTimeout(() => {
      didTimeout = true;
      controller.abort();
    }, REQUEST_TIMEOUT_MS);

    const handleExternalAbort = () => controller.abort();
    if (externalSignal) {
      if (externalSignal.aborted) {
        controller.abort();
      } else {
        externalSignal.addEventListener("abort", handleExternalAbort, {
          once: true,
        });
      }
    }

    setLoading(true);
    setError(null);

    let attempt = 0;

    try {
      while (true) {
        try {
          const response = await fetch(url, {
            ...init,
            signal: controller.signal,
          });

          if (!response.ok) {
            throw new Error(
              `Σφάλμα διακομιστή: ${response.status} ${
                response.statusText || "Άγνωστο"
              }`
            );
          }

          const result = (await response.json()) as T;
          cacheRef.current = result;
          setData(result);
          setError(null);
          return;
        } catch (err) {
          if (controller.signal.aborted) {
            if (didTimeout) {
              throw new Error(
                "Το αίτημα ξεπέρασε το χρονικό όριο των 10s."
              );
            }

            throw new Error("Το αίτημα ακυρώθηκε.");
          }

          if (attempt < MAX_RETRIES) {
            const backoffDelay = RETRY_BACKOFF_MS[attempt] ?? 1000;
            attempt += 1;
            await sleep(backoffDelay, controller.signal);
            continue;
          }

          throw err;
        }
      }
    } catch (err) {
      setError(mapNetworkError(err));
      if (cacheRef.current) {
        setData(cacheRef.current);
      }
    } finally {
      window.clearTimeout(timeoutId);
      if (externalSignal) {
        externalSignal.removeEventListener("abort", handleExternalAbort);
      }
      setLoading(false);
    }
  }, [externalSignal, init, url]);

  const retry = useCallback(() => {
    void fetchData();
  }, [fetchData]);

  useEffect(() => {
    if (!immediate) {
      return;
    }

    void fetchData();

    return () => {
      abortControllerRef.current?.abort();
    };
  }, [fetchData, immediate]);

  return { data, loading, error, retry };
};
