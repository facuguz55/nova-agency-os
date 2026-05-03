'use client'

import { useEffect, useRef, useState } from 'react'
import { Mic, Loader2, FileText, Trash2 } from 'lucide-react'

interface Note { id: string; title: string; content: string; created_at: string }

function useAudioRecorder() {
  const recorder = useRef<MediaRecorder | null>(null)
  const chunks   = useRef<Blob[]>([])

  async function start() {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
    recorder.current = new MediaRecorder(stream)
    chunks.current = []
    recorder.current.ondataavailable = e => { if (e.data.size > 0) chunks.current.push(e.data) }
    recorder.current.start()
  }

  function stop(): Promise<Blob> {
    return new Promise(resolve => {
      recorder.current!.onstop = () => {
        const blob = new Blob(chunks.current, { type: recorder.current!.mimeType || 'audio/webm' })
        recorder.current!.stream.getTracks().forEach(t => t.stop())
        resolve(blob)
      }
      recorder.current!.stop()
    })
  }

  return { start, stop }
}

export default function NotasPage() {
  const [notes, setNotes]       = useState<Note[]>([])
  const [recording, setRecording] = useState(false)
  const [processing, setProcessing] = useState(false)
  const [status, setStatus]     = useState('')
  const [secs, setSecs]         = useState(0)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const { start, stop } = useAudioRecorder()

  useEffect(() => {
    loadNotes()
  }, [])

  async function loadNotes() {
    const res = await fetch('/api/notes?limit=20')
    const data = await res.json()
    setNotes(data.notes || data || [])
  }

  async function handleMicStart() {
    try {
      await start()
      setRecording(true)
      setSecs(0)
      timerRef.current = setInterval(() => setSecs(s => s + 1), 1000)
    } catch {
      alert('No se pudo acceder al micrófono')
    }
  }

  async function handleMicStop() {
    if (timerRef.current) clearInterval(timerRef.current)
    setRecording(false)
    setProcessing(true)
    setStatus('Transcribiendo...')

    try {
      const blob = await stop()
      const form = new FormData()
      form.append('audio', blob, 'audio.webm')
      const tres = await fetch('/api/transcribe', { method: 'POST', body: form })
      const { text } = await tres.json()

      if (!text) throw new Error('Sin texto')

      setStatus('Procesando con IA...')
      // Claude procesa la nota: genera título + contenido organizado
      const cres = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: `Tengo esta nota de voz: "${text}"\n\nExtrae un título breve (máx 8 palabras) y reformatá el contenido de forma clara y organizada. Responde SOLO en este formato JSON exacto:\n{"title":"...","content":"..."}`,
          history: [],
        }),
      })
      const cdata = await cres.json()

      let title = text.slice(0, 60)
      let content = text

      try {
        const match = cdata.response?.match(/\{[\s\S]*\}/)
        if (match) {
          const parsed = JSON.parse(match[0])
          title   = parsed.title   || title
          content = parsed.content || content
        }
      } catch {}

      setStatus('Guardando...')
      await fetch('/api/notes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, content }),
      })

      setStatus('')
      await loadNotes()
    } catch (e) {
      setStatus('Error — intentá de nuevo')
      setTimeout(() => setStatus(''), 3000)
    }

    setProcessing(false)
  }

  async function deleteNote(id: string) {
    await fetch(`/api/notes/${id}`, { method: 'DELETE' })
    setNotes(n => n.filter(x => x.id !== id))
  }

  const fmtSecs = (s: number) => `${Math.floor(s / 60).toString().padStart(2, '0')}:${(s % 60).toString().padStart(2, '0')}`

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <header
        className="shrink-0 px-4 border-b border-[#1a2d45] bg-[#0c1628] flex items-center"
        style={{ paddingTop: `calc(env(safe-area-inset-top) + 12px)`, paddingBottom: '12px' }}
      >
        <p className="text-sm font-semibold text-white">Notas rápidas</p>
      </header>

      {/* Record button */}
      <div className="shrink-0 flex flex-col items-center justify-center py-10 gap-4">
        <button
          onPointerDown={handleMicStart}
          onPointerUp={!processing ? handleMicStop : undefined}
          onPointerLeave={recording ? handleMicStop : undefined}
          disabled={processing}
          className={`w-24 h-24 rounded-full flex items-center justify-center transition-all select-none ${
            recording
              ? 'bg-red-500 scale-110 shadow-[0_0_40px_rgba(239,68,68,.4)]'
              : processing
                ? 'bg-[#1a2d45] cursor-not-allowed'
                : 'bg-[#0f1d30] border-2 border-[#f97316]/40 active:scale-95 active:bg-[#f97316]/10'
          }`}
        >
          {processing
            ? <Loader2 size={32} className="animate-spin text-[#f97316]" />
            : <Mic size={32} className={recording ? 'text-white' : 'text-[#f97316]'} />
          }
        </button>

        <p className="text-sm text-[#4a6080]">
          {recording
            ? <span className="text-red-400 font-mono">{fmtSecs(secs)} — soltá para guardar</span>
            : processing
              ? <span className="text-[#f97316]">{status}</span>
              : 'Mantené para grabar'}
        </p>
      </div>

      {/* Notes list */}
      <div className="flex-1 overflow-y-auto px-4 pb-4 space-y-2">
        {notes.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 gap-2">
            <FileText size={32} className="text-[#1a2d45]" />
            <p className="text-[#334155] text-sm">No hay notas todavía</p>
          </div>
        ) : notes.map(n => (
          <div key={n.id} className="bg-[#0f1d30] border border-[#1a2d45] rounded-xl p-4 flex items-start gap-3">
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate">{n.title}</p>
              <p className="text-xs text-[#4a6080] mt-1 line-clamp-2">{n.content}</p>
              <p className="text-[10px] text-[#253f60] mt-1.5">
                {new Date(n.created_at).toLocaleDateString('es-AR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
              </p>
            </div>
            <button
              onClick={() => deleteNote(n.id)}
              className="shrink-0 p-1.5 text-[#253f60] hover:text-red-400 transition-colors"
            >
              <Trash2 size={14} />
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}
