// Lightweight client for the OKX Web3 DEX API via our signed proxy at /api/okx
// Only the bits we need for now (Get Tokens)

export type OkxToken = {
	chainId?: string | number;
	address: string;
	symbol: string;
	name: string;
	decimals?: number;
	logoURI?: string;
};

type OkxTokensResponse = {
	code?: string | number;
	msg?: string;
	data?: OkxToken[];
	// Some OKX responses also use `error_code`/`error_message`; keep tolerant parsing
	error_code?: string | number;
	error_message?: string;
};

const OKX_PROXY = "/api/okx"; // Vercel function that signs requests using server env vars

// Fetch token list for a given EVM chain using the OKX Aggregator all-tokens endpoint.
// Docs: https://web3.okx.com/build/dev-docs/wallet-api/dex-get-tokens
// Path: /api/v6/dex/aggregator/all-tokens?chainIndex=1
export async function okxGetTokens(params: {
    // We pass EVM chainId as OKX `chainIndex` (matches OKX example: 1 for Ethereum)
    chainId: number;
    // keyword/limit intentionally not sent; we only slice client-side
    keyword?: string;
    limit?: number; // client-side slice cap only
}): Promise<OkxToken[]> {
	const qs = new URLSearchParams();
	qs.set("path", "/api/v6/dex/aggregator/all-tokens");
	qs.set("chainIndex", String(params.chainId));

	const url = `${OKX_PROXY}?${qs.toString()}`;
	const res = await fetch(url, { headers: { Accept: "application/json" } });
	if (!res.ok) {
		// Return empty list instead of throwing; caller can fall back to local tokens
		return [];
	}
	const payload = (await res.json().catch(() => ({}))) as OkxTokensResponse;

	// OKX usually returns { code: '0', data: [...] } on success
	const code = payload?.code ?? payload?.error_code;
	if (code != null && String(code) !== "0") {
		return [];
	}

  const data = Array.isArray(payload?.data) ? payload!.data! : [] as any[];
  // Normalize minimal shape from OKX `all-tokens` response
  // Sample keys: tokenContractAddress, tokenSymbol, tokenName, tokenLogoUrl, decimals
  return data
    .map((t: any) => {
      const address = t.address ?? t.tokenContractAddress ?? '';
      const symbol = t.symbol ?? t.tokenSymbol ?? '';
      const name = t.name ?? t.tokenName ?? symbol;
      const decimalsRaw = t.decimals;
      const decimals =
        typeof decimalsRaw === 'number'
          ? decimalsRaw
          : typeof decimalsRaw === 'string'
            ? Number.parseInt(decimalsRaw, 10)
            : undefined;
      const logoURI = t.logoURI ?? t.tokenLogoUrl;
      return { chainId: t.chainId, address, symbol, name, decimals, logoURI } as OkxToken;
    })
    .filter((t) => !!t.address && !!t.symbol);
}
