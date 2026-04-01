'use client'

import { useEffect, useRef, useState } from 'react'
import Header from '@/components/layout/Header'
import { formatDate } from '@/lib/utils'

interface Message {
  role: 'user' | 'assistant'
  content: string
  timestamp?: string
  id?: string
}

function parseMarkdown(text: string): string {
  return text
    .replace(/```(\w*)\n?([\s\S]*?)```/g, '<pre><code>$2</code></pre>')
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    .replace(/\*([^*]+)\*/g, '<em>$1</em>')
    .replace(/^### (.+)$/gm, '<h3>$1</h3>')
    .replace(/^## (.+)$/gm, '<h3>$1</h3>')
    .replace(/^- (.+)$/gm, '<li>$1</li>')
    .replace(/(<li>.*<\/li>\n?)+/g, '<ul>$&</ul>')
    .replace(/\n\n/g, '</p><p>')
    .replace(/^(?!<[a-z])(.+)$/gm, '<p>$1</p>')
    .replace(/<p><\/p>/g, '')
}

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [loadingHistory, setLoadingHistory] = useState(true)
  const bottomRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  async function loadHistory() {
    const res = await fetch('/api/chat?limit=50')
    const { history } = await res.json()
    const msgs: Message[] = []
    for (const item of history) {
      msgs.push({ role: 'user', content: item.message, timestamp: item.timestamp, id: item.id + '_u' })
      msgs.push({ role: 'assistant', content: item.response, timestamp: item.timestamp, id: item.id + '_a' })
    }
    setMessages(msgs)
    setLoadingHistory(false)
    setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 100)
  }

  useEffect(() => { loadHistory() }, [])

  async function sendMessage(e?: React.FormEvent) {
    e?.preventDefault()
    if (!input.trim() || loading) return

    const userMsg = input.trim()
    setInput('')
    setLoading(true)

    const newMsg: Message = { role: 'user', content: userMsg, timestamp: new Date().toISOString() }
    setMessages(prev => [...prev, newMsg])
    setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 50)

    // Build history for context (last 20)
    const historyForAPI = messages.slice(-20).map(m => ({ role: m.role, content: m.content }))

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: userMsg, history: historyForAPI }),
      })
      const { response, error } = await res.json()

      const aiMsg: Message = {
        role: 'assistant',
        content: error ? `Error: ${error}` : response,
        timestamp: new Date().toISOString(),
      }
      setMessages(prev => [...prev, aiMsg])
    } catch {
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: 'Error de conexión. Intentá de nuevo.',
        timestamp: new Date().toISOString(),
      }])
    }

    setLoading(false)
    setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 100)
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  return (
    <>
      <Header
        title="IA Chat"
        subtitle="Asistente consultivo de Nova Agency"
        actions={
          <button
            onClick={() => { setMessages([]); loadHistory() }}
            className="px-3 py-1.5 text-xs bg-[#334155] hover:bg-[#475569] text-white rounded-lg transition-colors"
          >
            Actualizar historial
          </button>
        }
      />

      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
          {loadingHistory ? (
            <div className="flex items-center justify-center h-full">
              <p className="text-[#475569] text-sm">Cargando historial...</p>
            </div>
          ) : messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full gap-4">
              <div className="w-16 h-16 rounded-2xl bg-[#ff8c42]/10 border border-[#ff8c42]/20 flex items-center justify-center">
                <svg width="28" height="28" viewBox="0 0 32 32" fill="none">
                  <polygon points="16,2 30,28 2,28" fill="none" stroke="#ff8c42" strokeWidth="2" strokeLinejoin="round"/>
                  <circle cx="16" cy="20" r="3" fill="#a855f7"/>
                </svg>
              </div>
              <div className="text-center">
                <p className="text-white font-medium mb-1">Nova AI listo</p>
                <p className="text-[#475569] text-sm">Preguntame sobre clientes, proyectos, métricas o automatizaciones</p>
              </div>
              <div className="grid grid-cols-2 gap-2 mt-2 w-full max-w-md">
                {[
                  '¿Cuántos clientes activos tenemos?',
                  '¿Qué proyectos están en curso?',
                  'Mostrá las últimas métricas de Instagram',
                  '¿Hay workflows fallando en n8n?',
                ].map(suggestion => (
                  <button
                    key={suggestion}
                    onClick={() => { setInput(suggestion); textareaRef.current?.focus() }}
                    className="px-3 py-2 text-xs text-left bg-[#1e293b] border border-[#334155] rounded-xl text-[#94a3b8] hover:border-[#ff8c42]/40 hover:text-white transition-all"
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <>
              {messages.map((msg, i) => (
                <div key={msg.id || i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[80%] ${msg.role === 'user' ? 'order-1' : 'order-2'}`}>
                    {msg.role === 'assistant' && (
                      <div className="flex items-center gap-2 mb-1.5">
                        <div className="w-5 h-5 rounded-full bg-[#ff8c42]/20 border border-[#ff8c42]/30 flex items-center justify-center">
                          <svg width="10" height="10" viewBox="0 0 32 32" fill="none">
                            <polygon points="16,2 30,28 2,28" fill="none" stroke="#ff8c42" strokeWidth="3" strokeLinejoin="round"/>
                          </svg>
                        </div>
                        <span className="text-xs text-[#475569]">Nova AI</span>
                        {msg.timestamp && <span className="text-xs text-[#334155]">{formatDate(msg.timestamp)}</span>}
                      </div>
                    )}
                    <div
                      className={`px-4 py-3 rounded-2xl text-sm leading-relaxed ${
                        msg.role === 'user'
                          ? 'bg-[#ff8c42]/10 border border-[#ff8c42]/20 text-white'
                          : 'bg-[#1e293b] border border-[#334155] text-[#e2e8f0]'
                      }`}
                    >
                      {msg.role === 'assistant' ? (
                        <div
                          className="prose-chat"
                          dangerouslySetInnerHTML={{ __html: parseMarkdown(msg.content) }}
                        />
                      ) : (
                        <p className="whitespace-pre-wrap">{msg.content}</p>
                      )}
                    </div>
                    {msg.role === 'user' && msg.timestamp && (
                      <p className="text-xs text-[#334155] text-right mt-1">{formatDate(msg.timestamp)}</p>
                    )}
                  </div>
                </div>
              ))}

              {loading && (
                <div className="flex justify-start">
                  <div className="bg-[#1e293b] border border-[#334155] rounded-2xl px-4 py-3">
                    <div className="flex gap-1.5">
                      {[0, 1, 2].map(i => (
                        <div
                          key={i}
                          className="w-1.5 h-1.5 bg-[#ff8c42] rounded-full animate-bounce"
                          style={{ animationDelay: `${i * 0.15}s` }}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
          <div ref={bottomRef} />
        </div>

        {/* Input */}
        <div className="shrink-0 border-t border-[#334155] px-4 py-4 bg-[#0f172a]">
          <form onSubmit={sendMessage} className="flex gap-3 items-end">
            <div className="flex-1 bg-[#1e293b] border border-[#334155] rounded-2xl px-4 py-3 focus-within:border-[#ff8c42] transition-colors">
              <textarea
                ref={textareaRef}
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Escribí tu mensaje... (Enter para enviar, Shift+Enter para nueva línea)"
                rows={1}
                className="w-full bg-transparent text-white text-sm placeholder-[#475569] resize-none focus:outline-none max-h-40 overflow-y-auto"
                style={{ height: 'auto' }}
                onInput={e => {
                  const t = e.target as HTMLTextAreaElement
                  t.style.height = 'auto'
                  t.style.height = `${Math.min(t.scrollHeight, 160)}px`
                }}
              />
            </div>
            <button
              type="submit"
              disabled={loading || !input.trim()}
              className="w-10 h-10 bg-[#ff8c42] hover:bg-[#ff8c42]/90 disabled:opacity-40 disabled:cursor-not-allowed rounded-xl flex items-center justify-center transition-all shrink-0"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="22" y1="2" x2="11" y2="13" />
                <polygon points="22 2 15 22 11 13 2 9 22 2" />
              </svg>
            </button>
          </form>
        </div>
      </div>
    </>
  )
}
