import { MessageCircle } from 'lucide-react'
import { useLocation } from 'react-router-dom'
import { useChat } from '@/context/ChatContext'

export function ChatFAB() {
  const { toggleChat, isOpen } = useChat()
  const location = useLocation()

  if (location.pathname === '/login' || location.pathname === '/callback' || location.pathname.startsWith('/scan')) return null
  if (isOpen) return null

  const isProductPage = location.pathname.startsWith('/product')

  return (
    <button
      onClick={toggleChat}
      className={`fixed right-4 z-50 flex h-12 w-12 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg shadow-primary/30 active:scale-95 transition-transform ${
        isProductPage ? 'bottom-4' : 'bottom-20'
      }`}
    >
      <MessageCircle className="h-5 w-5" />
    </button>
  )
}
