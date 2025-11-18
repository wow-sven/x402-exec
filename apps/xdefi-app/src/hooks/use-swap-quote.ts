import { useEffect, useRef, useState } from "react";
import { formatUnits, parseUnits } from "viem";
import { okxGetQuote } from "@/lib/okx";
import { useDebouncedValue } from "@/hooks/use-debounced-value";

export type TokenShape = {
  address?: string;
  decimals?: number;
};

export function useSwapQuoteExactIn(params: {
  fromChainId?: number;
  toChainId?: number;
  fromToken?: TokenShape;
  toToken?: TokenShape;
  amountIn?: string; // human units string
  slippage?: number;
  userAddress?: string;
  debounceMs?: number;
  fallbackPrices?: { fromPrice?: number; toPrice?: number };
}) {
  const {
    fromChainId,
    toChainId,
    fromToken,
    toToken,
    amountIn,
    slippage,
    userAddress,
    debounceMs = 450,
    fallbackPrices,
  } = params;

  const { debounced: debouncedAmountIn, isDebouncing } = useDebouncedValue(
    amountIn ?? "",
    debounceMs,
  );

  const [toAmount, setToAmount] = useState("");
  const [meta, setMeta] = useState<{
    tradeFeeUSD?: string;
    priceImpactPercent?: string;
  } | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const reqIdRef = useRef(0);

  useEffect(() => {
    const amt = debouncedAmountIn?.trim();

    // Reset state when not ready
    if (
      !fromChainId ||
      !toChainId ||
      !fromToken?.address ||
      !toToken?.address
    ) {
      setToAmount("");
      setMeta(null);
      setError(null);
      setLoading(false);
      return;
    }

    // Invalid/empty input -> clear
    const amtNum = Number(amt);
    if (!amt || Number.isNaN(amtNum) || amtNum <= 0) {
      setToAmount("");
      setMeta(null);
      setError(null);
      setLoading(false);
      return;
    }

    const rid = ++reqIdRef.current;
    setLoading(true);
    setError(null);
    setMeta(null);

    (async () => {
      // Prepare raw amount with decimals from fromToken
      let amountRaw = "0";
      try {
        amountRaw = parseUnits(amt!, fromToken.decimals ?? 18).toString();
      } catch {
        amountRaw = "0";
      }

      try {
        const q = await okxGetQuote({
          chainId: fromChainId!,
          tokenIn: fromToken.address!,
          tokenOut: toToken.address!,
          amountRaw,
          swapMode: "exactIn",
          slippage,
          userAddress,
        });
        if (reqIdRef.current !== rid) return; // stale

        if (q) {
          const qToDecRaw = (q as any)?.data?.toToken?.decimal;
          const qToDecimals =
            typeof qToDecRaw === "string"
              ? Number.parseInt(qToDecRaw, 10)
              : undefined;
          const toDecimals = Number.isFinite(qToDecimals as number)
            ? (qToDecimals as number)
            : toToken.decimals ?? 18;
          const rawOut = q.rawAmountOut || q.amountOut || "0";
          let display = "0";
          try {
            display = formatUnits(BigInt(rawOut), toDecimals);
          } catch {}
          const [i, d = ""] = display.split(".");
          const t = d.replace(/0+$/, "").slice(0, 6);
          display = t ? `${i}.${t}` : i;
          setToAmount(display);
          setMeta({
            tradeFeeUSD: q.tradeFeeUSD,
            priceImpactPercent: q.priceImpactPercent,
          });
          setError(null);
        } else {
          setMeta(null);
          setError(new Error("quote_unavailable"));
          // Fallback to simple price ratio if available
          if (fallbackPrices?.fromPrice && fallbackPrices?.toPrice) {
            const fromValue = Number(amt) * fallbackPrices.fromPrice;
            const est = fromValue / fallbackPrices.toPrice;
            setToAmount(Number.isFinite(est) ? est.toFixed(6) : "");
          } else {
            setToAmount("");
          }
        }
      } catch {
        if (reqIdRef.current !== rid) return; // stale
        setMeta(null);
        setError(new Error("quote_failed"));
        if (fallbackPrices?.fromPrice && fallbackPrices?.toPrice) {
          const fromValue = Number(amt) * fallbackPrices.fromPrice;
          const est = fromValue / fallbackPrices.toPrice;
          setToAmount(Number.isFinite(est) ? est.toFixed(6) : "");
        } else {
          setToAmount("");
        }
      } finally {
        if (reqIdRef.current === rid) setLoading(false);
      }
    })();
  }, [
    fromChainId,
    toChainId,
    fromToken?.address,
    toToken?.address,
    fromToken?.decimals,
    toToken?.decimals,
    debouncedAmountIn,
    slippage,
    userAddress,
    fallbackPrices?.fromPrice,
    fallbackPrices?.toPrice,
  ]);

  return { toAmount, loading, meta, error, isDebouncing, debouncedAmountIn } as const;
}

