"use client";
import * as React from "react";

export function useClipboard({ timeout = 2000 }: { timeout?: number } = {}) {
  const [copied, setCopied] = React.useState(false);
  const [error, setError] = React.useState<Error | null>(null);
  const timer = React.useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  React.useEffect(() => () => clearTimeout(timer.current), []);

  const copy = React.useCallback(
    async (text: string) => {
      try {
        await navigator.clipboard.writeText(text);
        setError(null);
        setCopied(true);
        clearTimeout(timer.current);
        timer.current = setTimeout(() => setCopied(false), timeout);
        return true;
      } catch (e) {
        setError(e as Error);
        return false;
      }
    },
    [timeout]
  );

  const reset = React.useCallback(() => {
    clearTimeout(timer.current);
    setCopied(false);
    setError(null);
  }, []);

  return { copy, copied, error, reset };
}
