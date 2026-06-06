'use client'
import { usePageTitle } from '@/lib/usePageTitle'

import { useEffect, useRef, useState, useCallback } from 'react'
import Header from '@/components/layout/Header'
import { formatDate } from '@/lib/utils'
import { Send, Sparkles, RefreshCw, Mic, MicOff, Trash2 } from 'lucide-react'

interface Message {
  role: 'user' | 'assistant'
  content: string
  timestamp?: string
  id?: string
}

interface SpeechRecognitionEvent extends Event {
  results: SpeechRecognitionResultList
  resultIndex: number
}
interface SpeechRecognitionErrorEvent extends Event {
  error: string
}
interface SpeechRecognitionInstance extends EventTarget {
  lang: string
  continuous: boolean
  interimResults: boolean
  start(): void
  stop(): void
  onresult: ((e: SpeechRecognitionEvent) => void) | null
  onerror:  ((e: SpeechRecognitionErrorEvent) => void) | null
  onend:    (() => void) | null
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

function parseMarkdown(text: string): string {
  // Extraer bloques de código antes de escapar, para preservarlos
  const codeBlocks: string[] = []
  const withPlaceholders = text.replace(/```(\w*)\n?([\s\S]*?)```/g, (_, _lang, code) => {
    codeBlocks.push(`<pre><code>${escapeHtml(code)}</code></pre>`)
    return `\x00CODE${codeBlocks.length - 1}\x00`
  })

  // Escapar el resto del HTML
  let safe = escapeHtml(withPlaceholders)

  // Restaurar bloques de código (ya escapados)
  safe = safe.replace(/\x00CODE(\d+)\x00/g, (_, i) => codeBlocks[parseInt(i)])

  return safe
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    .replace(/\*([^*]+)\*/g, '<em>$1</em>')
    .replace(/^### (.+)$/gm, '<h3>$1</h3>')
    .replace(/^## (.+)$/gm, '<h3>$1</h3>')
    .replace(/^- (.+)$/gm, '<li>$1</li>')
    .replace(/(<li>.*<\/li>\n?)+/gm, '<ul>$&</ul>')
    .replace(/\n\n/g, '</p><p>')
    .replace(/^(?!<[a-z])(.+)$/gm, '<p>$1</p>')
    .replace(/<p><\/p>/g, '')
}

const SUGGESTIONS = [
  'Creá un cliente nuevo llamado Marca X',
  'Creá una tarea urgente: revisar propuesta mañana',
  '¿Cuántos proyectos activos tenemos?',
  'Creá una factura de $50.000 para el cliente actual',
]

export default function ChatPage() {
  usePageTitle('Chat IA')
  const [messages, setMessages]             = useState<Message[]>([])
  const [input, setInput]                   = useState('')
  const [loading, setLoading]               = useState(false)
  const [loadingHistory, setLoadingHistory] = useState(true)

  // Voz
  const [isListening, setIsListening]       = useState(false)
  const [interim, setInterim]               = useState('')
  const [voiceError, setVoiceError]         = useState('')
  const [voiceSupported, setVoiceSupported] = useState(false)
  const recognitionRef   = useRef<SpeechRecognitionInstance | null>(null)
  const inputBeforeVoice = useRef('')
  const shouldRestartRef = useRef(false)

  const bottomRef   = useRef<HTMLDivElement>(null)
  const textRef     = useRef<HTMLTextAreaElement>(null)
  const loadedRef   = useRef(false)

  useEffect(() => {
    const SR = (window as unknown as Record<string, unknown>).SpeechRecognition
                || (window as unknown as Record<string, unknown>).webkitSpeechRecognition
    setVoiceSupported(!!SR)
  }, [])

  async function loadHistory() {
    setLoadingHistory(true)
    try {
      const res = await fetch('/api/chat?limit=50')
      const { history } = await res.json()
      const msgs: Message[] = []
      for (const item of (history || [])) {
        const ts = item.created_at || item.timestamp
        msgs.push({ role: 'user',      content: item.message,  timestamp: ts, id: item.id + '_u' })
        msgs.push({ role: 'assistant', content: item.response, timestamp: ts, id: item.id + '_a' })
      }
      setMessages(msgs)
    } catch {
      // silently fail
    }
    setLoadingHistory(false)
    setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 100)
  }

  async function clearHistory() {
    if (!confirm('¿Borrar todo el historial de chat?')) return
    setMessages([])
  }

  useEffect(() => {
    if (loadedRef.current) return
    loadedRef.current = true
    loadHistory()
  }, [])

  async function send(e?: React.FormEvent, overrideText?: string) {
    e?.preventDefault()
    const text = (overrideText ?? input).trim()
    if (!text || loading) return

    setInput('')
    setInterim('')
    setLoading(true)

    const userMsg: Message = { role: 'user', content: text, timestamp: new Date().toISOString() }
    setMessages(p => [...p, userMsg])
    setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 50)

    const historyForAPI = messages.slice(-20).map(m => ({ role: m.role, content: m.content }))

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text, history: historyForAPI }),
      })
      const { response, error } = await res.json()
      setMessages(p => [...p, {
        role: 'assistant',
        content: error ? `Error: ${error}` : response,
        timestamp: new Date().toISOString(),
      }])
    } catch {
      setMessages(p => [...p, { role: 'assistant', content: 'Error de conexión.', timestamp: new Date().toISOString() }])
    }

    setLoading(false)
    setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 100)
  }

  function onKey(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send() }
  }

  const stopListening = useCallback(() => {
    shouldRestartRef.current = false
    recognitionRef.current?.stop()
    recognitionRef.current = null
    setIsListening(false)
    setInterim('')
    setVoiceError('')
  }, [])

  const createRecognition = useCallback(() => {
    const SR = (window as unknown as Record<string, unknown>).SpeechRecognition
             || (window as unknown as Record<string, unknown>).webkitSpeechRecognition
    if (!SR) return null

    const recognition = new (SR as new () => SpeechRecognitionInstance)()
    recognition.lang           = 'es-AR'
    recognition.continuous     = false
    recognition.interimResults = true

    recognition.onresult = (e: SpeechRecognitionEvent) => {
      let interimText = ''; let finalText = ''
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const t = e.results[i][0].transcript
        if (e.results[i].isFinal) finalText   += t
        else                       interimText += t
      }
      if (finalText) {
        const newInput = (inputBeforeVoice.current + ' ' + finalText).trim()
        setInput(newInput)
        inputBeforeVoice.current = newInput
        setInterim('')
      } else {
        setInterim(interimText)
      }
    }

    recognition.onerror = (e: SpeechRecognitionErrorEvent) => {
      if (e.error === 'aborted' || e.error === 'no-speech') return
      shouldRestartRef.current = false
      setIsListening(false)
      setInterim('')
      if (e.error === 'network')      setVoiceError('Sin conexión al servicio de voz.')
      else if (e.error === 'not-allowed') setVoiceError('Permiso de micrófono denegado.')
      else                                setVoiceError(`Error de voz: ${e.error}`)
      setTimeout(() => setVoiceError(''), 4000)
    }

    recognition.onend = () => {
      setInterim('')
      shouldRestartRef.current = false
      setIsListening(false)
      recognitionRef.current = null
    }

    return recognition
  }, [])

  const startListening = useCallback(() => {
    setVoiceError('')
    inputBeforeVoice.current = input
    shouldRestartRef.current = true
    const recognition = createRecognition()
    if (!recognition) return
    recognitionRef.current = recognition
    recognition.start()
    setIsListening(true)
  }, [input, createRecognition])

  function toggleVoice() {
    if (isListening) stopListening()
    else             startListening()
  }

  function autoResize(el: HTMLTextAreaElement) {
    el.style.height = 'auto'
    el.style.height = `${Math.min(el.scrollHeight, 160)}px`
  }

  return (
    <>
      <Header
        title="IA Chat"
        subtitle="Claude — Asistente Nova Agency"
        actions={
          <div className="flex items-center gap-2">
            {messages.length > 0 && (
              <button
                onClick={clearHistory}
                className="flex items-center gap-1.5 px-3 py-1.5 text-[12px] bg-white/[.03] hover:bg-red-500/10 text-[var(--text-3)] hover:text-red-400 border border-[rgba(255,255,255,0.07)] hover:border-red-500/20 rounded-lg transition-all"
              >
                <Trash2 size={11} /> Limpiar
              </button>
            )}
            <button
              onClick={loadHistory}
              className="flex items-center gap-1.5 px-3 py-1.5 text-[12px] bg-white/[.03] hover:bg-white/[.06] text-[var(--text-3)] hover:text-[var(--text-2)] border border-[rgba(255,255,255,0.07)] rounded-lg transition-all"
            >
              <RefreshCw size={11} /> Historial
            </button>
          </div>
        }
      />

      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-6 py-6 space-y-5">
          {loadingHistory ? (
            <div className="flex items-center justify-center h-full">
              <div className="flex flex-col items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-[rgba(245,158,11,0.08)] border border-[rgba(245,158,11,0.15)] flex items-center justify-center animate-pulse">
                  <Sparkles size={14} className="text-[var(--amber)]" />
                </div>
                <p className="text-[var(--text-3)] text-[12px]">Cargando historial...</p>
              </div>
            </div>
          ) : messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full gap-6 max-w-lg mx-auto animate-fade-up">
              <div className="relative">
                <div className="w-16 h-16 rounded-2xl bg-[rgba(245,158,11,0.1)] border border-[rgba(245,158,11,0.2)] flex items-center justify-center animate-float">
                  <Sparkles size={24} className="text-[var(--amber)]" />
                </div>
                <div className="absolute inset-0 rounded-2xl bg-[rgba(245,158,11,0.15)] blur-xl -z-10 animate-glow" />
              </div>
              <div className="text-center">
                <p className="text-white font-bold text-[18px] mb-1" style={{ fontFamily: 'var(--font-display)' }}>Nova IA</p>
                <p className="text-[var(--text-3)] text-[13px] leading-relaxed">
                  Asistente consultivo. Preguntame sobre clientes, proyectos, métricas o automatizaciones.
                </p>
                {voiceSupported && (
                  <p className="text-[var(--text-4)] text-[11px] mt-2 flex items-center justify-center gap-1">
                    <Mic size={10} /> Podés hablarle usando el micrófono
                  </p>
                )}
              </div>
              <div className="grid grid-cols-2 gap-2 w-full">
                {SUGGESTIONS.map(s => (
                  <button
                    key={s}
                    onClick={() => { setInput(s); textRef.current?.focus() }}
                    className="px-4 py-3 text-[12px] text-left bg-white/[.03] border border-[rgba(255,255,255,0.07)] rounded-xl text-[var(--text-3)] hover:border-[rgba(245,158,11,0.25)] hover:text-[var(--text-2)] hover:bg-white/[.05] transition-all"
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <>
              {messages.map((msg, i) => (
                <div
                  key={msg.id || i}
                  className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} gap-3 animate-fade-up`}
                  style={{ animationDelay: `${Math.min(i * 0.03, 0.3)}s` }}
                >
                  {msg.role === 'assistant' && (
                    <div className="w-7 h-7 rounded-xl bg-[rgba(245,158,11,0.12)] border border-[rgba(245,158,11,0.2)] flex items-center justify-center shrink-0 mt-1">
                      <svg width="11" height="11" viewBox="0 0 20 20" fill="none">
                        <polygon points="10,1 19,18 1,18" fill="none" stroke="#f59e0b" strokeWidth="2.5" strokeLinejoin="round"/>
                      </svg>
                    </div>
                  )}
                  <div className="max-w-[78%]">
                    {msg.role === 'assistant' && (
                      <p className="text-[10px] text-[var(--text-4)] mb-1.5 ml-1">Nova IA · {msg.timestamp ? formatDate(msg.timestamp) : ''}</p>
                    )}
                    <div className={`px-4 py-3.5 rounded-2xl text-[13px] leading-relaxed ${
                      msg.role === 'user'
                        ? 'bg-[rgba(245,158,11,0.08)] border border-[rgba(245,158,11,0.15)] text-white rounded-tr-sm'
                        : 'bg-[#111] border border-[rgba(255,255,255,0.08)] text-[var(--text-2)] rounded-tl-sm'
                    }`}>
                      {msg.role === 'assistant'
                        ? <div className="prose-chat" dangerouslySetInnerHTML={{ __html: parseMarkdown(msg.content) }} />
                        : <p className="whitespace-pre-wrap">{msg.content}</p>
                      }
                    </div>
                    {msg.role === 'user' && msg.timestamp && (
                      <p className="text-[10px] text-[var(--text-4)] text-right mt-1.5 mr-1">{formatDate(msg.timestamp)}</p>
                    )}
                  </div>
                </div>
              ))}

              {loading && (
                <div className="flex items-start gap-3 animate-fade-in">
                  <div className="w-7 h-7 rounded-xl bg-[rgba(245,158,11,0.12)] border border-[rgba(245,158,11,0.2)] flex items-center justify-center shrink-0 animate-pulse">
                    <svg width="11" height="11" viewBox="0 0 20 20" fill="none">
                      <polygon points="10,1 19,18 1,18" fill="none" stroke="#f59e0b" strokeWidth="2.5" strokeLinejoin="round"/>
                    </svg>
                  </div>
                  <div className="bg-[#111] border border-[rgba(255,255,255,0.08)] rounded-2xl rounded-tl-sm px-5 py-4">
                    <div className="flex gap-1.5">
                      {[0,1,2].map(i => (
                        <div
                          key={i}
                          className="w-1.5 h-1.5 rounded-full bg-[var(--amber)]"
                          style={{ animation: `bounce-dots 1.2s ease-in-out ${i * 0.2}s infinite` }}
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

        {/* Input area */}
        <div className="shrink-0 px-6 pb-6 pt-3 border-t border-[rgba(255,255,255,0.06)]">
          {voiceError && (
            <div className="flex items-center gap-2 mb-2 px-1">
              <span className="text-[12px] text-red-400">{voiceError}</span>
            </div>
          )}

          {isListening && (
            <div className="flex items-center gap-2 mb-2 px-1">
              <div className="flex gap-0.5 items-end h-4">
                {[0,1,2,3,4].map(i => (
                  <div
                    key={i}
                    className="w-1 bg-red-400 rounded-full"
                    style={{ height: `${[40,70,55,85,45][i]}%`, animation: `pulse-dot 1s ease-in-out ${i * 0.1}s infinite` }}
                  />
                ))}
              </div>
              <span className="text-[12px] text-red-400 font-medium">Escuchando...</span>
              {interim && (
                <span className="text-[12px] text-[var(--text-3)] italic truncate max-w-xs">{interim}</span>
              )}
            </div>
          )}

          <form onSubmit={send} className="flex gap-2 items-end">
            <div className={`flex-1 bg-[rgba(255,255,255,0.03)] border rounded-2xl px-4 py-3 transition-all ${
              isListening
                ? 'border-red-500/30 shadow-[0_0_0_3px_rgba(239,68,68,0.05)]'
                : 'border-[rgba(255,255,255,0.08)] focus-within:border-[rgba(245,158,11,0.35)] focus-within:shadow-[0_0_0_3px_rgba(245,158,11,0.05)]'
            }`}>
              <textarea
                ref={textRef}
                value={input + (interim ? ' ' + interim : '')}
                onChange={e => {
                  if (!isListening) {
                    setInput(e.target.value)
                    autoResize(e.target)
                  }
                }}
                onKeyDown={onKey}
                placeholder={isListening ? 'Hablá... el mic para solo, después enviás vos' : 'Escribí o usá el micrófono... (Enter para enviar)'}
                rows={1}
                readOnly={isListening}
                className="w-full bg-transparent text-white text-[13px] placeholder-[var(--text-4)] resize-none focus:outline-none max-h-40"
                onInput={e => autoResize(e.target as HTMLTextAreaElement)}
              />
            </div>

            {voiceSupported && (
              <button
                type="button"
                onClick={toggleVoice}
                title={isListening ? 'Detener grabación' : 'Hablar'}
                className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 transition-all ${
                  isListening
                    ? 'bg-red-500 hover:bg-red-600 shadow-[0_0_20px_rgba(239,68,68,0.4)] animate-pulse'
                    : 'bg-white/[.04] border border-[rgba(255,255,255,0.08)] text-[var(--text-3)] hover:border-[rgba(245,158,11,0.3)] hover:text-[var(--amber)]'
                }`}
              >
                {isListening ? <MicOff size={14} className="text-white" /> : <Mic size={14} />}
              </button>
            )}

            <button
              type="submit"
              disabled={loading || !(input.trim() || interim.trim())}
              className="w-11 h-11 btn-primary rounded-2xl flex items-center justify-center shrink-0 disabled:opacity-30"
            >
              <Send size={14} className="text-black -translate-x-px" />
            </button>
          </form>

          <p className="text-[10px] text-[var(--text-4)] text-center mt-2">
            Enter para enviar · Shift+Enter nueva línea{voiceSupported ? ' · Micrófono disponible' : ''}
          </p>
        </div>
      </div>
    </>
  )
}
