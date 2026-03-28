import { useEffect, useState } from "react";
import { ShieldCheck, Link, AlertTriangle, X } from "lucide-react";
import type { BlockchainDto } from "@/api/models/BlockchainDto";
import { productApi } from "@/api/client";

export function BlockchainCard({ batchId }: { batchId: string }) {
  const [chain, setChain] = useState<BlockchainDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    productApi
      .getBatchBlockchain({ batchId })
      .then(setChain)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [batchId]);

  if (loading || !chain || !chain.blocks?.length) return null;

  return (
    <>
      {/* Compact badge button */}
      <button
        onClick={() => setOpen(true)}
        className="flex w-full items-center justify-between rounded-xl border px-3 py-2.5 active:bg-muted transition-colors"
      >
        <div className="flex items-center gap-2">
          <Link className="h-3.5 w-3.5 text-emerald-600" />
          <span className="text-xs font-semibold">Blockchain-Verifizierung</span>
        </div>
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
      </button>

      {/* Bottom sheet modal */}
      {open && (
        <div className="fixed inset-0 z-[60]">
          <div className="absolute inset-0 bg-black/40" onClick={() => setOpen(false)} />
          <div className="absolute bottom-0 left-0 right-0 mx-auto max-w-md rounded-t-2xl bg-background p-5 space-y-4 max-h-[80dvh] flex flex-col">
            <div className="mx-auto h-1 w-10 rounded-full bg-muted shrink-0" />

            {/* Header */}
            <div className="flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2">
                <Link className="h-4 w-4 text-emerald-600" />
                <p className="text-base font-semibold">Blockchain</p>
              </div>
              <button onClick={() => setOpen(false)} className="rounded-full p-1 hover:bg-muted">
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Chain info */}
            <div className="flex items-center justify-between rounded-xl bg-muted px-3 py-2 shrink-0">
              <div>
                <p className="text-[10px] text-muted-foreground">GTIN</p>
                <p className="text-xs font-mono font-semibold">{chain.gtin}</p>
              </div>
              <div className="text-right">
                <p className="text-[10px] text-muted-foreground">LOT</p>
                <p className="text-xs font-mono font-semibold">{chain.lotNumber}</p>
              </div>
              <div>
                {chain.chainValid ? (
                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 border border-emerald-200 px-2 py-0.5 text-[10px] font-semibold text-emerald-700">
                    <ShieldCheck className="h-3 w-3" />
                    Intakt
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 rounded-full bg-red-50 border border-red-200 px-2 py-0.5 text-[10px] font-semibold text-red-700">
                    <AlertTriangle className="h-3 w-3" />
                    Unterbrochen
                  </span>
                )}
              </div>
            </div>

            {/* Blocks list */}
            <div className="overflow-y-auto flex-1">
              {chain.blocks.map((block, i) => (
                <div key={block.index} className="relative flex gap-3">
                  {/* Continuous vertical line */}
                  {i < chain.blocks!.length - 1 && (
                    <div className="absolute left-4 top-8 bottom-0 w-px bg-border" />
                  )}

                  <div className="relative flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-700 z-10">
                    <Link className="h-3.5 w-3.5" />
                  </div>

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
                      <div className="mt-1.5 space-y-0.5">
                        <div className="rounded bg-muted px-2 py-1">
                          <p className="text-[8px] text-muted-foreground">HASH</p>
                          <p className="text-[9px] font-mono text-foreground/70 break-all leading-tight">
                            {block.hash}
                          </p>
                        </div>
                        <div className="rounded bg-muted px-2 py-1">
                          <p className="text-[8px] text-muted-foreground">PREV</p>
                          <p className="text-[9px] font-mono text-foreground/70 break-all leading-tight">
                            {block.previousHash?.slice(0, 16)}...
                          </p>
                        </div>
                      </div>
                    </div>
                </div>
              ))}
            </div>

            <p className="text-[10px] text-muted-foreground text-center shrink-0">
              SHA-256 · {chain.blocks.length} Blöcke · {chain.chainValid ? "Integrität bestätigt" : "Kette unterbrochen"}
            </p>
          </div>
        </div>
      )}
    </>
  );
}
