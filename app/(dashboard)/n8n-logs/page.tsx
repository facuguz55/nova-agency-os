'use client'
import { usePageTitle } from '@/lib/usePageTitle'

import { useEffect, useState } from 'react'
import Header from '@/components/layout/Header'
import { StatusBadge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Input'
import { formatDate } from '@/lib/utils'
import { RefreshCw, Terminal, CheckCircle2, XCircle, Loader2 } from 'lucide-react'

interface WorkflowLog {
  id: string; workflow_name: string; execution_id: string
  status: string; execution_time_ms: number | null
  error_message: string | null; timestamp: string
}

interface SyncResult { inserted: number; skipped: number; error?: string }

export default function N8NLogsPage() {
  usePageTitle('Logs n8n')
  const [logs, setLogs]             = useState<WorkflowLog[]>([])
  const [loading, setLoading]       = useState(true)
  const [syncing, setSyncing]       = useState(false)
  const [statusFilter, setStatusFilter] = useState('')
  const [expanded, setExpanded]     = useState<string | null>(null)
  const [syncResult, setSyncResult] = useState<SyncResult | null>(null)

  async function load(sync = false) {
    if (sync) setSyncing(true)
    else setLoading(true)
    setSyncResult(null)

    const params = new URLSearchParams({ limit: '100' })
    if (statusFilter) params.set('status', statusFilter)
    if (sync) params.set('sync', 'true')

    const res  = await fetch(`/api/n8n?${params}`)
    const json = await res.json()
    setLogs(json.logs || [])
    if (json.sync) setSyncResult(json.sync)

    setSyncing(false)
    setLoading(false)
  }

  useEffect(() => { load() }, [statusFilter])

  const stats = {
    total:   logs.length,
    success: logs.filter(l => l.status === 'success').length,
    failed:  logs.filter(l => l.status === 'failed').length,
    running: logs.filter(l => l.status === 'running').length,
  }

  return (
    <>
      <Header
        title="n8n Logs"
        subtitle="Ejecuciones de workflows"
        actions={
          <div className="flex gap-2">
            <Button variant="secondary" onClick={() => load(true)} disabled={syncing} size="sm">
              {syncing
                ? <><Loader2 size={12} className="animate-spin"/> Sincronizando...</>
                : <><RefreshCw size={12}/> Sincronizar n8n</>
              }
            </Button>
            <Button variant="secondary" onClick={() => load()} size="sm">
              <RefreshCw size={12}/> Actualizar
            </Button>
          </div>
        }
      />

      <div className="flex-1 p-6 space-y-4 bg-grid overflow-y-auto">

        {/* Resultado del sync */}
        {syncResult && (
          <div className={`flex items-center gap-3 px-4 py-3 rounded-xl border text-sm ${
            syncResult.error
              ? 'bg-red-500/10 border-red-500/20 text-red-400'
              : 'bg-green-500/10 border-green-500/20 text-green-400'
          }`}>
            {syncResult.error
              ? <><XCircle size={15}/> Error al sincronizar: {syncResult.error}</>
              : <><CheckCircle2 size={15}/> Sincronizado — {syncResult.inserted} nuevas ejecuciones insertadas, {syncResult.skipped} ya existían</>
            }
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-4 gap-3">
          {[
            { label: 'Total',     value: stats.total,   color: 'text-white' },
            { label: 'Exitosos',  value: stats.success, color: 'text-green-400' },
            { label: 'Fallidos',  value: stats.failed,  color: 'text-red-400' },
            { label: 'Corriendo', value: stats.running, color: 'text-blue-400' },
          ].map(s => (
            <div key={s.label} className="bg-[#0e1a2e] border border-[#1e2f4a] rounded-2xl p-4">
              <p className="text-[10px] text-[#334155] uppercase tracking-widest mb-1">{s.label}</p>
              <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
            </div>
          ))}
        </div>

        {/* Filtro */}
        <div className="flex gap-3">
          <select
            value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
            className="px-4 py-2.5 bg-[#0e1a2e] border border-[#1e2f4a] rounded-xl text-sm text-white focus:outline-none focus:border-[#ff8c42]/40 transition-all"
          >
            <option value="">Todos los estados</option>
            <option value="success">Exitoso</option>
            <option value="failed">Fallido</option>
            <option value="running">Corriendo</option>
            <option value="paused">Pausado</option>
          </select>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-6 h-6 border-2 border-[#ff8c42] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : logs.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <div className="w-12 h-12 rounded-2xl bg-[#0e1a2e] border border-[#1e2f4a] flex items-center justify-center">
              <Terminal size={20} className="text-[#334155]" />
            </div>
            <div className="text-center">
              <p className="text-sm text-[#475569]">No hay logs</p>
              <p className="text-xs text-[#334155] mt-1">Hacé clic en &quot;Sincronizar n8n&quot; para importar las ejecuciones</p>
            </div>
            <Button onClick={() => load(true)} size="sm">
              <RefreshCw size={12}/> Sincronizar ahora
            </Button>
          </div>
        ) : (
          <div className="bg-[#0e1a2e] border border-[#1e2f4a] rounded-2xl overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-[#1e2f4a]">
                  {['Workflow', 'Estado', 'Duración', 'Timestamp', ''].map(h => (
                    <th key={h} className="text-left px-5 py-3.5 text-[10px] text-[#334155] uppercase tracking-widest font-semibold">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {logs.map(log => (
                  <>
                    <tr key={log.id} className="border-b border-[#1e2f4a]/40 hover:bg-white/[.015] transition-colors last:border-0">
                      <td className="px-5 py-4">
                        <p className="text-sm font-medium text-white">{log.workflow_name}</p>
                        <p className="text-[11px] text-[#334155] mt-0.5 font-mono">#{log.execution_id}</p>
                      </td>
                      <td className="px-5 py-4"><StatusBadge status={log.status}/></td>
                      <td className="px-5 py-4 text-sm text-[#64748b]">
                        {log.execution_time_ms != null
                          ? `${(log.execution_time_ms / 1000).toFixed(2)}s`
                          : '—'}
                      </td>
                      <td className="px-5 py-4 text-xs text-[#475569]">{formatDate(log.timestamp)}</td>
                      <td className="px-5 py-4">
                        {log.error_message && (
                          <button
                            onClick={() => setExpanded(expanded === log.id ? null : log.id)}
                            className="text-xs text-red-400 hover:text-red-300 transition-colors"
                          >
                            {expanded === log.id ? '▲ Ocultar' : '▼ Error'}
                          </button>
                        )}
                      </td>
                    </tr>
                    {expanded === log.id && log.error_message && (
                      <tr key={log.id + '_err'} className="border-b border-[#1e2f4a]/40">
                        <td colSpan={5} className="px-5 py-3">
                          <div className="bg-red-500/5 border border-red-500/20 rounded-xl p-3">
                            <p className="text-xs text-red-400 font-mono break-all">{log.error_message}</p>
                          </div>
                        </td>
                      </tr>
                    )}
                  </>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  )
}
