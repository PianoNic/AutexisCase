import { useEffect, useState } from "react";
import { ShieldCheck, Link, AlertTriangle } from "lucide-react";
import type { BlockchainDto } from "@/api/models/BlockchainDto";
import { productApi } from "@/api/client";

export function BlockchainCard({ batchId }: { batchId: string }) {
  const [chain, setChain] = useState<BlockchainDto | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    productApi
      .getBatchBlockchain({ batchId })
      .then(setChain)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [batchId]);

  if (loading) {
    return (
      <div className="rounded-xl border px-3 py-4 text-center">
        <p className="text-xs text-muted-foreground">Blockchain wird geladen...</p>
      </div>
    );
  }

  if (!chain || !chain.blocks?.length) return null;

  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold">Blockchain-Verifizierung</p>
        {chain.chainValid ? (
          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 border border-emerald-200 px-2 py-0.5 text-[10px] font-semibold text-emerald-700">
            <ShieldCheck className="h-3 w-3" />
            Verifiziert
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 rounded-full bg-red-50 border border-red-200 px-2 py-0.5 text-[10px] font-semibold text-red-700">
            <AlertTriangle className="h-3 w-3" />
            Ungültig
          </span>
        )}
      </div>

      <div className="space-y-0">
        {chain.blocks.map((block, i) => (
          <div key={block.index} className="relative">
            {/* Connector line */}
            {i > 0 && (
              <div className="absolute left-4 -top-2 h-2 w-px bg-border" />
            )}

            <div className="flex gap-3">
              {/* Block icon */}
              <div className="relative flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-700">
                <Link className="h-3.5 w-3.5" />
                {i < chain.blocks!.length - 1 && (
                  <div className="absolute left-1/2 top-full h-3 w-px -translate-x-1/2 bg-border" />
                )}
              </div>

              {/* Block content */}
              <div className="flex-1 rounded-xl border px-3 py-2 mb-3">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-semibold">Block #{block.index}</p>
                  <p className="text-[10px] text-muted-foreground">
                    {block.timestamp ? new Date(block.timestamp).toLocaleDateString("de-CH", { day: "numeric", month: "short", year: "numeric" }) : ""}
                  </p>
                </div>
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  {block.step} — {block.location}
                </p>
                {block.temperature != null && (
                  <p className="text-[10px] text-muted-foreground">
                    {block.temperature}°C
                  </p>
                )}
                <div className="mt-1.5 rounded bg-muted px-2 py-1">
                  <p className="text-[9px] font-mono text-muted-foreground break-all leading-tight">
                    {block.hash?.slice(0, 32)}...
                  </p>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <p className="text-[10px] text-muted-foreground text-center">
        SHA-256 Hash-Kette · {chain.blocks.length} Blöcke · {chain.chainValid ? "Integrität bestätigt" : "Kette unterbrochen"}
      </p>
    </section>
  );
}
