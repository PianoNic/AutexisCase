import { useRef, useEffect, useState } from 'react'
import { X, Send } from 'lucide-react'
import { Drawer, DrawerContent } from '@/components/ui/drawer'
import { useChat } from '@/context/ChatContext'
import { getProduct } from '@/data/mock'

const QUICK_CHIPS = [
  'Wie lange haltbar?',
  'Ist die Kühlkette ok?',
  'Wie nachhaltig ist das?',
  'Gibt es Alternativen?',
]

export function ChatDrawer() {
  const { messages, isOpen, isTyping, productContext, closeChat, sendMessage } = useChat()
  const [input, setInput] = useState('')
  const scrollRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const product = productContext ? getProduct(productContext) : null

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages, isTyping])

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 300)
    }
  }, [isOpen])

  const handleSend = () => {
    const text = input.trim()
    if (!text) return
    sendMessage(text)
    setInput('')
  }

  return (
    <Drawer open={isOpen} onOpenChange={(open) => !open && closeChat()}>
      <DrawerContent showOverlay className="flex flex-col !max-h-[85vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-4 pt-2 pb-3 border-b shrink-0">
          <div>
            <p className="text-sm font-semibold">Food Assistent</p>
            {product && (
              <p className="text-[10px] text-muted-foreground">
                Kontext: {product.name}
              </p>
            )}
          </div>
          <button onClick={closeChat} className="flex h-8 w-8 items-center justify-center rounded-full hover:bg-muted">
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Quick chips */}
        <div className="flex gap-1.5 overflow-x-auto px-4 py-2 shrink-0">
          {QUICK_CHIPS.map((chip) => (
            <button
              key={chip}
              onClick={() => sendMessage(chip)}
              className="shrink-0 rounded-full border px-2.5 py-1 text-[11px] text-muted-foreground hover:bg-muted active:bg-accent transition-colors"
            >
              {chip}
            </button>
          ))}
        </div>

        {/* Messages */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-2 space-y-2">
          {messages.map((msg) => (
            <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div
                className={`max-w-[85%] rounded-2xl px-3 py-2 text-xs leading-relaxed ${
                  msg.role === 'user'
                    ? 'bg-primary text-primary-foreground rounded-br-sm'
                    : 'bg-muted rounded-bl-sm'
                }`}
              >
                {msg.content}
              </div>
            </div>
          ))}
          {isTyping && (
            <div className="flex justify-start">
              <div className="bg-muted rounded-2xl rounded-bl-sm px-3 py-2">
                <div className="flex gap-1">
                  <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground/40 animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground/40 animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground/40 animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Input */}
        <div className="flex items-center gap-2 border-t px-4 py-3 shrink-0">
          <input
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Frage stellen..."
            className="flex-1 rounded-full border bg-background px-3 py-2 text-xs outline-none focus:ring-1 focus:ring-primary"
          />
          <button
            onClick={handleSend}
            disabled={!input.trim()}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground disabled:opacity-40"
          >
            <Send className="h-3.5 w-3.5" />
          </button>
        </div>
      </DrawerContent>
    </Drawer>
  )
}
