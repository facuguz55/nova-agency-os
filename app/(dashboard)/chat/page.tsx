'use client'
import { usePageTitle } from '@/lib/usePageTitle'

import { useEffect, useRef, useState, useCallback } from 'react'
import Header from '@/components/layout/Header'
import { formatDate } from '@/lib/utils'
import { Send, Sparkles, RefreshCw, Mic, MicOff } from 'lucide-react'

interface Message {
  role: 'user' | 'assistant'; content: string; timestamp?: string; id?: string
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
  onerror: ((e: SpeechRecognitionErrorEvent) => void) | null
  onend: (() => void) | null
}

// ─── Wizard de proyectos ────────────────────────────────────────────────────
interface WizardQuestion { key: string; q: string; opts: string[] }
const WIZARD_QUESTIONS: WizardQuestion[] = [
  { key: 'tipo',        q: '¿Qué tipo de proyecto es?',        opts: ['Redes Sociales', 'Sitio Web / App', 'Diseño Gráfico', 'Marketing Digital', 'Branding', 'Otro'] },
  { key: 'objetivo',    q: '¿Cuál es el objetivo principal?',  opts: ['Más seguidores', 'Más ventas', 'Mejorar imagen de marca', 'Lanzar un producto', 'Presencia digital', 'Otro'] },
  { key: 'presupuesto', q: '¿Cuál es el presupuesto?',         opts: ['Menos de $100k', '$100k – $500k', '$500k – $1M', 'Más de $1M', 'No definido'] },
  { key: 'plazo',       q: '¿En qué plazo lo necesitás?',      opts: ['1 mes', '2–3 meses', '3–6 meses', 'Más de 6 meses'] },
]

function isWizardIntent(text: string): boolean {
  const t = text.toLowerCase()
  // Frases directas
  const direct = [
    'haceme preguntas', 'hacer preguntas', 'armar proyecto', 'planear proyecto',
    'plan de proyecto', 'quiero armar', 'modo proyecto', 'crear proyecto',
    'nuevo proyecto', 'arranquemos', 'arrancamos', 'empecemos', 'empezamos',
    'iniciemos', 'lanzar proyecto', 'quiero lanzar', 'tengo un cliente',
    'cliente nuevo', 'nueva cuenta', 'propuesta de proyecto', 'propuesta para',
    'quiero proponer', 'abrir un proyecto',
  ]
  if (direct.some(d => t.includes(d))) return true
  // "proyecto" + palabra de acción
  if (t.includes('proyecto')) {
    const acciones = ['arranc', 'empez', 'inici', 'cre', 'arm', 'plan', 'lanz', 'abr', 'nuev', 'propon']
    if (acciones.some(a => t.includes(a))) return true
  }
  return false
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
    .replace(/(<li>.*<\/li>\n?)+/gm, '<ul>$&</ul>')
    .replace(/\n\n/g, '</p><p>')
    .replace(/^(?!<[a-z])(.+)$/gm, '<p>$1</p>')
    .replace(/<p><\/p>/g, '')
}

const SUGGESTIONS = [
  '¿Cuántos clientes activos tenemos?',
  '¿Qué proyectos están en curso?',
  'Mostrá las últimas métricas de Instagram',
  '¿Hay workflows fallando en n8n?',
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

  // Wizard de proyectos
  const [wizard, setWizard] = useState<{ step: number; answers: Record<string, string> } | null>(null)

  const bottomRef = useRef<HTMLDivElement>(null)
  const textRef   = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    const SR = (window as unknown as Record<string, unknown>).SpeechRecognition
                || (window as unknown as Record<string, unknown>).webkitSpeechRecognition
    setVoiceSupported(!!SR)
  }, [])

  async function loadHistory() {
    setLoadingHistory(true)
    const res = await fetch('/api/chat?limit=50')
    const { history } = await res.json()
    const msgs: Message[] = []
    for (const item of history) {
      msgs.push({ role: 'user',      content: item.message,  timestamp: item.timestamp, id: item.id + '_u' })
      msgs.push({ role: 'assistant', content: item.response, timestamp: item.timestamp, id: item.id + '_a' })
    }
    setMessages(msgs)
    setLoadingHistory(false)
    setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 100)
  }

  useEffect(() => { loadHistory() }, [])

  async function send(e?: React.FormEvent, overrideText?: string) {
    e?.preventDefault()
    const text = (overrideText ?? input).trim()
    if (!text || loading) return

    const isWizardTrigger = !wizard && isWizardIntent(text)

    setInput('')
    setInterim('')

    const userMsg: Message = { role: 'user', content: text, timestamp: new Date().toISOString() }
    setMessages(p => [...p, userMsg])
    setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 50)

    if (isWizardTrigger) {
      // Activar wizard sin llamar a la API
      const activationMsg: Message = {
        role: 'assistant',
        content: '¡Buenísimo! Voy a hacerte algunas preguntas rápidas para armar el plan del proyecto. Elegí la opción que mejor aplique.',
        timestamp: new Date().toISOString(),
      }
      setMessages(p => [...p, activationMsg])
      setWizard({ step: 0, answers: {} })
      setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 100)
      return
    }

    setLoading(true)
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

  async function handleWizardOption(option: string) {
    if (!wizard) return
    const currentQ = WIZARD_QUESTIONS[wizard.step]
    const newAnswers = { ...wizard.answers, [currentQ.key]: option }

    // Mostrar respuesta del usuario en el chat
    const userMsg: Message = { role: 'user', content: option, timestamp: new Date().toISOString() }
    setMessages(p => [...p, userMsg])
    setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 50)

    const nextStep = wizard.step + 1

    if (nextStep < WIZARD_QUESTIONS.length) {
      // Avanzar al siguiente paso
      const nextQ = WIZARD_QUESTIONS[nextStep]
      const questionMsg: Message = {
        role: 'assistant',
        content: nextQ.q,
        timestamp: new Date().toISOString(),
      }
      setMessages(p => [...p, questionMsg])
      setWizard({ step: nextStep, answers: newAnswers })
    } else {
      // Todas las preguntas respondidas — compilar y enviar a Claude
      setWizard(null)
      setLoading(true)

      const compiled = `Armá el plan de proyecto con esta información:
- Tipo de proyecto: ${newAnswers.tipo}
- Objetivo principal: ${newAnswers.objetivo}
- Presupuesto aproximado: ${newAnswers.presupuesto}
- Plazo: ${newAnswers.plazo}

Generá un plan detallado con etapas, tareas clave y recomendaciones de estrategia para Nova Agency.`

      const historyForAPI = messages.slice(-20).map(m => ({ role: m.role, content: m.content }))

      try {
        const res = await fetch('/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ message: compiled, history: historyForAPI }),
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
    }

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
      let interimText = ''
      let finalText   = ''
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
      if (e.error === 'network') {
        setVoiceError('Sin conexión al servicio de voz. Verificá tu red.')
      } else if (e.error === 'not-allowed') {
        setVoiceError('Permiso de micrófono denegado.')
      } else {
        setVoiceError(`Error de voz: ${e.error}`)
      }
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

  const currentWizardQ = wizard ? WIZARD_QUESTIONS[wizard.step] : null

  return (
    <>
      <Header
        title="IA Chat"
        subtitle="Claude Haiku — Asistente de Nova Agency"
        actions={
          <div className="flex items-center gap-2">
            {wizard && (
              <button
                onClick={() => setWizard(null)}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-[#f97316]/10 hover:bg-[#f97316]/20 text-[#f97316] border border-[#f97316]/25 rounded-xl transition-all"
              >
                Salir del modo proyecto
              </button>
            )}
            <button onClick={loadHistory} className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-[#111e33] hover:bg-[#1a2d4a] text-[#64748b] hover:text-white border border-[#1e2f4a] rounded-xl transition-all">
              <RefreshCw size={11} />
              Historial
            </button>
          </div>
        }
      />

      <div className="flex-1 flex flex-col overflow-hidden bg-grid">
        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-6 py-6 space-y-5">
          {loadingHistory ? (
            <div className="flex items-center justify-center h-full">
              <p className="text-[#334155] text-sm">Cargando historial...</p>
            </div>
          ) : messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full gap-6 max-w-lg mx-auto">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#ff8c42] to-[#ff5f1a] flex items-center justify-center shadow-[0_0_40px_rgba(255,140,66,.35)]">
                <Sparkles size={24} className="text-white" />
              </div>
              <div className="text-center">
                <p className="text-white font-bold text-lg mb-1">Nova AI</p>
                <p className="text-[#475569] text-sm leading-relaxed">
                  Asistente consultivo. Preguntame sobre clientes, proyectos, métricas o automatizaciones.
                </p>
                <p className="text-[#2a3d56] text-xs mt-2">
                  Tip: escribí <span className="text-[#f97316]/70">&ldquo;haceme preguntas&rdquo;</span> para armar un plan de proyecto
                </p>
                {voiceSupported && (
                  <p className="text-[#334155] text-xs mt-2 flex items-center justify-center gap-1">
                    <Mic size={10} /> Podés hablarle usando el micrófono
                  </p>
                )}
              </div>
              <div className="grid grid-cols-2 gap-2 w-full">
                {SUGGESTIONS.map(s => (
                  <button
                    key={s}
                    onClick={() => { setInput(s); textRef.current?.focus() }}
                    className="px-4 py-3 text-xs text-left bg-[#0e1a2e] border border-[#1e2f4a] rounded-xl text-[#64748b] hover:border-[#ff8c42]/30 hover:text-[#94a3b8] hover:bg-[#111e33] transition-all"
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <>
              {messages.map((msg, i) => (
                <div key={msg.id || i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} gap-3`}>
                  {msg.role === 'assistant' && (
                    <div className="w-7 h-7 rounded-xl bg-gradient-to-br from-[#ff8c42] to-[#ff5f1a] flex items-center justify-center shrink-0 mt-1 shadow-[0_0_10px_rgba(255,140,66,.3)]">
                      <svg width="12" height="12" viewBox="0 0 20 20" fill="none">
                        <polygon points="10,1 19,18 1,18" fill="none" stroke="white" strokeWidth="2.5" strokeLinejoin="round"/>
                      </svg>
                    </div>
                  )}
                  <div className="max-w-[78%]">
                    {msg.role === 'assistant' && (
                      <p className="text-[11px] text-[#334155] mb-1.5 ml-1">Nova AI · {msg.timestamp ? formatDate(msg.timestamp) : ''}</p>
                    )}
                    <div className={`px-4 py-3.5 rounded-2xl text-sm leading-relaxed ${
                      msg.role === 'user'
                        ? 'bg-[#ff8c42]/10 border border-[#ff8c42]/20 text-white rounded-tr-sm shadow-[0_0_16px_rgba(255,140,66,.08)]'
                        : 'bg-[#0e1a2e] border border-[#1e2f4a] text-[#e2e8f0] rounded-tl-sm'
                    }`}>
                      {msg.role === 'assistant'
                        ? <div className="prose-chat" dangerouslySetInnerHTML={{ __html: parseMarkdown(msg.content) }} />
                        : <p className="whitespace-pre-wrap">{msg.content}</p>
                      }
                    </div>
                    {msg.role === 'user' && msg.timestamp && (
                      <p className="text-[11px] text-[#334155] text-right mt-1.5 mr-1">{formatDate(msg.timestamp)}</p>
                    )}
                  </div>
                </div>
              ))}

              {loading && (
                <div className="flex items-start gap-3">
                  <div className="w-7 h-7 rounded-xl bg-gradient-to-br from-[#ff8c42] to-[#ff5f1a] flex items-center justify-center shrink-0 shadow-[0_0_10px_rgba(255,140,66,.3)] animate-pulse">
                    <svg width="12" height="12" viewBox="0 0 20 20" fill="none"><polygon points="10,1 19,18 1,18" fill="none" stroke="white" strokeWidth="2.5" strokeLinejoin="round"/></svg>
                  </div>
                  <div className="bg-[#0e1a2e] border border-[#1e2f4a] rounded-2xl rounded-tl-sm px-5 py-4">
                    <div className="flex gap-1.5">
                      {[0,1,2].map(i => (
                        <div key={i} className="w-1.5 h-1.5 rounded-full bg-[#ff8c42] animate-bounce" style={{ animationDelay: `${i*0.12}s` }} />
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
          <div ref={bottomRef} />
        </div>

        {/* Wizard panel — aparece encima del input cuando está activo */}
        {currentWizardQ && !loading && (
          <div className="shrink-0 px-6 pb-3 pt-4 border-t border-[#1e2f4a] bg-[#080f1e]/90">
            {/* Progress */}
            <div className="flex items-center gap-2 mb-3">
              <div className="flex gap-1">
                {WIZARD_QUESTIONS.map((_, i) => (
                  <div
                    key={i}
                    className="h-1 rounded-full transition-all"
                    style={{
                      width: i === wizard!.step ? 20 : 8,
                      background: i < wizard!.step ? '#f97316' : i === wizard!.step ? '#ff8c42' : '#1e2f4a',
                    }}
                  />
                ))}
              </div>
              <span className="text-[10px] text-[#334155] ml-1">
                Pregunta {wizard!.step + 1} de {WIZARD_QUESTIONS.length}
              </span>
            </div>

            {/* Pregunta */}
            <p className="text-sm font-semibold text-white mb-3">{currentWizardQ.q}</p>

            {/* Opciones */}
            <div className="flex flex-wrap gap-2">
              {currentWizardQ.opts.map(opt => (
                <button
                  key={opt}
                  onClick={() => handleWizardOption(opt)}
                  className="px-3 py-2 text-xs font-medium rounded-xl border transition-all hover:border-[#ff8c42]/50 hover:bg-[#ff8c42]/8 hover:text-white active:scale-95"
                  style={{ background: '#0e1a2e', borderColor: '#1e2f4a', color: '#94a3b8' }}
                >
                  {opt}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Input area */}
        <div className="shrink-0 px-6 pb-6 pt-3 bg-[#080f1e]/80 backdrop-blur-sm border-t border-[#1e2f4a]">

          {voiceError && (
            <div className="flex items-center gap-2 mb-2 px-1">
              <span className="text-xs text-red-400">{voiceError}</span>
            </div>
          )}

          {isListening && (
            <div className="flex items-center gap-2 mb-2 px-1">
              <div className="flex gap-0.5 items-end h-4">
                {[0,1,2,3,4].map(i => (
                  <div
                    key={i}
                    className="w-1 bg-red-400 rounded-full animate-pulse"
                    style={{ height: `${[40, 70, 55, 85, 45][i]}%`, animationDelay: `${i * 0.1}s` }}
                  />
                ))}
              </div>
              <span className="text-xs text-red-400 font-medium">Escuchando...</span>
              {interim && (
                <span className="text-xs text-[#475569] italic truncate max-w-xs">{interim}</span>
              )}
            </div>
          )}

          <form onSubmit={send} className="flex gap-2 items-end">
            <div className={`flex-1 bg-[#0e1a2e] border rounded-2xl px-4 py-3 transition-all ${
              isListening
                ? 'border-red-500/40 shadow-[0_0_0_3px_rgba(239,68,68,.06)]'
                : 'border-[#1e2f4a] focus-within:border-[#ff8c42]/40 focus-within:shadow-[0_0_0_3px_rgba(255,140,66,.06)]'
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
                placeholder={
                  wizard
                    ? 'Elegí una opción de arriba o escribí tu respuesta...'
                    : isListening
                      ? 'Hablá... el mic para solo, después enviás vos'
                      : 'Escribí o usá el micrófono... (Enter para enviar)'
                }
                rows={1}
                readOnly={isListening}
                className="w-full bg-transparent text-white text-sm placeholder-[#334155] resize-none focus:outline-none max-h-40"
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
                    ? 'bg-red-500 hover:bg-red-600 shadow-[0_0_20px_rgba(239,68,68,.4)] animate-pulse'
                    : 'bg-[#0e1a2e] border border-[#1e2f4a] text-[#475569] hover:border-[#ff8c42]/40 hover:text-[#ff8c42]'
                }`}
              >
                {isListening ? <MicOff size={15} className="text-white" /> : <Mic size={15} />}
              </button>
            )}

            <button
              type="submit"
              disabled={loading || !(input.trim() || interim.trim())}
              className="w-11 h-11 btn-primary rounded-2xl flex items-center justify-center shrink-0 disabled:opacity-30"
            >
              <Send size={15} className="text-white -translate-x-px" />
            </button>
          </form>

          <p className="text-[10px] text-[#1e2f4a] text-center mt-2">
            Enter para enviar · Shift+Enter nueva línea{voiceSupported ? ' · Micrófono disponible' : ''}
          </p>
        </div>
      </div>
    </>
  )
}
