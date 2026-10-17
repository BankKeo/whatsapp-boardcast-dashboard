"use client";

/**
 * Small data-fetching hook.
 *
 * Screens use this to load exactly the slice they render from the API. Requests
 * are aborted when the inputs change or the component unmounts, so a slow
 * response can never overwrite newer data.
 */

import * as React from "react";
import { ApiError } from "@/lib/api/client";

export interface AsyncState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
  /** Re-run the request; safe to call from an event handler. */
  reload: () => void;
}

/**
 * Run an async loader whenever `deps` change.
 *
 * `loader` is read from a ref, so it does not have to be memoised — only the
 * values in `deps` trigger a refetch.
 */
export function useAsync<T>(
  loader: (signal: AbortSignal) => Promise<T>,
  deps: readonly unknown[],
): AsyncState<T> {
  const loaderRef = React.useRef(loader);

  // Keep the latest loader without touching the ref during render.
  React.useEffect(() => {
    loaderRef.current = loader;
  });

  const [data, setData] = React.useState<T | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [nonce, setNonce] = React.useState(0);

  React.useEffect(() => {
    const controller = new AbortController();
    let active = true;

    setLoading(true);
    setError(null);

    loaderRef
      .current(controller.signal)
      .then((result) => {
        if (!active) return;
        setData(result);
        setLoading(false);
      })
      .catch((cause: unknown) => {
        if (!active) return;
        if (cause instanceof DOMException && cause.name === "AbortError") return;
        setError(
          cause instanceof ApiError ? cause.message : "Something went wrong loading this data.",
        );
        setLoading(false);
      });

    return () => {
      active = false;
      controller.abort();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, nonce]);

  const reload = React.useCallback(() => setNonce((value) => value + 1), []);

  return { data, loading, error, reload };
}
