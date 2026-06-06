'use client'
import { usePageTitle } from '@/lib/usePageTitle'
import { useEffect, useState, useRef } from 'react'
import Header from '@/components/layout/Header'
import { Button, Select, Textarea } from '@/components/ui/Input'

interface Client {
  id: string; name: string; status: string
  brand_color1: string | null; brand_color2: string | null; has_brand_colors: boolean
}
interface Project { id: string; name: string; client_id: string; status: string }
interface VideoJob {
  id: string; template: string; status: string; progress: number
  output_url: string | null; error: string | null; created_at: string; completed_at: string | null
  clients: { name: string } | null; projects: { name: string } | null
  props: { extra_info?: string; generated_slides?: unknown[] } | null
}

const TEMPLATES = [
  { value: 'prospecto',  emoji: '🎯', label: 'Captación',    desc: 'Presentá Nova a un potencial cliente — hook poderoso + por qué elegirnos' },
  { value: 'resultados', emoji: '📈', label: 'Resultados',   desc: 'Métricas reales del cliente — números, crecimiento, impacto concreto' },
  { value: 'servicio',   emoji: '⚡', label: 'Servicio',     desc: 'Explicá un servicio específico — qué es, cómo funciona y qué resuelve' },
  { value: 'propuesta',  emoji: '💰', label: 'Propuesta',    desc: 'Precio y paquetes para el cliente — claro, directo y con valor percibido' },
  { value: 'onboarding', emoji: '🤝', label: 'Bienvenida',   desc: 'Para nuevos clientes — cómo trabajamos, qué esperar, próximos pasos' },
  { value: 'proyecto',   emoji: '📊', label: 'Proyecto',     desc: 'Avance o resumen de un proyecto activo — logros y próximos pasos' },
  { value: 'trayecto',   emoji: '🚀', label: 'Historia Nova', desc: 'El origen y evolución de Nova Agency — recorrido, valores, visión' },
  { value: 'sesion',    emoji: '📝', label: 'Sesión de hoy', desc: 'Resumen de lo trabajado hoy — tareas, decisiones y próximos pasos' },
]

const STATUS_STYLES: Record<string, string> = {
  pending:   'bg-blue-500/10 text-blue-400 border-blue-500/20',
  rendering: 'bg-[var(--amber-dim)] text-[var(--amber)] border-[var(--amber)]/30',
  done:      'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  error:     'bg-red-500/10 text-red-400 border-red-500/20',
  cancelled: 'bg-white/5 text-[var(--text-3)] border-white/10',
}

const STATUS_LABELS: Record<string, string> = {
  pending: 'En cola', rendering: 'Renderizando...', done: 'Listo', error: 'Error', cancelled: 'Cancelado',
}

const BTN_ACTIVE   = 'border-[var(--amber)]/60 bg-[var(--amber-dim)] text-[var(--amber)]'
const BTN_INACTIVE = 'text-[var(--text-3)] hover:text-[var(--text-2)]'

export default function VideosPage() {
  usePageTitle('Videos')

  const [clients, setClients] = useState<Client[]>([])
  const [projects, setProjects] = useState<Project[]>([])
  const [jobs, setJobs] = useState<VideoJob[]>([])
  const [loading, setLoading] = useState(true)

  const [clientId, setClientId] = useState('')
  const [projectId, setProjectId] = useState('')
  const [template, setTemplate] = useState('prospecto')
  const [format, setFormat] = useState<'vertical' | 'square' | 'horizontal'>('vertical')
  const [totalDuration, setTotalDuration] = useState<number | null>(null)
  const [technicality, setTechnicality] = useState<'con' | 'sin'>('con')
  const [extraInfo, setExtraInfo] = useState('')
  const [brandColors, setBrandColors] = useState<string[]>([])
  const [hasBrandColors, setHasBrandColors] = useState(false)
  const [generating, setGenerating] = useState(false)

  const [extractUrl, setExtractUrl] = useState('')
  const [extracting, setExtracting] = useState(false)
  const [extractedColors, setExtractedColors] = useState<string[]>([])

  async function extractColors() {
    if (!extractUrl) return
    setExtracting(true)
    setExtractedColors([])
    try {
      const res = await fetch(`/api/extract-colors?url=${encodeURIComponent(extractUrl)}`)
      const { colors } = await res.json()
      setExtractedColors(colors || [])
    } finally {
      setExtracting(false)
    }
  }

  const [regenJobId, setRegenJobId] = useState<string | null>(null)
  const [regenInstructions, setRegenInstructions] = useState('')
  const [regening, setRegening] = useState(false)

  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null)

  async function loadAll() {
    const [jRes, cRes, pRes] = await Promise.all([
      fetch('/api/videos'),
      fetch('/api/clients'),
      fetch('/api/projects'),
    ])
    const { jobs: j } = await jRes.json()
    const { clients: c } = await cRes.json()
    const { projects: p } = await pRes.json()
    setJobs(j || [])
    setClients(c || [])
    setProjects(p || [])
    setLoading(false)
  }

  async function pollJobs() {
    const res = await fetch('/api/videos')
    const { jobs: j } = await res.json()
    setJobs(j || [])
  }

  useEffect(() => {
    loadAll()
    pollRef.current = setInterval(pollJobs, 4000)
    return () => { if (pollRef.current) clearInterval(pollRef.current) }
  }, [])

  function toggleColor(c: string, fromExtraction = false) {
    const isAdding = !brandColors.includes(c)
    setBrandColors(prev => prev.includes(c) ? prev.filter(x => x !== c) : [...prev, c])
    if (fromExtraction && isAdding) {
      setHasBrandColors(true)
      const newColors = [...brandColors, c]
      if (clientId) {
        fetch(`/api/clients/${clientId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            has_brand_colors: true,
            brand_color1: newColors[0] || null,
            brand_color2: newColors[1] || null,
          }),
        })
      }
    }
  }

  useEffect(() => {
    if (!clientId) return
    const client = clients.find(c => c.id === clientId)
    if (!client) return
    setHasBrandColors(client.has_brand_colors)
    const saved = [client.brand_color1, client.brand_color2].filter(Boolean) as string[]
    setBrandColors(client.has_brand_colors && saved.length ? saved : [])
    setExtractedColors([])
    setProjectId('')
  }, [clientId, clients])

  const clientProjects = projects.filter(p => p.client_id === clientId)

  async function generate() {
    if (!clientId || !template) return
    setGenerating(true)
    await fetch('/api/videos', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        client_id: clientId,
        project_id: projectId || null,
        template,
        format,
        total_duration_seconds: totalDuration,
        technicality,
        extra_info: extraInfo,
        brand_colors: hasBrandColors && brandColors.length ? brandColors : null,
        has_brand_colors: hasBrandColors,
      }),
    })
    setExtraInfo('')
    setGenerating(false)
    pollJobs()
  }

  async function cancelJob(jobId: string) {
    await fetch(`/api/videos/${jobId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ cancel: true }),
    })
    pollJobs()
  }

  async function regenerate(jobId: string) {
    setRegening(true)
    await fetch(`/api/videos/${jobId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ regenerate: true, instructions: regenInstructions }),
    })
    setRegenJobId(null)
    setRegenInstructions('')
    setRegening(false)
    pollJobs()
  }

  const hasActiveJobs = jobs.some(j => j.status === 'pending' || j.status === 'rendering')

  return (
    <>
      <Header
        title="Videos"
        subtitle={`${jobs.length} job${jobs.length !== 1 ? 's' : ''} totales${hasActiveJobs ? ' · procesando...' : ''}`}
      />

      <div className="flex-1 p-6 flex gap-6 overflow-hidden">
        {/* ── Left: Form ── */}
        <div className="w-[360px] flex-shrink-0 space-y-5 overflow-y-auto pr-1">
          <div className="rounded-2xl p-5 space-y-4" style={{ background: 'var(--surface-0)', border: '1px solid var(--border)' }}>
            <h2 className="text-sm font-semibold text-white">Nuevo video</h2>

            <Select
              label="Cliente *"
              value={clientId}
              onChange={e => setClientId(e.target.value)}
            >
              <option value="">Seleccionar cliente...</option>
              {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </Select>

            {/* Brand colors */}
            {clientId && (
              <div className="space-y-3 p-3 rounded-xl" style={{ background: 'var(--bg)', border: '1px solid var(--border)' }}>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-[var(--text-3)]">Colores de marca</span>
                  <button
                    onClick={() => setHasBrandColors(v => !v)}
                    className={`relative w-10 h-5 rounded-full transition-colors ${hasBrandColors ? 'bg-[var(--amber)]' : 'bg-[var(--surface-2)]'}`}
                  >
                    <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all ${hasBrandColors ? 'left-5' : 'left-0.5'}`} />
                  </button>
                </div>

                {hasBrandColors && (
                  <div className="space-y-3">
                    <div>
                      <p className="text-[10px] text-[var(--text-3)] mb-2">Paleta seleccionada</p>
                      <div className="flex gap-2 flex-wrap items-center">
                        {brandColors.map((c, i) => (
                          <div key={i} className="relative group">
                            <div className="w-9 h-9 rounded-xl border-2 border-white/20 shadow-md" style={{ background: c }} title={c} />
                            <button
                              onClick={() => setBrandColors(prev => prev.filter((_, j) => j !== i))}
                              className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full text-[var(--text-2)] text-[10px] hidden group-hover:flex items-center justify-center leading-none"
                              style={{ background: 'var(--bg)', border: '1px solid var(--border)' }}
                            >
                              ×
                            </button>
                          </div>
                        ))}
                        <label className="cursor-pointer" title="Agregar color manual">
                          <input
                            type="color"
                            defaultValue="#f59e0b"
                            onChange={e => toggleColor(e.target.value)}
                            className="sr-only"
                          />
                          <div className="w-9 h-9 rounded-xl border-2 border-dashed flex items-center justify-center text-[var(--text-3)] hover:border-[var(--amber)]/50 hover:text-[var(--amber)] transition-colors text-lg font-light"
                            style={{ borderColor: 'var(--border)' }}>
                            +
                          </div>
                        </label>
                      </div>
                      {brandColors.length === 0 && (
                        <p className="text-[10px] text-[var(--text-4)] mt-1.5">Extraé colores de una URL o agregá manualmente con el +</p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <p className="text-[10px] text-[var(--text-3)]">Extraer desde una web</p>
                      <div className="flex gap-1.5">
                        <input
                          type="text"
                          value={extractUrl}
                          onChange={e => setExtractUrl(e.target.value)}
                          onKeyDown={e => e.key === 'Enter' && extractColors()}
                          placeholder="ej: rightbotines.com.ar"
                          className="flex-1 rounded-lg px-2.5 py-1.5 text-[11px] text-[var(--text-2)] placeholder-[var(--text-4)] focus:outline-none focus:border-[var(--amber)]/40"
                          style={{ background: 'var(--surface-0)', border: '1px solid var(--border)' }}
                        />
                        <button
                          onClick={extractColors}
                          disabled={extracting || !extractUrl}
                          className="px-2.5 py-1.5 rounded-lg text-[var(--amber)] text-[11px] font-semibold disabled:opacity-40 transition-colors whitespace-nowrap hover:opacity-80"
                          style={{ background: 'var(--amber-dim)', border: '1px solid rgba(245,158,11,0.3)' }}
                        >
                          {extracting ? '...' : 'Extraer'}
                        </button>
                      </div>

                      {extractedColors.length > 0 && (
                        <div className="space-y-1.5">
                          <p className="text-[10px] text-[var(--text-4)]">Clic para agregar · clic de nuevo para quitar</p>
                          <div className="flex gap-1.5 flex-wrap">
                            {extractedColors.map(c => {
                              const isSelected = brandColors.includes(c)
                              return (
                                <button
                                  key={c}
                                  title={c}
                                  onClick={() => toggleColor(c, true)}
                                  className={`w-9 h-9 rounded-xl border-2 transition-all shadow ${isSelected ? 'border-white scale-110 shadow-white/20' : 'border-white/10 hover:border-white/40 hover:scale-105'}`}
                                  style={{ background: c }}
                                />
                              )
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {!hasBrandColors && (
                  <p className="text-[11px] text-[var(--text-4)]">Usará colores Nova Agency por defecto</p>
                )}
              </div>
            )}

            {clientId && clientProjects.length > 0 && (
              <Select
                label="Proyecto (opcional)"
                value={projectId}
                onChange={e => setProjectId(e.target.value)}
              >
                <option value="">Sin proyecto específico</option>
                {clientProjects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
              </Select>
            )}

            {/* Duration */}
            <div className="space-y-2">
              <p className="text-xs font-medium text-[var(--text-2)]">Duración del clip</p>
              <div className="grid grid-cols-3 gap-1.5">
                {([
                  { value: null, label: 'Auto', sub: 'Según texto' },
                  { value: 20,   label: '20s',  sub: 'Muy corto' },
                  { value: 30,   label: '30s',  sub: 'Corto' },
                  { value: 45,   label: '45s',  sub: 'Normal' },
                  { value: 60,   label: '60s',  sub: 'Largo' },
                  { value: 90,   label: '90s',  sub: 'Muy largo' },
                ] as const).map(d => (
                  <button
                    key={String(d.value)}
                    onClick={() => setTotalDuration(d.value)}
                    className={`text-center px-2 py-2 rounded-xl border text-xs transition-all ${totalDuration === d.value ? BTN_ACTIVE : BTN_INACTIVE}`}
                    style={totalDuration !== d.value ? { background: 'var(--bg)', border: '1px solid var(--border)' } : {}}
                  >
                    <div className="font-bold">{d.label}</div>
                    <div className="text-[10px] mt-0.5 opacity-70">{d.sub}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Format */}
            <div className="space-y-2">
              <p className="text-xs font-medium text-[var(--text-2)]">Formato</p>
              <div className="grid grid-cols-3 gap-1.5">
                {([
                  { value: 'vertical',   label: '9:16', sub: 'Reels/TikTok' },
                  { value: 'square',     label: '1:1',  sub: 'Feed' },
                  { value: 'horizontal', label: '16:9', sub: 'YouTube' },
                ] as const).map(f => (
                  <button
                    key={f.value}
                    onClick={() => setFormat(f.value)}
                    className={`text-center px-2 py-2 rounded-xl border text-xs transition-all ${format === f.value ? BTN_ACTIVE : BTN_INACTIVE}`}
                    style={format !== f.value ? { background: 'var(--bg)', border: '1px solid var(--border)' } : {}}
                  >
                    <div className="font-bold">{f.label}</div>
                    <div className="text-[10px] mt-0.5 opacity-70">{f.sub}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Template */}
            <div className="space-y-2">
              <p className="text-xs font-medium text-[var(--text-2)]">Tipo de video *</p>
              <div className="grid grid-cols-2 gap-1.5">
                {TEMPLATES.map(t => (
                  <button
                    key={t.value}
                    onClick={() => setTemplate(t.value)}
                    className={`text-left px-3 py-2.5 rounded-xl border text-xs transition-all ${template === t.value ? BTN_ACTIVE : BTN_INACTIVE}`}
                    style={template !== t.value ? { background: 'var(--bg)', border: '1px solid var(--border)' } : {}}
                  >
                    <div className="font-semibold">{t.emoji} {t.label}</div>
                    <div className={`text-[10px] mt-0.5 leading-tight ${template === t.value ? 'text-[var(--amber)]/70' : 'text-[var(--text-4)]'}`}>{t.desc}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Tecnicismo */}
            <div className="space-y-2">
              <p className="text-xs font-medium text-[var(--text-2)]">Lenguaje</p>
              <div className="grid grid-cols-2 gap-1.5">
                <button
                  onClick={() => setTechnicality('con')}
                  className={`text-center px-3 py-2.5 rounded-xl border text-xs transition-all ${technicality === 'con' ? BTN_ACTIVE : BTN_INACTIVE}`}
                  style={technicality !== 'con' ? { background: 'var(--bg)', border: '1px solid var(--border)' } : {}}
                >
                  <div className="font-bold">🧠 Técnico</div>
                  <div className="text-[10px] mt-0.5 opacity-70">CTR, funnel, KPI...</div>
                </button>
                <button
                  onClick={() => setTechnicality('sin')}
                  className={`text-center px-3 py-2.5 rounded-xl border text-xs transition-all ${technicality === 'sin' ? BTN_ACTIVE : BTN_INACTIVE}`}
                  style={technicality !== 'sin' ? { background: 'var(--bg)', border: '1px solid var(--border)' } : {}}
                >
                  <div className="font-bold">💬 Simple</div>
                  <div className="text-[10px] mt-0.5 opacity-70">Sin jerga técnica</div>
                </button>
              </div>
            </div>

            <Textarea
              label="Info extra para Claude (opcional)"
              value={extraInfo}
              onChange={e => setExtraInfo(e.target.value)}
              rows={3}
              placeholder="Ej: el cliente vende ropa deportiva, tiene 2000 seguidores, quiere enfocarse en la marca..."
            />

            <Button
              onClick={generate}
              disabled={generating || !clientId || !template}
              className="w-full"
            >
              {generating ? 'Enviando...' : '🎬 Generar video'}
            </Button>
          </div>
        </div>

        {/* ── Right: Job list ── */}
        <div className="flex-1 overflow-y-auto space-y-3 pr-1">
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <div className="w-5 h-5 border-2 border-[var(--amber)] border-t-transparent rounded-full animate-spin" />
            </div>
          ) : jobs.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 gap-3">
              <p className="text-4xl">🎬</p>
              <p className="text-[var(--text-3)] text-sm">Todavía no hay videos generados</p>
              <p className="text-[var(--text-4)] text-xs">Seleccioná un cliente y apretá Generar</p>
            </div>
          ) : jobs.map(job => (
            <div key={job.id} className="rounded-2xl p-4 space-y-3" style={{ background: 'var(--surface-0)', border: '1px solid var(--border)' }}>
              {/* Header row */}
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-semibold text-white truncate">
                      {job.clients?.name || 'Sin cliente'}
                    </span>
                    {job.projects?.name && (
                      <span className="text-xs text-[var(--text-3)]">· {job.projects.name}</span>
                    )}
                  </div>
                  <p className="text-xs text-[var(--text-3)] mt-0.5">
                    {(() => { const t = TEMPLATES.find(t => t.value === job.template); return t ? `${t.emoji} ${t.label}` : job.template })()}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`text-[11px] font-semibold px-2.5 py-1 rounded-full border whitespace-nowrap ${STATUS_STYLES[job.status] || STATUS_STYLES.pending}`}>
                    {STATUS_LABELS[job.status] || job.status}
                  </span>
                  {(job.status === 'pending' || job.status === 'rendering') && (
                    <button
                      onClick={() => cancelJob(job.id)}
                      title="Cancelar job"
                      className="w-6 h-6 flex items-center justify-center rounded-full text-red-400 hover:bg-red-500/10 text-xs transition-colors"
                      style={{ background: 'rgba(248,113,113,0.08)', border: '1px solid rgba(248,113,113,0.2)' }}
                    >
                      ✕
                    </button>
                  )}
                </div>
              </div>

              {/* Progress bar */}
              {job.status === 'rendering' && (
                <div className="space-y-1">
                  <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--surface-1)' }}>
                    <div
                      className="h-full bg-[var(--amber)] rounded-full transition-all duration-500"
                      style={{ width: `${job.progress}%` }}
                    />
                  </div>
                  <p className="text-[10px] text-[var(--text-3)]">{job.progress}% completado</p>
                </div>
              )}

              {job.status === 'pending' && (
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" />
                  <p className="text-[11px] text-blue-400">En cola — el worker lo tomará en segundos</p>
                </div>
              )}

              {job.status === 'error' && job.error && (
                <p className="text-xs text-red-400 rounded-lg px-3 py-2 font-mono bg-red-500/10">
                  {job.error}
                </p>
              )}

              {job.status === 'done' && job.output_url && (
                <div className="space-y-3">
                  <div className="flex gap-2">
                    <a
                      href={job.output_url}
                      target="_blank"
                      rel="noreferrer"
                      className="flex-1 text-center text-xs font-semibold py-2 px-4 rounded-xl text-white hover:opacity-90 transition-opacity"
                      style={{ background: 'var(--amber)' }}
                    >
                      ⬇ Descargar MP4
                    </a>
                    <button
                      onClick={() => { navigator.clipboard.writeText(job.output_url!) }}
                      className="text-xs px-3 py-2 rounded-xl text-[var(--text-3)] hover:text-[var(--text-2)] transition-colors"
                      style={{ border: '1px solid var(--border)' }}
                    >
                      Copiar link
                    </button>
                    <button
                      onClick={() => { setRegenJobId(job.id); setRegenInstructions('') }}
                      className="text-xs px-3 py-2 rounded-xl text-[var(--text-3)] hover:border-[var(--amber)]/40 hover:text-[var(--amber)] transition-colors"
                      style={{ border: '1px solid var(--border)' }}
                    >
                      Editar con IA
                    </button>
                  </div>

                  {regenJobId === job.id && (
                    <div className="space-y-2 p-3 rounded-xl" style={{ background: 'var(--bg)', border: '1px solid var(--border)' }}>
                      <p className="text-xs text-[var(--text-3)]">Instrucciones para Claude</p>
                      <Textarea
                        value={regenInstructions}
                        onChange={e => setRegenInstructions(e.target.value)}
                        rows={2}
                        placeholder="Ej: cambiá el tono a más urgente, agregá el precio en el slide 3..."
                      />
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          onClick={() => regenerate(job.id)}
                          disabled={regening || !regenInstructions}
                        >
                          {regening ? 'Enviando...' : 'Regenerar'}
                        </Button>
                        <Button size="sm" variant="secondary" onClick={() => setRegenJobId(null)}>
                          Cancelar
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              )}

              <p className="text-[10px] text-[var(--text-4)]">
                {new Date(job.created_at).toLocaleString('es-AR')}
                {job.completed_at && ` · completado ${new Date(job.completed_at).toLocaleTimeString('es-AR')}`}
              </p>
            </div>
          ))}
        </div>
      </div>
    </>
  )
}
