import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { MessageCircle, Send, X, Loader2 } from "lucide-react";
import { productApi } from "@/api/client";

interface Message {
  role: "user" | "assistant";
  content: string;
}

export function ProductChat({ productId, batchId }: { productId: string; batchId?: string }) {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const sheetRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const vv = window.visualViewport;
    if (!vv) return;

    const onResize = () => {
      if (!sheetRef.current) return;
      const keyboardHeight = window.innerHeight - vv.height;
      sheetRef.current.style.transform = keyboardHeight > 0 ? `translateY(-${keyboardHeight}px)` : "";
    };

    vv.addEventListener("resize", onResize);
    vv.addEventListener("scroll", onResize);
    return () => {
      vv.removeEventListener("resize", onResize);
      vv.removeEventListener("scroll", onResize);
    };
  }, [open]);

  const send = async () => {
    const question = input.trim();
    if (!question || loading) return;

    setInput("");
    setMessages((prev) => [...prev, { role: "user", content: question }]);
    setLoading(true);

    setTimeout(() => scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" }), 50);

    try {
      const response = await productApi.askProduct({
        productId,
        batchId: batchId ?? undefined,
        chatMessageDto: { role: "user", content: question },
      });
      setMessages((prev) => [...prev, { role: "assistant", content: response.answer ?? "Keine Antwort." }]);
    } catch {
      setMessages((prev) => [...prev, { role: "assistant", content: "Fehler beim Laden der Antwort." }]);
    } finally {
      setLoading(false);
      setTimeout(() => scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" }), 50);
    }
  };

  return createPortal(
    <>
      {/* FAB */}
      {!open && (
        <button
          onClick={() => setOpen(true)}
          className="fixed bottom-4 right-4 z-[100] flex h-12 w-12 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg active:scale-95 transition-transform"
        >
          <MessageCircle className="h-5 w-5" />
        </button>
      )}

      {/* Chat sheet */}
      {open && (
        <div className="fixed inset-0 z-[100]">
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => setOpen(false)}
            onPointerDownCapture={(e) => e.stopPropagation()}
            onTouchStartCapture={(e) => e.stopPropagation()}
          />
          <div
            ref={sheetRef}
            className="absolute bottom-0 left-0 right-0 mx-auto max-w-md rounded-t-2xl bg-background flex flex-col max-h-[85dvh] transition-transform duration-100"
            data-vaul-no-drag
            onTouchMoveCapture={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b shrink-0">
              <div className="flex items-center gap-2">
                <MessageCircle className="h-4 w-4 text-primary" />
                <p className="text-sm font-semibold">Produktberater</p>
              </div>
              <button onClick={() => setOpen(false)} className="rounded-full p-1 hover:bg-muted">
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Messages */}
            <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
              {messages.length === 0 && (
                <div className="text-center py-8 space-y-2">
                  <MessageCircle className="h-8 w-8 text-muted-foreground/30 mx-auto" />
                  <p className="text-xs text-muted-foreground">
                    Stelle eine Frage zu diesem Produkt
                  </p>
                  <div className="flex flex-wrap justify-center gap-1.5 pt-2">
                    {["Ist das Produkt sicher?", "Woher kommt es?", "Wie nachhaltig ist es?"].map((q) => (
                      <button
                        key={q}
                        onClick={() => { setInput(q); }}
                        className="rounded-full border px-2.5 py-1 text-[11px] text-muted-foreground active:bg-muted transition-colors"
                      >
                        {q}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {messages.map((msg, i) => (
                <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                  <div
                    className={`max-w-[85%] rounded-2xl px-3 py-2 text-[13px] leading-relaxed ${
                      msg.role === "user"
                        ? "bg-primary text-primary-foreground rounded-br-sm"
                        : "bg-muted rounded-bl-sm"
                    }`}
                  >
                    {msg.content}
                  </div>
                </div>
              ))}

              {loading && (
                <div className="flex justify-start">
                  <div className="bg-muted rounded-2xl rounded-bl-sm px-3 py-2">
                    <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                  </div>
                </div>
              )}
            </div>

            {/* Input */}
            <div className="border-t px-3 py-2 shrink-0 pb-[max(0.5rem,env(safe-area-inset-bottom))]">
              <form
                onSubmit={(e) => { e.preventDefault(); send(); }}
                className="flex items-center gap-2"
              >
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Frage stellen..."
                  className="flex-1 rounded-full border bg-muted/50 px-3.5 py-2 text-sm outline-none focus:ring-1 focus:ring-primary touch-auto"
                  data-vaul-no-drag
                  disabled={loading}
                />
                <button
                  type="submit"
                  disabled={!input.trim() || loading}
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground disabled:opacity-30"
                >
                  <Send className="h-4 w-4" />
                </button>
              </form>
            </div>
          </div>
        </div>
      )}
    </>,
    document.body,
  );
}
