import { useEffect, useRef, useState } from "react";
import { okxGetTokenPrice } from "@/lib/okx";

export function useTokenPrice(params: {
  chainId?: number;
  tokenAddress?: string;
}) {
  const { chainId, tokenAddress } = params;
  const [price, setPrice] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const reqIdRef = useRef(0);

  useEffect(() => {
    if (!chainId || !tokenAddress) {
      setPrice(null);
      setError(null);
      setLoading(false);
      return;
    }

    const rid = ++reqIdRef.current;
    setLoading(true);
    setError(null);
    (async () => {
      try {
        const result = await okxGetTokenPrice({ chainId, tokenAddress });
        if (reqIdRef.current !== rid) return; // stale
        if (result && result.price > 0) {
          setPrice(result.price);
          setError(null);
        } else {
          setPrice(null);
          setError(new Error("price_unavailable"));
        }
      } catch {
        if (reqIdRef.current !== rid) return; // stale
        setPrice(null);
        setError(new Error("price_failed"));
      } finally {
        if (reqIdRef.current === rid) setLoading(false);
      }
    })();
  }, [chainId, tokenAddress]);

  return { price, loading, error } as const;
}

