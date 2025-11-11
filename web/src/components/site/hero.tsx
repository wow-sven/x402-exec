import { Button } from "@/components/ui/button";
import { Rocket } from "lucide-react";
import { Link } from "react-router-dom";
import { ApplicationHooksSnippets } from "./application-hooks-snippets";

// Simplified hero: remove illustration and complex code block.
// Add a small installation snippet with common package managers.
export function Hero() {
  // const installCodes: Record<string, string> = {
  //   pnpm: "pnpm install x402X",
  //   npm: "npm install x402X",
  //   yarn: "yarn add x402X",
  //   bun: "bun add x402X",
  // };

  return (
    <section className="relative">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(50%_50%_at_50%_0%,hsl(var(--muted))_0%,transparent_70%)]" />
      <div className="relative mx-auto max-w-6xl px-4 py-16 text-center">
        <div className="mx-auto mb-4 inline-flex items-center gap-2 rounded-full border border-primary/50 bg-primary/5 px-3 py-1 text-xs text-green-600">
          <span className="h-2 w-2 rounded-full bg-green-400" />
          <span>Live on mainnet</span>
        </div>
        <h1 className="mx-auto max-w-3xl text-balance text-4xl font-semibold tracking-tight md:text-6xl">
          Pay and Execute Any Smart Contract
        </h1>
        <p className="mx-auto mt-4 max-w-2xl text-balance text-muted-foreground">
          x402X (short for x402-exec) extends x402 payments with hooks and a
          settlement router so your agents can mint, trade, split revenue and
          more — all in one atomic transaction.
        </p>
        <div className="mt-6 flex items-center justify-center gap-3">
          <Button
            onClick={() => window.open("https://demo.x402x.dev/", "_blank")}
            className="cursor-pointer"
          >
            <span className="inline-flex items-center gap-2">
              <Rocket className="h-4 w-4" />
              Try the demo
            </span>
          </Button>
          <Button variant="outline" asChild className="cursor-pointer">
            <Link to="/docs">Get Started</Link>
          </Button>
        </div>

        {/* Simple installation snippet */}
        {/* <div className="mt-8 text-left">
          <CodeTabs codes={installCodes} lang="bash" />
        </div> */}

        {/* Application hooks */}
        <ApplicationHooksSnippets />
      </div>
    </section>
  );
}

export default Hero;
