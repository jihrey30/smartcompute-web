import { useState, useCallback } from "react";

/**
 * A reusable helper hook that wraps an async function to prevent double submissions.
 * It manages an `isPending` state internally and ignores subsequent calls until the current one resolves.
 */
export function useAsyncAction<T extends (...args: unknown[]) => Promise<unknown>>(action: T) {
  const [isPending, setIsPending] = useState(false);

  const execute = useCallback(
    async (...args: Parameters<T>) => {
      if (isPending) return;
      setIsPending(true);
      try {
        return await action(...args);
      } finally {
        setIsPending(false);
      }
    },
    [action, isPending]
  );

  return { execute, isPending };
}
