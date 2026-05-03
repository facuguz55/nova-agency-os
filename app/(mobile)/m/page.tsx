'use client'

import { useEffect, useRef, useState } from 'react'
import { Send, Mic, MicOff, Loader2 } from 'lucide-react'

interface Message { role: 'user' | 'assistant'; content: string }

function MdMessage({ text }: { text: string }) {
  const lines = text.split('\n')
  const nodes: React.ReactNode[] = []
  let i = 0

  const parseInline = (s: string): React.ReactNode => {
    const parts = s.split(/(\*\*.*?\*\*|\*.*?\*|`.*?`)/g)
    return parts.map((p, j) => {
      if (p.startsWith('**') && p.endsWith('**')) return <strong key={j} className="font-semibold text-white">{p.slice(2, -2)}</strong>
      if (p.startsWith('*')  && p.endsWith('*'))  return <em key={j} className="italic text-[#fb923c]">{p.slice(1, -1)}</em>
      if (p.startsWith('`')  && p.endsWith('`'))  return <code key={j} className="bg-white/10 px-1.5 py-0.5 rounded text-[11px] font-mono text-[#fb923c]">{p.slice(1, -1)}</code>
      return p
    })
  }

  while (i < lines.length) {
    const line = lines[i]

    // Code block
    if (line.startsWith('```')) {
      const codeLines: string[] = []
      i++
      while (i < lines.length && !lines[i].startsWith('```')) { codeLines.push(lines[i]); i++ }
      nodes.push(<pre key={i} className="bg-black/30 border border-white/10 rounded-xl p-3 my-2 overflow-x-auto"><code className="text-[12px] font-mono text-[#94a3b8] whitespace-pre">{codeLines.join('\n')}</code></pre>)
      i++; continue
    }

    // Heading
    if (line.startsWith('### ')) { nodes.push(<p key={i} className="font-bold text-white text-sm mt-2 mb-0.5">{parseInline(line.slice(4))}</p>); i++; continue }
    if (line.startsWith('## '))  { nodes.push(<p key={i} className="font-bold text-white text-sm mt-2 mb-0.5">{parseInline(line.slice(3))}</p>); i++; continue }
    if (line.startsWith('# '))   { nodes.push(<p key={i} className="font-bold text-white text-sm mt-2 mb-0.5">{parseInline(line.slice(2))}</p>); i++; continue }

    // Bullet list block
    if (line.match(/^[-•*] /)) {
      const items: string[] = []
      while (i < lines.length && lines[i].match(/^[-•*] /)) { items.push(lines[i].slice(2)); i++ }
      nodes.push(
        <ul key={i} className="my-1 space-y-0.5 pl-1">
          {items.map((it, j) => (
            <li key={j} className="flex gap-2"><span className="text-[#f97316] mt-1 shrink-0">•</span><span>{parseInline(it)}</span></li>
          ))}
        </ul>
      )
      continue
    }

    // Numbered list block
    if (line.match(/^\d+\. /)) {
      const items: string[] = []
      while (i < lines.length && lines[i].match(/^\d+\. /)) { items.push(lines[i].replace(/^\d+\. /, '')); i++ }
      nodes.push(
        <ol key={i} className="my-1 space-y-0.5 pl-1">
          {items.map((it, j) => (
            <li key={j} className="flex gap-2"><span className="text-[#f97316] shrink-0 font-medium">{j + 1}.</span><span>{parseInline(it)}</span></li>
          ))}
        </ol>
      )
      continue
    }

    // Empty line → spacer
    if (line.trim() === '') { nodes.push(<div key={i} className="h-1" />); i++; continue }

    // Normal paragraph
    nodes.push(<p key={i} className="leading-relaxed">{parseInline(line)}</p>)
    i++
  }

  return <div className="space-y-0.5 text-sm text-[#e2e8f0]">{nodes}</div>
}

// Detecta el MIME type soportado (iOS usa mp4, Android/Chrome usa webm)
function getSupportedMime(): string {
  const types = ['audio/webm;codecs=opus', 'audio/webm', 'audio/mp4', 'audio/ogg']
  for (const t of types) {
    try { if (MediaRecorder.isTypeSupported(t)) return t } catch {}
  }
  return ''
}

function mimeToExt(mime: string): string {
  if (mime.includes('mp4')) return 'm4a'
  if (mime.includes('ogg')) return 'ogg'
  return 'webm'
}

function useAudioRecorder() {
  const recorder = useRef<MediaRecorder | null>(null)
  const chunks   = useRef<Blob[]>([])
  const mime     = useRef('')

  async function start() {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false })
    mime.current = getSupportedMime()
    recorder.current = mime.current
      ? new MediaRecorder(stream, { mimeType: mime.current })
      : new MediaRecorder(stream)
    chunks.current = []
    recorder.current.ondataavailable = e => { if (e.data.size > 0) chunks.current.push(e.data) }
    recorder.current.start(100) // chunk cada 100ms para iOS
  }

  function stop(): Promise<{ blob: Blob; ext: string }> {
    return new Promise(resolve => {
      recorder.current!.onstop = () => {
        const finalMime = recorder.current!.mimeType || mime.current || 'audio/webm'
        const blob = new Blob(chunks.current, { type: finalMime })
        recorder.current!.stream.getTracks().forEach(t => t.stop())
        resolve({ blob, ext: mimeToExt(finalMime) })
      }
      recorder.current!.stop()
    })
  }

  return { start, stop }
}

type MicState = 'idle' | 'recording' | 'processing'

export default function MobileChatPage() {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput]       = useState('')
  const [loading, setLoading]   = useState(false)
  const [micState, setMicState] = useState<MicState>('idle')
  const [micError, setMicError] = useState('')
  const [secs, setSecs]         = useState(0)
  const bottomRef   = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const timerRef    = useRef<ReturnType<typeof setInterval> | null>(null)
  const { start, stop } = useAudioRecorder()

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'instant' })
  }, [messages, loading])

  function resizeTextarea() {
    const ta = textareaRef.current
    if (!ta) return
    ta.style.height = 'auto'
    ta.style.height = Math.min(ta.scrollHeight, 96) + 'px'
  }

  async function send(text: string) {
    if (!text.trim() || loading) return
    const userMsg: Message = { role: 'user', content: text.trim() }
    setMessages(m => [...m, userMsg])
    setInput('')
    setLoading(true)

    const history = messages.map(m => ({ role: m.role, content: m.content }))
    const res = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: text.trim(), history }),
    })
    const data = await res.json()
    setMessages(m => [...m, { role: 'assistant', content: data.response || data.error || 'Error' }])
    setLoading(false)
  }

  async function toggleMic() {
    if (micState === 'recording') {
      // Parar y enviar
      if (timerRef.current) clearInterval(timerRef.current)
      setMicState('processing')
      try {
        const { blob, ext } = await stop()
        const form = new FormData()
        form.append('audio', blob, `audio.${ext}`)
        const res  = await fetch('/api/transcribe', { method: 'POST', body: form })
        const data = await res.json()
        if (data.text) {
          await send(data.text)
        } else {
          setMicError('No se entendió — intentá de nuevo')
          setTimeout(() => setMicError(''), 3000)
        }
      } catch {
        setMicError('Error al procesar el audio')
        setTimeout(() => setMicError(''), 3000)
      }
      setMicState('idle')
      setSecs(0)
    } else if (micState === 'idle') {
      // Empezar a grabar
      setMicError('')
      try {
        await start()
        setMicState('recording')
        setSecs(0)
        timerRef.current = setInterval(() => setSecs(s => s + 1), 1000)
      } catch {
        setMicError('Permitir acceso al micrófono en Safari → Configuración')
        setTimeout(() => setMicError(''), 5000)
      }
    }
  }

  const fmtSecs = (s: number) => `${Math.floor(s / 60).toString().padStart(2, '0')}:${(s % 60).toString().padStart(2, '0')}`

  return (
    <div className="flex flex-col h-full overflow-hidden">

      {/* Header — nunca se mueve */}
      <header
        className="shrink-0 flex items-center gap-3 px-4 border-b border-[#1a2d45] bg-[#0c1628]"
        style={{ paddingTop: `calc(env(safe-area-inset-top) + 12px)`, paddingBottom: '12px' }}
      >
        <div className="w-8 h-8 rounded-lg bg-[#f97316] flex items-center justify-center shrink-0">
          <svg width="14" height="14" viewBox="0 0 20 20" fill="none">
            <polygon points="10,1 19,18 1,18" fill="none" stroke="white" strokeWidth="2.2" strokeLinejoin="round"/>
            <circle cx="10" cy="13" r="2.2" fill="white"/>
          </svg>
        </div>
        <div>
          <p className="text-sm font-semibold text-white">Nova IA</p>
          <p className="text-[11px] text-[#4a6080]">Asistente de Nova Agency</p>
        </div>
      </header>

      {/* Mensajes — área scrollable contenida */}
      <div className="flex-1 overflow-y-auto overscroll-contain px-4 py-4 space-y-4">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center min-h-full gap-3 text-center px-6">
            <div className="w-14 h-14 rounded-2xl bg-[#f97316]/10 border border-[#f97316]/20 flex items-center justify-center">
              <svg width="24" height="24" viewBox="0 0 20 20" fill="none">
                <polygon points="10,1 19,18 1,18" fill="none" stroke="#f97316" strokeWidth="2" strokeLinejoin="round"/>
                <circle cx="10" cy="13" r="2.2" fill="#f97316"/>
              </svg>
            </div>
            <p className="text-white font-semibold">¿En qué te ayudo hoy?</p>
            <p className="text-[#4a6080] text-sm">Escribí o grabá un audio para empezar</p>
          </div>
        )}

        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[86%] px-4 py-3 rounded-2xl ${
              m.role === 'user'
                ? 'bg-[#f97316] text-white rounded-br-sm text-sm leading-relaxed'
                : 'bg-[#0f1d30] border border-[#1a2d45] rounded-bl-sm'
            }`}>
              {m.role === 'user' ? m.content : <MdMessage text={m.content} />}
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex justify-start">
            <div className="bg-[#0f1d30] border border-[#1a2d45] px-4 py-3 rounded-2xl rounded-bl-sm flex items-center gap-2">
              <Loader2 size={14} className="animate-spin text-[#f97316]" />
              <span className="text-xs text-[#4a6080]">Pensando...</span>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input — nunca se mueve */}
      <div className="shrink-0 border-t border-[#1a2d45] bg-[#0c1628]">

        {/* Estado del mic */}
        {(micState !== 'idle' || micError) && (
          <div className={`px-4 py-2 flex items-center gap-2 text-xs ${micError ? 'text-red-400' : 'text-[#4a6080]'}`}>
            {micState === 'recording' && (
              <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse shrink-0" />
            )}
            {micState === 'processing' && (
              <Loader2 size={12} className="animate-spin text-[#f97316] shrink-0" />
            )}
            <span>
              {micError || (micState === 'recording' ? `Grabando ${fmtSecs(secs)} — tocá para enviar` : 'Procesando...')}
            </span>
          </div>
        )}

        <div className="px-3 py-3 flex items-end gap-2">
          {/* Textarea + enviar */}
          <div className="flex-1 flex items-end bg-[#0f1d30] border border-[#1a2d45] rounded-2xl px-4 py-2.5 gap-2">
            <textarea
              ref={textareaRef}
              value={input}
              onChange={e => { setInput(e.target.value); resizeTextarea() }}
              onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(input) } }}
              placeholder={micState === 'recording' ? 'Grabando...' : 'Mensaje...'}
              rows={1}
              inputMode="text"
              disabled={micState !== 'idle'}
              className="flex-1 bg-transparent text-sm text-[#e2e8f0] placeholder-[#334155] resize-none focus:outline-none disabled:opacity-40"
              style={{ height: '24px', maxHeight: '96px' }}
            />
            <button
              onClick={() => send(input)}
              disabled={!input.trim() || loading || micState !== 'idle'}
              className="shrink-0 w-8 h-8 rounded-xl bg-[#f97316] disabled:bg-[#1a2d45] flex items-center justify-center transition-colors"
            >
              <Send size={14} className="text-white" />
            </button>
          </div>

          {/* Botón micrófono — tap to start / tap to stop */}
          <button
            onClick={toggleMic}
            disabled={micState === 'processing' || loading}
            className={`shrink-0 w-12 h-12 rounded-2xl flex items-center justify-center transition-all active:scale-95 disabled:opacity-40 ${
              micState === 'recording'
                ? 'bg-red-500'
                : 'bg-[#0f1d30] border border-[#1a2d45]'
            }`}
          >
            {micState === 'processing'
              ? <Loader2 size={20} className="text-[#f97316] animate-spin" />
              : micState === 'recording'
                ? <MicOff size={20} className="text-white" />
                : <Mic size={20} className="text-[#64748b]" />
            }
          </button>
        </div>
      </div>
    </div>
  )
}
