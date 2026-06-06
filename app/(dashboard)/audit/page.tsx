'use client'
import { usePageTitle } from '@/lib/usePageTitle'

import { useEffect, useState } from 'react'
import Header from '@/components/layout/Header'
import { StatusBadge } from '@/components/ui/Badge'
import { formatDate } from '@/lib/utils'

interface Action {
  id: string; action_type: string; description: string
  status: string; result: string | null; created_by: string; created_at: string
}

const TYPE_ICONS: Record<string, string> = {
  email: '✉', api_call: '⚡', ssh: '💻', report: '📊', decision: '◈', other: '◌',
}

const PANEL = { background: 'var(--surface-1)', border: '1px solid var(--border)', borderRadius: 12 }

export default function AuditPage() {
  usePageTitle('Auditoría')
  const [actions, setActions] = useState<Action[]>([])
  const [loading, setLoading] = useState(true)
  const [typeFilter, setTypeFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')

  async function load() {
    setLoading(true)
    const params = new URLSearchParams({ limit: '100' })
    if (typeFilter) params.set('type', typeFilter)
    if (statusFilter) params.set('status', statusFilter)
    const res = await fetch(`/api/actions?${params}`)
    const { actions: data } = await res.json()
    setActions(data || [])
    setLoading(false)
  }

  useEffect(() => { load() }, [typeFilter, statusFilter])

  const selectCls = 'px-4 py-2 rounded-xl text-white text-sm focus:outline-none transition-all'

  return (
    <>
      <Header
        title="Audit Log"
        subtitle={`${actions.length} acciones registradas`}
        actions={
          <button
            onClick={load}
            className="px-3 py-1.5 text-xs text-[var(--text-2)] hover:text-white rounded-lg transition-colors hover:bg-white/[.06]"
            style={{ background: 'var(--surface-2)', border: '1px solid var(--border)' }}
          >
            Actualizar
          </button>
        }
      />

      <div className="flex-1 p-6 space-y-4">
        <div className="flex gap-3 flex-wrap">
          <select
            value={typeFilter}
            onChange={e => setTypeFilter(e.target.value)}
            className={selectCls}
            style={{ background: 'var(--surface-1)', border: '1px solid var(--border)' }}
          >
            <option value="">Todos los tipos</option>
            <option value="email">Email</option>
            <option value="api_call">API Call</option>
            <option value="ssh">SSH</option>
            <option value="report">Reporte</option>
            <option value="decision">Decisión</option>
            <option value="other">Otro</option>
          </select>
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className={selectCls}
            style={{ background: 'var(--surface-1)', border: '1px solid var(--border)' }}
          >
            <option value="">Todos los estados</option>
            <option value="pending">Pendiente</option>
            <option value="executed">Ejecutado</option>
            <option value="failed">Fallido</option>
            <option value="canceled">Cancelado</option>
          </select>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="w-6 h-6 border-2 border-[var(--amber)] border-t-transparent rounded-full animate-spin"/>
          </div>
        ) : actions.length === 0 ? (
          <div className="flex items-center justify-center py-16">
            <p className="text-[var(--text-3)] text-sm">No hay acciones registradas</p>
          </div>
        ) : (
          <div style={PANEL} className="overflow-hidden animate-fade-up">
            <table className="w-full">
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border)' }}>
                  {['Tipo', 'Descripción', 'Estado', 'Por', 'Fecha'].map(h => (
                    <th key={h} className="text-left px-4 py-3 text-[10px] text-[var(--text-4)] uppercase tracking-wider font-medium">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {actions.map(a => (
                  <tr
                    key={a.id}
                    className="hover:bg-white/[.02] transition-colors last:border-0"
                    style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}
                  >
                    <td className="px-4 py-3">
                      <span className="flex items-center gap-1.5 text-sm text-[var(--text-2)]">
                        <span>{TYPE_ICONS[a.action_type] || '◌'}</span>
                        <span className="capitalize">{a.action_type}</span>
                      </span>
                    </td>
                    <td className="px-4 py-3 max-w-xs">
                      <p className="text-sm text-white truncate">{a.description}</p>
                      {a.result && <p className="text-xs text-[var(--text-3)] mt-0.5 truncate">{a.result}</p>}
                    </td>
                    <td className="px-4 py-3"><StatusBadge status={a.status} /></td>
                    <td className="px-4 py-3 text-sm text-[var(--text-2)]">{a.created_by}</td>
                    <td className="px-4 py-3 text-xs text-[var(--text-3)]">{formatDate(a.created_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  )
}
