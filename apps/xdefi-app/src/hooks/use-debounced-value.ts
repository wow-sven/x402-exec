import { useEffect, useState } from "react";

// Small utility hook to debounce a value. Returns the debounced value and a flag
// indicating whether the value is still within the debounce window.
export function useDebouncedValue<T>(value: T, delay = 450) {
  const [debounced, setDebounced] = useState<T>(value);
  const [isDebouncing, setIsDebouncing] = useState(false);

  useEffect(() => {
    setIsDebouncing(true);
    const timer = setTimeout(() => {
      setDebounced(value);
      setIsDebouncing(false);
    }, delay);
    return () => clearTimeout(timer);
  }, [value, delay]);

  return { debounced, isDebouncing } as const;
}

