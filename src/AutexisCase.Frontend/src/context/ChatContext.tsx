import { createContext, useContext, useState, useCallback, type ReactNode } from 'react'
import type { ChatMessage } from '@/types/ai-features'
import { getMockChatResponse } from '@/data/mock-ai'

interface ChatContextValue {
  messages: ChatMessage[]
  isOpen: boolean
  isTyping: boolean
  productContext: string | null
  openChat: () => void
  closeChat: () => void
  toggleChat: () => void
  sendMessage: (text: string) => void
  setProductContext: (id: string | null) => void
}

const ChatContext = createContext<ChatContextValue | null>(null)

export function ChatProvider({ children }: { children: ReactNode }) {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content: 'Hallo! Ich bin dein Food-Assistent. Frag mich zu Haltbarkeit, Kühlkette, Nachhaltigkeit oder Alternativen.',
      timestamp: new Date(),
    },
  ])
  const [isOpen, setIsOpen] = useState(false)
  const [isTyping, setIsTyping] = useState(false)
  const [productContext, setProductContext] = useState<string | null>(null)

  const openChat = useCallback(() => setIsOpen(true), [])
  const closeChat = useCallback(() => setIsOpen(false), [])
  const toggleChat = useCallback(() => setIsOpen((o) => !o), [])

  const sendMessage = useCallback(
    (text: string) => {
      const userMsg: ChatMessage = {
        id: `u-${Date.now()}`,
        role: 'user',
        content: text,
        timestamp: new Date(),
        productContext: productContext ?? undefined,
      }
      setMessages((prev) => [...prev, userMsg])
      setIsTyping(true)

      setTimeout(() => {
        const response = getMockChatResponse(text, productContext)
        const assistantMsg: ChatMessage = {
          id: `a-${Date.now()}`,
          role: 'assistant',
          content: response,
          timestamp: new Date(),
        }
        setMessages((prev) => [...prev, assistantMsg])
        setIsTyping(false)
      }, 800)
    },
    [productContext],
  )

  return (
    <ChatContext.Provider
      value={{ messages, isOpen, isTyping, productContext, openChat, closeChat, toggleChat, sendMessage, setProductContext }}
    >
      {children}
    </ChatContext.Provider>
  )
}

export function useChat() {
  const ctx = useContext(ChatContext)
  if (!ctx) throw new Error('useChat must be used within ChatProvider')
  return ctx
}
