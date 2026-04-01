'use client'

import { useEffect, useState } from 'react'
import Header from '@/components/layout/Header'
import { StatusBadge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Input'
import { formatDate } from '@/lib/utils'

interface WorkflowLog {
  id: string; workflow_name: string; execution_id: string
  status: string; execution_time_ms: number | null
  error_message: string | null; timestamp: string
}

export default function N8NLogsPage() {
  const [logs, setLogs] = useState<WorkflowLog[]>([])
  const [loading, setLoading] = useState(true)
  const [syncing, setSyncing] = useState(false)
  const [statusFilter, setStatusFilter] = useState('')
  const [expanded, setExpanded] = useState<string | null>(null)

  async function load(sync = false) {
    if (sync) setSyncing(true)
    else setLoading(true)

    const params = new URLSearchParams()
    if (statusFilter) params.set('status', statusFilter)
    if (sync) params.set('sync', 'true')
    params.set('limit', '100')

    const res = await fetch(`/api/n8n?${params}`)
    const { logs: data } = await res.json()
    setLogs(data || [])

    setSyncing(false)
    setLoading(false)
  }

  useEffect(() => { load() }, [statusFilter])

  const stats = {
    total: logs.length,
    success: logs.filter(l => l.status === 'success').length,
    failed: logs.filter(l => l.status === 'failed').length,
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
              {syncing ? 'Sincronizando...' : '↻ Sincronizar n8n'}
            </Button>
            <Button variant="secondary" onClick={() => load()} size="sm">Actualizar</Button>
          </div>
        }
      />

      <div className="flex-1 p-6 space-y-4">
        {/* Stats */}
        <div className="grid grid-cols-4 gap-3">
          {[
            { label: 'Total', value: stats.total, color: 'text-white' },
            { label: 'Exitosos', value: stats.success, color: 'text-green-400' },
            { label: 'Fallidos', value: stats.failed, color: 'text-red-400' },
            { label: 'Corriendo', value: stats.running, color: 'text-blue-400' },
          ].map(s => (
            <div key={s.label} className="bg-[#1e293b] border border-[#334155] rounded-xl p-3">
              <p className="text-xs text-[#475569]">{s.label}</p>
              <p className={`text-xl font-bold ${s.color}`}>{s.value}</p>
            </div>
          ))}
        </div>

        {/* Filtros */}
        <div className="flex gap-3">
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="px-4 py-2 bg-[#1e293b] border border-[#334155] rounded-xl text-white text-sm focus:outline-none focus:border-[#ff8c42]"
          >
            <option value="">Todos los estados</option>
            <option value="success">Exitoso</option>
            <option value="failed">Fallido</option>
            <option value="running">Corriendo</option>
            <option value="paused">Pausado</option>
          </select>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-16"><p className="text-[#475569] text-sm">Cargando...</p></div>
        ) : logs.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3">
            <p className="text-[#475569] text-sm">No hay logs</p>
            <Button onClick={() => load(true)} size="sm">Sincronizar desde n8n</Button>
          </div>
        ) : (
          <div className="bg-[#1e293b] border border-[#334155] rounded-xl overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-[#334155]">
                  {['Workflow', 'Estado', 'Tiempo', 'Timestamp', 'Detalles'].map(h => (
                    <th key={h} className="text-left px-4 py-3 text-xs text-[#475569] uppercase tracking-wider font-medium">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {logs.map(log => (
                  <>
                    <tr key={log.id} className="border-b border-[#334155]/50 hover:bg-[#334155]/20 transition-colors last:border-0">
                      <td className="px-4 py-3">
                        <p className="text-sm font-medium text-white">{log.workflow_name}</p>
                        <p className="text-xs text-[#334155]">#{log.execution_id.slice(0, 8)}</p>
                      </td>
                      <td className="px-4 py-3"><StatusBadge status={log.status} /></td>
                      <td className="px-4 py-3 text-sm text-[#94a3b8]">
                        {log.execution_time_ms ? `${(log.execution_time_ms / 1000).toFixed(2)}s` : '—'}
                      </td>
                      <td className="px-4 py-3 text-xs text-[#475569]">{formatDate(log.timestamp)}</td>
                      <td className="px-4 py-3">
                        {log.error_message && (
                          <button
                            onClick={() => setExpanded(expanded === log.id ? null : log.id)}
                            className="text-xs text-red-400 hover:text-red-300"
                          >
                            {expanded === log.id ? '▲ Ocultar' : '▼ Ver error'}
                          </button>
                        )}
                      </td>
                    </tr>
                    {expanded === log.id && log.error_message && (
                      <tr key={log.id + '_err'} className="border-b border-[#334155]/50">
                        <td colSpan={5} className="px-4 py-3">
                          <div className="bg-red-500/5 border border-red-500/20 rounded-lg p-3">
                            <p className="text-xs text-red-400 font-mono">{log.error_message}</p>
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
