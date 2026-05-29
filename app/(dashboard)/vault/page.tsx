'use client'

import { useEffect, useState, useCallback } from 'react'
import { usePageTitle } from '@/lib/usePageTitle'
import Header from '@/components/layout/Header'
import {
  Shield, User, Building2, Users, Plus, Trash2, Eye, EyeOff,
  Copy, Check, Globe, CreditCard, Wallet, Landmark,
  KeyRound, AtSign, Phone, MapPin, Calendar, BadgeCheck,
  Loader2, Save, X, Edit3, Tag,
} from 'lucide-react'
import type {
  VaultEntity, VaultPersonal, VaultFinancial, VaultCredential,
  VaultSocial, VaultCustomField, FinancialType, CredentialCategory, SocialPlatform,
} from '@/types/vault'

// ── utils ─────────────────────────────────────────────────────────────────────

function cls(...c: (string | false | undefined)[]) { return c.filter(Boolean).join(' ') }
function safeHref(url: string) { return /^https?:\/\//i.test(url) ? url : '#' }

// ── shared atoms (TODOS al nivel módulo para evitar re-mounts en cada render) ─

function CopyBtn({ value }: { value: string }) {
  const [copied, setCopied] = useState(false)
  function copy() {
    navigator.clipboard.writeText(value)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }
  return (
    <button onClick={copy} className="text-[#334155] hover:text-[#f97316] transition-colors p-1 rounded">
      {copied ? <Check size={12} className="text-[#34d399]" /> : <Copy size={12} />}
    </button>
  )
}

function RevealField({ value }: { value: string }) {
  const [show, setShow] = useState(false)
  return (
    <div className="flex items-center gap-1.5 min-w-0">
      <span className="font-mono text-xs truncate text-[#94a3b8]">
        {show ? value : '••••••••••••'}
      </span>
      <button onClick={() => setShow(s => !s)} className="text-[#334155] hover:text-[#f97316] transition-colors p-1 rounded shrink-0">
        {show ? <EyeOff size={12} /> : <Eye size={12} />}
      </button>
      {show && <CopyBtn value={value} />}
    </div>
  )
}

// Field al nivel módulo — evita que React desmonte/remonte el input en cada keystroke
interface FieldProps {
  label: string
  value: string
  editing: boolean
  onChange: (v: string) => void
  icon?: React.ReactNode
  inputType?: string
}
function Field({ label, value, editing, onChange, icon, inputType = 'text' }: FieldProps) {
  return (
    <div>
      <label className="text-[10px] uppercase tracking-widest text-[#334155] flex items-center gap-1 mb-1">
        {icon}{label}
      </label>
      {editing ? (
        <input
          type={inputType}
          value={value}
          onChange={e => onChange(e.target.value)}
          className="w-full bg-[#0d1828] border border-[#1a2d45] rounded-md px-3 py-1.5 text-sm text-white outline-none focus:border-[#f97316]/50"
        />
      ) : (
        <div className="flex items-center gap-1.5 min-w-0">
          <p className="text-sm text-[#94a3b8] truncate">
            {value || <span className="text-[#253f60]">—</span>}
          </p>
          {value && <CopyBtn value={value} />}
        </div>
      )}
    </div>
  )
}

function CredRow({ label, value, reveal }: { label: string; value: string; reveal: boolean }) {
  return (
    <div>
      <p className="text-[10px] uppercase tracking-widest text-[#253f60] mb-0.5">{label}</p>
      {reveal ? <RevealField value={value} /> : (
        <div className="flex items-center gap-1">
          <span className="text-xs text-[#94a3b8] truncate">{value}</span>
          <CopyBtn value={value} />
        </div>
      )}
    </div>
  )
}

function LoadingState() {
  return (
    <div className="flex items-center justify-center h-32">
      <Loader2 size={20} className="text-[#f97316] animate-spin" />
    </div>
  )
}

function EmptyState({ label }: { label: string }) {
  return (
    <div className="flex flex-col items-center justify-center h-24 text-center">
      <Shield size={24} className="text-[#1a2d45] mb-2" />
      <p className="text-sm text-[#253f60]">{label}</p>
    </div>
  )
}

// ── constants ─────────────────────────────────────────────────────────────────

const FINANCIAL_LABELS: Record<FinancialType, string> = {
  cbu: 'CBU', alias: 'Alias', cuenta_bancaria: 'Cuenta Bancaria',
  tarjeta_credito: 'Tarjeta Crédito', tarjeta_debito: 'Tarjeta Débito',
  billetera_virtual: 'Billetera Virtual', crypto: 'Crypto', efectivo: 'Efectivo', otro: 'Otro',
}

const CRED_LABELS: Record<CredentialCategory, string> = {
  red_social: 'Red Social', email: 'Email', banco: 'Banco', hosting: 'Hosting',
  dominio: 'Dominio', saas: 'SaaS', tienda: 'Tienda', gobierno: 'Gobierno', otro: 'Otro',
}

const SOCIAL_ICONS: Record<SocialPlatform, React.ReactNode> = {
  instagram: <span className="text-[10px] font-bold">IG</span>,
  tiktok: <span className="text-[10px] font-bold">TK</span>,
  youtube: <span className="text-[10px] font-bold">YT</span>,
  linkedin: <span className="text-[10px] font-bold">LI</span>,
  twitter: <span className="text-[10px] font-bold">X</span>,
  facebook: <span className="text-[10px] font-bold">FB</span>,
  whatsapp_business: <Phone size={14} />,
  telegram: <span className="text-[10px] font-bold">TG</span>,
  otro: <Globe size={14} />,
}

const PLATFORM_LABELS: Record<SocialPlatform, string> = {
  instagram: 'Instagram', tiktok: 'TikTok', youtube: 'YouTube', linkedin: 'LinkedIn',
  twitter: 'Twitter/X', facebook: 'Facebook', whatsapp_business: 'WhatsApp Business',
  telegram: 'Telegram', otro: 'Otro',
}

const FIN_ICONS: Record<FinancialType, React.ReactNode> = {
  cbu: <CreditCard size={14} />, alias: <AtSign size={14} />,
  cuenta_bancaria: <Landmark size={14} />, tarjeta_credito: <CreditCard size={14} />,
  tarjeta_debito: <CreditCard size={14} />, billetera_virtual: <Wallet size={14} />,
  crypto: <Wallet size={14} />, efectivo: <Wallet size={14} />, otro: <KeyRound size={14} />,
}

// ── tabs por tipo de entidad ───────────────────────────────────────────────────

type TabId = 'info' | 'financiero' | 'credenciales' | 'redes' | 'otros'

interface TabDef { id: TabId; label: string }

function getTabsForType(type: string): TabDef[] {
  const base: TabDef[] = [
    { id: 'financiero',   label: 'Financiero' },
    { id: 'credenciales', label: 'Credenciales' },
    { id: 'redes',        label: 'Redes' },
    { id: 'otros',        label: 'Otros' },
  ]
  if (type === 'agencia') return [{ id: 'info', label: 'Info Agencia' }, ...base]
  if (type === 'cliente') return [{ id: 'info', label: 'Contacto' }, ...base]
  return [{ id: 'info', label: 'Personal' }, ...base]
}

// ── InfoTab (Personal / Info Agencia / Contacto) ──────────────────────────────

interface InfoTabProps { entityId: string; entityType: string }

function InfoTab({ entityId, entityType }: InfoTabProps) {
  const [data, setData]       = useState<VaultPersonal | null>(null)
  const [editing, setEditing] = useState(false)
  const [saving, setSaving]   = useState(false)
  const [loading, setLoading] = useState(true)
  const [form, setForm]       = useState<Partial<VaultPersonal>>({})

  const load = useCallback(async () => {
    setLoading(true)
    const res = await fetch(`/api/vault/${entityId}/personal`)
    const d = await res.json()
    setData(d)
    setForm(d ?? {})
    setLoading(false)
  }, [entityId])

  useEffect(() => { load() }, [load])

  async function save() {
    setSaving(true)
    await fetch(`/api/vault/${entityId}/personal`, {
      method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form),
    })
    setSaving(false)
    setEditing(false)
    load()
  }

  function f(field: keyof VaultPersonal) {
    return (form[field] as string) ?? ''
  }
  function set(field: keyof VaultPersonal) {
    return (v: string) => setForm(prev => ({ ...prev, [field]: v }))
  }

  if (loading) return <LoadingState />

  const isAgencia = entityType === 'agencia'
  const isPerson  = entityType === 'facundo' || entityType === 'mauricio'

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-white">
          {isAgencia ? 'Información de la Agencia' : entityType === 'cliente' ? 'Datos de Contacto' : 'Datos Personales'}
        </h3>
        <div className="flex gap-2">
          {editing ? (
            <>
              <button onClick={() => { setEditing(false); setForm(data ?? {}) }}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-[#64748b] hover:text-white border border-[#1a2d45] rounded-md transition-colors">
                <X size={12} /> Cancelar
              </button>
              <button onClick={save} disabled={saving}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-[#0d1828] bg-[#f97316] hover:bg-[#ea6c0a] rounded-md font-semibold transition-colors disabled:opacity-50">
                {saving ? <Loader2 size={12} className="animate-spin" /> : <Save size={12} />} Guardar
              </button>
            </>
          ) : (
            <button onClick={() => setEditing(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-[#64748b] hover:text-white border border-[#1a2d45] rounded-md transition-colors">
              <Edit3 size={12} /> Editar
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Field
          label={isAgencia ? 'Razón Social' : 'Nombre completo'}
          value={f('full_name')} editing={editing} onChange={set('full_name')}
          icon={<User size={10} />}
        />
        <Field
          label="Email" value={f('email')} editing={editing} onChange={set('email')}
          icon={<AtSign size={10} />} inputType="email"
        />
        <Field
          label="Teléfono" value={f('phone')} editing={editing} onChange={set('phone')}
          icon={<Phone size={10} />}
        />
        <Field
          label="WhatsApp" value={f('whatsapp')} editing={editing} onChange={set('whatsapp')}
          icon={<Phone size={10} />}
        />

        {/* Solo personas */}
        {isPerson && (
          <>
            <Field label="DNI" value={f('dni')} editing={editing} onChange={set('dni')} />
            <Field label="CUIT" value={f('cuit')} editing={editing} onChange={set('cuit')} />
            <Field
              label="Fecha de nacimiento" value={f('birth_date')} editing={editing}
              onChange={set('birth_date')} icon={<Calendar size={10} />} inputType="date"
            />
            <Field label="Nacionalidad" value={f('nationality')} editing={editing} onChange={set('nationality')} />
          </>
        )}

        {/* Agencia y clientes: CUIT pero no DNI personal */}
        {!isPerson && (
          <Field label="CUIT" value={f('cuit')} editing={editing} onChange={set('cuit')} />
        )}

        <Field
          label="Dirección" value={f('address')} editing={editing} onChange={set('address')}
          icon={<MapPin size={10} />}
        />
        <Field label="Ciudad" value={f('city')} editing={editing} onChange={set('city')} icon={<MapPin size={10} />} />
        <Field label="Provincia" value={f('province')} editing={editing} onChange={set('province')} />
        <Field label="País" value={f('country')} editing={editing} onChange={set('country')} />
      </div>

      <div>
        <label className="text-[10px] uppercase tracking-widest text-[#334155] block mb-1">Notas</label>
        {editing ? (
          <textarea
            value={form.notes ?? ''}
            onChange={e => setForm(p => ({ ...p, notes: e.target.value }))}
            rows={3}
            className="w-full bg-[#0d1828] border border-[#1a2d45] rounded-md px-3 py-2 text-sm text-white outline-none focus:border-[#f97316]/50 resize-none"
          />
        ) : (
          <p className="text-sm text-[#94a3b8]">{data?.notes || <span className="text-[#253f60]">—</span>}</p>
        )}
      </div>
    </div>
  )
}

// ── FinancialsTab ─────────────────────────────────────────────────────────────

const EMPTY_FIN = { type: 'cbu' as FinancialType, label: '', value: '', bank_name: '', currency: 'ARS', notes: '' }

function FinancialsTab({ entityId }: { entityId: string }) {
  const [items, setItems]     = useState<VaultFinancial[]>([])
  const [loading, setLoading] = useState(true)
  const [showAdd, setShowAdd] = useState(false)
  const [form, setForm]       = useState(EMPTY_FIN)
  const [saving, setSaving]   = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    const res = await fetch(`/api/vault/${entityId}/financials`)
    setItems(await res.json())
    setLoading(false)
  }, [entityId])

  useEffect(() => { load() }, [load])

  async function add() {
    setSaving(true)
    await fetch(`/api/vault/${entityId}/financials`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form),
    })
    setSaving(false); setShowAdd(false); setForm(EMPTY_FIN); load()
  }

  async function remove(id: string) {
    await fetch(`/api/vault/${entityId}/financials`, {
      method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id }),
    })
    load()
  }

  if (loading) return <LoadingState />

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-white">Datos Financieros</h3>
        <button onClick={() => setShowAdd(s => !s)}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-[#f97316] border border-[#f97316]/30 rounded-md hover:bg-[#f97316]/10 transition-colors">
          <Plus size={12} /> Agregar
        </button>
      </div>

      {showAdd && (
        <div className="bg-[#0d1828] border border-[#1a2d45] rounded-xl p-4 space-y-3">
          <p className="text-xs font-semibold text-[#64748b] uppercase tracking-widest">Nuevo registro</p>
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: 'Tipo', el: (
                <select value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value as FinancialType }))}
                  className="w-full bg-[#060e1a] border border-[#1a2d45] rounded-md px-3 py-1.5 text-sm text-white outline-none">
                  {Object.entries(FINANCIAL_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                </select>
              )},
              { label: 'Etiqueta', el: <input placeholder="ej: Cuenta Galicia" value={form.label} onChange={e => setForm(f => ({ ...f, label: e.target.value }))} className="w-full bg-[#060e1a] border border-[#1a2d45] rounded-md px-3 py-1.5 text-sm text-white outline-none focus:border-[#f97316]/50" /> },
              { label: 'Valor / Número', el: <input placeholder="CBU, alias..." value={form.value} onChange={e => setForm(f => ({ ...f, value: e.target.value }))} className="w-full bg-[#060e1a] border border-[#1a2d45] rounded-md px-3 py-1.5 text-sm text-white outline-none focus:border-[#f97316]/50" /> },
              { label: 'Banco', el: <input placeholder="ej: Banco Galicia" value={form.bank_name} onChange={e => setForm(f => ({ ...f, bank_name: e.target.value }))} className="w-full bg-[#060e1a] border border-[#1a2d45] rounded-md px-3 py-1.5 text-sm text-white outline-none focus:border-[#f97316]/50" /> },
              { label: 'Moneda', el: (
                <select value={form.currency} onChange={e => setForm(f => ({ ...f, currency: e.target.value }))}
                  className="w-full bg-[#060e1a] border border-[#1a2d45] rounded-md px-3 py-1.5 text-sm text-white outline-none">
                  <option>ARS</option><option>USD</option><option>EUR</option><option>USDT</option>
                </select>
              )},
              { label: 'Notas', el: <input placeholder="Opcional..." value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} className="w-full bg-[#060e1a] border border-[#1a2d45] rounded-md px-3 py-1.5 text-sm text-white outline-none focus:border-[#f97316]/50" /> },
            ].map(({ label, el }) => (
              <div key={label}>
                <label className="text-[10px] text-[#334155] uppercase tracking-widest block mb-1">{label}</label>
                {el}
              </div>
            ))}
          </div>
          <div className="flex gap-2 pt-1">
            <button onClick={() => setShowAdd(false)} className="px-3 py-1.5 text-xs text-[#64748b] border border-[#1a2d45] rounded-md hover:text-white transition-colors">Cancelar</button>
            <button onClick={add} disabled={saving || !form.label}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-[#f97316] text-[#0d1828] font-semibold rounded-md disabled:opacity-50">
              {saving ? <Loader2 size={12} className="animate-spin" /> : <Save size={12} />} Guardar
            </button>
          </div>
        </div>
      )}

      {items.length === 0 && !showAdd && <EmptyState label="No hay datos financieros" />}

      <div className="space-y-2">
        {items.map(item => (
          <div key={item.id} className="bg-[#0d1828] border border-[#1a2d45] rounded-xl p-4 flex items-start gap-3">
            <div className="w-8 h-8 rounded-lg bg-[#060e1a] border border-[#1a2d45] flex items-center justify-center text-[#f97316] shrink-0">
              {FIN_ICONS[item.type]}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <p className="text-sm font-semibold text-white">{item.label}</p>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#1a2d45] text-[#64748b]">{FINANCIAL_LABELS[item.type]}</span>
                {item.currency !== 'ARS' && <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#f97316]/10 text-[#f97316]">{item.currency}</span>}
              </div>
              {item.bank_name && <p className="text-xs text-[#334155] mb-1">{item.bank_name}</p>}
              {item.value && (
                <div className="flex items-center gap-1">
                  <span className="text-[10px] text-[#253f60] uppercase">Valor:</span>
                  <RevealField value={item.value} />
                </div>
              )}
              {item.notes && <p className="text-xs text-[#334155] mt-1">{item.notes}</p>}
            </div>
            <button onClick={() => remove(item.id)} className="text-[#253f60] hover:text-red-400 transition-colors p-1 rounded shrink-0">
              <Trash2 size={13} />
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}

// ── CredentialsTab ────────────────────────────────────────────────────────────

const EMPTY_CRED = {
  category: 'saas' as CredentialCategory, service_name: '', service_url: '',
  username: '', email_used: '', password: '', phone_2fa: '', recovery_email: '', notes: '',
}

function CredentialsTab({ entityId }: { entityId: string }) {
  const [items, setItems]     = useState<VaultCredential[]>([])
  const [loading, setLoading] = useState(true)
  const [showAdd, setShowAdd] = useState(false)
  const [form, setForm]       = useState(EMPTY_CRED)
  const [saving, setSaving]   = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    const res = await fetch(`/api/vault/${entityId}/credentials`)
    setItems(await res.json())
    setLoading(false)
  }, [entityId])

  useEffect(() => { load() }, [load])

  async function add() {
    setSaving(true)
    await fetch(`/api/vault/${entityId}/credentials`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form),
    })
    setSaving(false); setShowAdd(false); setForm(EMPTY_CRED); load()
  }

  async function remove(id: string) {
    await fetch(`/api/vault/${entityId}/credentials`, {
      method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id }),
    })
    load()
  }

  if (loading) return <LoadingState />

  const grouped = items.reduce<Record<string, VaultCredential[]>>((acc, item) => {
    if (!acc[item.category]) acc[item.category] = []
    acc[item.category].push(item)
    return acc
  }, {})

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-white">Credenciales y Accesos</h3>
        <button onClick={() => setShowAdd(s => !s)}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-[#f97316] border border-[#f97316]/30 rounded-md hover:bg-[#f97316]/10 transition-colors">
          <Plus size={12} /> Agregar
        </button>
      </div>

      {showAdd && (
        <div className="bg-[#0d1828] border border-[#1a2d45] rounded-xl p-4 space-y-3">
          <p className="text-xs font-semibold text-[#64748b] uppercase tracking-widest">Nueva credencial</p>
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: 'Categoría', el: (
                <select value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value as CredentialCategory }))}
                  className="w-full bg-[#060e1a] border border-[#1a2d45] rounded-md px-3 py-1.5 text-sm text-white outline-none">
                  {Object.entries(CRED_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                </select>
              )},
              { label: 'Servicio', el: <input placeholder="ej: Instagram Nova" value={form.service_name} onChange={e => setForm(f => ({ ...f, service_name: e.target.value }))} className="w-full bg-[#060e1a] border border-[#1a2d45] rounded-md px-3 py-1.5 text-sm text-white outline-none focus:border-[#f97316]/50" /> },
              { label: 'URL', el: <input placeholder="https://..." value={form.service_url} onChange={e => setForm(f => ({ ...f, service_url: e.target.value }))} className="w-full bg-[#060e1a] border border-[#1a2d45] rounded-md px-3 py-1.5 text-sm text-white outline-none focus:border-[#f97316]/50" /> },
              { label: 'Usuario', el: <input value={form.username} onChange={e => setForm(f => ({ ...f, username: e.target.value }))} className="w-full bg-[#060e1a] border border-[#1a2d45] rounded-md px-3 py-1.5 text-sm text-white outline-none focus:border-[#f97316]/50" /> },
              { label: 'Email usado', el: <input type="email" value={form.email_used} onChange={e => setForm(f => ({ ...f, email_used: e.target.value }))} className="w-full bg-[#060e1a] border border-[#1a2d45] rounded-md px-3 py-1.5 text-sm text-white outline-none focus:border-[#f97316]/50" /> },
              { label: 'Contraseña', el: <input type="password" value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} className="w-full bg-[#060e1a] border border-[#1a2d45] rounded-md px-3 py-1.5 text-sm text-white outline-none focus:border-[#f97316]/50" /> },
              { label: 'Teléfono 2FA', el: <input value={form.phone_2fa} onChange={e => setForm(f => ({ ...f, phone_2fa: e.target.value }))} className="w-full bg-[#060e1a] border border-[#1a2d45] rounded-md px-3 py-1.5 text-sm text-white outline-none focus:border-[#f97316]/50" /> },
              { label: 'Email recuperación', el: <input type="email" value={form.recovery_email} onChange={e => setForm(f => ({ ...f, recovery_email: e.target.value }))} className="w-full bg-[#060e1a] border border-[#1a2d45] rounded-md px-3 py-1.5 text-sm text-white outline-none focus:border-[#f97316]/50" /> },
            ].map(({ label, el }) => (
              <div key={label}>
                <label className="text-[10px] text-[#334155] uppercase tracking-widest block mb-1">{label}</label>
                {el}
              </div>
            ))}
            <div className="col-span-2">
              <label className="text-[10px] text-[#334155] uppercase tracking-widest block mb-1">Notas</label>
              <input value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} className="w-full bg-[#060e1a] border border-[#1a2d45] rounded-md px-3 py-1.5 text-sm text-white outline-none focus:border-[#f97316]/50" />
            </div>
          </div>
          <div className="flex gap-2 pt-1">
            <button onClick={() => setShowAdd(false)} className="px-3 py-1.5 text-xs text-[#64748b] border border-[#1a2d45] rounded-md hover:text-white transition-colors">Cancelar</button>
            <button onClick={add} disabled={saving || !form.service_name}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-[#f97316] text-[#0d1828] font-semibold rounded-md disabled:opacity-50">
              {saving ? <Loader2 size={12} className="animate-spin" /> : <Save size={12} />} Guardar
            </button>
          </div>
        </div>
      )}

      {items.length === 0 && !showAdd && <EmptyState label="No hay credenciales guardadas" />}

      {Object.entries(grouped).map(([cat, creds]) => (
        <div key={cat} className="space-y-2">
          <p className="text-[10px] uppercase tracking-widest text-[#253f60] font-semibold px-1">
            {CRED_LABELS[cat as CredentialCategory]}
          </p>
          {creds.map(item => (
            <div key={item.id} className="bg-[#0d1828] border border-[#1a2d45] rounded-xl p-4">
              <div className="flex items-start justify-between gap-2 mb-3">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-[#060e1a] border border-[#1a2d45] flex items-center justify-center text-[#818cf8]">
                    <KeyRound size={13} />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-white">{item.service_name}</p>
                    {item.service_url && (
                      <a href={safeHref(item.service_url)} target="_blank" rel="noopener noreferrer"
                        className="text-[10px] text-[#334155] hover:text-[#f97316] transition-colors truncate block max-w-[200px]">
                        {item.service_url}
                      </a>
                    )}
                  </div>
                </div>
                <button onClick={() => remove(item.id)} className="text-[#253f60] hover:text-red-400 transition-colors p-1 rounded shrink-0">
                  <Trash2 size={13} />
                </button>
              </div>
              <div className="grid grid-cols-2 gap-x-4 gap-y-2">
                {item.username     && <CredRow label="Usuario"      value={item.username}       reveal={false} />}
                {item.email_used   && <CredRow label="Email"        value={item.email_used}     reveal={false} />}
                {item.password     && <CredRow label="Contraseña"   value={item.password}       reveal />}
                {item.phone_2fa    && <CredRow label="2FA"          value={item.phone_2fa}      reveal={false} />}
                {item.recovery_email && <CredRow label="Recuperación" value={item.recovery_email} reveal={false} />}
              </div>
              {item.notes && <p className="text-xs text-[#334155] mt-2 pt-2 border-t border-[#1a2d45]/50">{item.notes}</p>}
            </div>
          ))}
        </div>
      ))}
    </div>
  )
}

// ── SocialTab ─────────────────────────────────────────────────────────────────

const EMPTY_SOC = {
  platform: 'instagram' as SocialPlatform,
  handle: '', url: '', email_used: '', phone_used: '', followers: '', is_verified: false, notes: '',
}

function SocialTab({ entityId }: { entityId: string }) {
  const [items, setItems]     = useState<VaultSocial[]>([])
  const [loading, setLoading] = useState(true)
  const [showAdd, setShowAdd] = useState(false)
  const [form, setForm]       = useState(EMPTY_SOC)
  const [saving, setSaving]   = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    const res = await fetch(`/api/vault/${entityId}/social`)
    setItems(await res.json())
    setLoading(false)
  }, [entityId])

  useEffect(() => { load() }, [load])

  async function add() {
    setSaving(true)
    await fetch(`/api/vault/${entityId}/social`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...form, followers: form.followers ? Number(form.followers) : null }),
    })
    setSaving(false); setShowAdd(false); setForm(EMPTY_SOC); load()
  }

  async function remove(id: string) {
    await fetch(`/api/vault/${entityId}/social`, {
      method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id }),
    })
    load()
  }

  if (loading) return <LoadingState />

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-white">Redes Sociales</h3>
        <button onClick={() => setShowAdd(s => !s)}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-[#f97316] border border-[#f97316]/30 rounded-md hover:bg-[#f97316]/10 transition-colors">
          <Plus size={12} /> Agregar
        </button>
      </div>

      {showAdd && (
        <div className="bg-[#0d1828] border border-[#1a2d45] rounded-xl p-4 space-y-3">
          <p className="text-xs font-semibold text-[#64748b] uppercase tracking-widest">Nueva red social</p>
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: 'Plataforma', el: (
                <select value={form.platform} onChange={e => setForm(f => ({ ...f, platform: e.target.value as SocialPlatform }))}
                  className="w-full bg-[#060e1a] border border-[#1a2d45] rounded-md px-3 py-1.5 text-sm text-white outline-none">
                  {Object.entries(PLATFORM_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                </select>
              )},
              { label: 'Handle / @', el: <input placeholder="@usuario" value={form.handle} onChange={e => setForm(f => ({ ...f, handle: e.target.value }))} className="w-full bg-[#060e1a] border border-[#1a2d45] rounded-md px-3 py-1.5 text-sm text-white outline-none focus:border-[#f97316]/50" /> },
              { label: 'URL', el: <input placeholder="https://..." value={form.url} onChange={e => setForm(f => ({ ...f, url: e.target.value }))} className="w-full bg-[#060e1a] border border-[#1a2d45] rounded-md px-3 py-1.5 text-sm text-white outline-none focus:border-[#f97316]/50" /> },
              { label: 'Email usado', el: <input type="email" value={form.email_used} onChange={e => setForm(f => ({ ...f, email_used: e.target.value }))} className="w-full bg-[#060e1a] border border-[#1a2d45] rounded-md px-3 py-1.5 text-sm text-white outline-none focus:border-[#f97316]/50" /> },
              { label: 'Teléfono', el: <input value={form.phone_used} onChange={e => setForm(f => ({ ...f, phone_used: e.target.value }))} className="w-full bg-[#060e1a] border border-[#1a2d45] rounded-md px-3 py-1.5 text-sm text-white outline-none focus:border-[#f97316]/50" /> },
              { label: 'Seguidores', el: <input type="number" value={form.followers} onChange={e => setForm(f => ({ ...f, followers: e.target.value }))} className="w-full bg-[#060e1a] border border-[#1a2d45] rounded-md px-3 py-1.5 text-sm text-white outline-none focus:border-[#f97316]/50" /> },
            ].map(({ label, el }) => (
              <div key={label}>
                <label className="text-[10px] text-[#334155] uppercase tracking-widest block mb-1">{label}</label>
                {el}
              </div>
            ))}
            <div className="col-span-2 flex items-center gap-2">
              <input type="checkbox" id="verified" checked={form.is_verified}
                onChange={e => setForm(f => ({ ...f, is_verified: e.target.checked }))} className="w-4 h-4 accent-[#f97316]" />
              <label htmlFor="verified" className="text-sm text-[#94a3b8]">Cuenta verificada</label>
            </div>
            <div className="col-span-2">
              <label className="text-[10px] text-[#334155] uppercase tracking-widest block mb-1">Notas</label>
              <input value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} className="w-full bg-[#060e1a] border border-[#1a2d45] rounded-md px-3 py-1.5 text-sm text-white outline-none focus:border-[#f97316]/50" />
            </div>
          </div>
          <div className="flex gap-2 pt-1">
            <button onClick={() => setShowAdd(false)} className="px-3 py-1.5 text-xs text-[#64748b] border border-[#1a2d45] rounded-md hover:text-white transition-colors">Cancelar</button>
            <button onClick={add} disabled={saving || !form.platform}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-[#f97316] text-[#0d1828] font-semibold rounded-md disabled:opacity-50">
              {saving ? <Loader2 size={12} className="animate-spin" /> : <Save size={12} />} Guardar
            </button>
          </div>
        </div>
      )}

      {items.length === 0 && !showAdd && <EmptyState label="No hay redes sociales guardadas" />}

      <div className="grid grid-cols-2 gap-3">
        {items.map(item => (
          <div key={item.id} className="bg-[#0d1828] border border-[#1a2d45] rounded-xl p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-[#060e1a] border border-[#1a2d45] flex items-center justify-center text-[#f97316]">
                  {SOCIAL_ICONS[item.platform]}
                </div>
                <div>
                  <div className="flex items-center gap-1">
                    <p className="text-sm font-semibold text-white">{PLATFORM_LABELS[item.platform]}</p>
                    {item.is_verified && <BadgeCheck size={13} className="text-[#818cf8]" />}
                  </div>
                  {item.handle && <p className="text-xs text-[#f97316]">{item.handle}</p>}
                </div>
              </div>
              <button onClick={() => remove(item.id)} className="text-[#253f60] hover:text-red-400 transition-colors p-1 rounded">
                <Trash2 size={13} />
              </button>
            </div>
            <div className="space-y-1.5">
              {item.followers != null && (
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] text-[#253f60] uppercase">Seguidores:</span>
                  <span className="text-xs text-[#94a3b8] font-semibold">{item.followers.toLocaleString()}</span>
                </div>
              )}
              {item.email_used && <CredRow label="Email" value={item.email_used} reveal={false} />}
              {item.phone_used && <CredRow label="Teléfono" value={item.phone_used} reveal={false} />}
              {item.url && (
                <a href={safeHref(item.url)} target="_blank" rel="noopener noreferrer"
                  className="text-[10px] text-[#334155] hover:text-[#f97316] transition-colors truncate block">
                  {item.url}
                </a>
              )}
              {item.notes && <p className="text-xs text-[#334155] mt-1">{item.notes}</p>}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ── CustomTab — campos libres ──────────────────────────────────────────────────

const EMPTY_CUSTOM = { label: '', value: '', notes: '' }

function CustomTab({ entityId }: { entityId: string }) {
  const [items, setItems]     = useState<VaultCustomField[]>([])
  const [loading, setLoading] = useState(true)
  const [showAdd, setShowAdd] = useState(false)
  const [form, setForm]       = useState(EMPTY_CUSTOM)
  const [saving, setSaving]   = useState(false)
  const [editId, setEditId]   = useState<string | null>(null)
  const [editForm, setEditForm] = useState(EMPTY_CUSTOM)

  const load = useCallback(async () => {
    setLoading(true)
    const res = await fetch(`/api/vault/${entityId}/custom`)
    setItems(await res.json())
    setLoading(false)
  }, [entityId])

  useEffect(() => { load() }, [load])

  async function add() {
    if (!form.label.trim()) return
    setSaving(true)
    await fetch(`/api/vault/${entityId}/custom`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form),
    })
    setSaving(false); setShowAdd(false); setForm(EMPTY_CUSTOM); load()
  }

  async function update(id: string) {
    await fetch(`/api/vault/${entityId}/custom`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id, ...editForm }),
    })
    setEditId(null); load()
  }

  async function remove(id: string) {
    await fetch(`/api/vault/${entityId}/custom`, {
      method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id }),
    })
    load()
  }

  if (loading) return <LoadingState />

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-white">Datos personalizados</h3>
          <p className="text-[11px] text-[#334155] mt-0.5">Agregá cualquier dato con etiqueta libre</p>
        </div>
        <button onClick={() => setShowAdd(s => !s)}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-[#f97316] border border-[#f97316]/30 rounded-md hover:bg-[#f97316]/10 transition-colors">
          <Plus size={12} /> Agregar
        </button>
      </div>

      {showAdd && (
        <div className="bg-[#0d1828] border border-[#1a2d45] rounded-xl p-4 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] text-[#334155] uppercase tracking-widest block mb-1">Etiqueta</label>
              <input
                placeholder="ej: Número de pasaporte"
                value={form.label}
                onChange={e => setForm(f => ({ ...f, label: e.target.value }))}
                className="w-full bg-[#060e1a] border border-[#1a2d45] rounded-md px-3 py-1.5 text-sm text-white outline-none focus:border-[#f97316]/50"
              />
            </div>
            <div>
              <label className="text-[10px] text-[#334155] uppercase tracking-widest block mb-1">Valor</label>
              <input
                placeholder="ej: AAB123456"
                value={form.value}
                onChange={e => setForm(f => ({ ...f, value: e.target.value }))}
                className="w-full bg-[#060e1a] border border-[#1a2d45] rounded-md px-3 py-1.5 text-sm text-white outline-none focus:border-[#f97316]/50"
              />
            </div>
            <div className="col-span-2">
              <label className="text-[10px] text-[#334155] uppercase tracking-widest block mb-1">Notas</label>
              <input
                placeholder="Opcional..."
                value={form.notes}
                onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                className="w-full bg-[#060e1a] border border-[#1a2d45] rounded-md px-3 py-1.5 text-sm text-white outline-none focus:border-[#f97316]/50"
              />
            </div>
          </div>
          <div className="flex gap-2 pt-1">
            <button onClick={() => { setShowAdd(false); setForm(EMPTY_CUSTOM) }}
              className="px-3 py-1.5 text-xs text-[#64748b] border border-[#1a2d45] rounded-md hover:text-white transition-colors">Cancelar</button>
            <button onClick={add} disabled={saving || !form.label.trim()}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-[#f97316] text-[#0d1828] font-semibold rounded-md disabled:opacity-50">
              {saving ? <Loader2 size={12} className="animate-spin" /> : <Save size={12} />} Guardar
            </button>
          </div>
        </div>
      )}

      {items.length === 0 && !showAdd && <EmptyState label="No hay datos personalizados" />}

      <div className="space-y-2">
        {items.map(item => (
          <div key={item.id} className="bg-[#0d1828] border border-[#1a2d45] rounded-xl p-4">
            {editId === item.id ? (
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] text-[#334155] uppercase tracking-widest block mb-1">Etiqueta</label>
                    <input value={editForm.label} onChange={e => setEditForm(f => ({ ...f, label: e.target.value }))}
                      className="w-full bg-[#060e1a] border border-[#1a2d45] rounded-md px-3 py-1.5 text-sm text-white outline-none focus:border-[#f97316]/50" />
                  </div>
                  <div>
                    <label className="text-[10px] text-[#334155] uppercase tracking-widest block mb-1">Valor</label>
                    <input value={editForm.value} onChange={e => setEditForm(f => ({ ...f, value: e.target.value }))}
                      className="w-full bg-[#060e1a] border border-[#1a2d45] rounded-md px-3 py-1.5 text-sm text-white outline-none focus:border-[#f97316]/50" />
                  </div>
                  <div className="col-span-2">
                    <label className="text-[10px] text-[#334155] uppercase tracking-widest block mb-1">Notas</label>
                    <input value={editForm.notes} onChange={e => setEditForm(f => ({ ...f, notes: e.target.value }))}
                      className="w-full bg-[#060e1a] border border-[#1a2d45] rounded-md px-3 py-1.5 text-sm text-white outline-none focus:border-[#f97316]/50" />
                  </div>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => setEditId(null)}
                    className="px-3 py-1.5 text-xs text-[#64748b] border border-[#1a2d45] rounded-md hover:text-white transition-colors">Cancelar</button>
                  <button onClick={() => update(item.id)}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-[#f97316] text-[#0d1828] font-semibold rounded-md">
                    <Save size={12} /> Guardar
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex items-start gap-3">
                <div className="w-7 h-7 rounded-lg bg-[#060e1a] border border-[#1a2d45] flex items-center justify-center text-[#64748b] shrink-0">
                  <Tag size={12} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] uppercase tracking-widest text-[#334155] mb-0.5">{item.label}</p>
                  <div className="flex items-center gap-1">
                    <p className="text-sm text-[#94a3b8] truncate">{item.value || <span className="text-[#253f60]">—</span>}</p>
                    {item.value && <CopyBtn value={item.value} />}
                  </div>
                  {item.notes && <p className="text-xs text-[#334155] mt-1">{item.notes}</p>}
                </div>
                <div className="flex gap-1 shrink-0">
                  <button onClick={() => { setEditId(item.id); setEditForm({ label: item.label, value: item.value ?? '', notes: item.notes ?? '' }) }}
                    className="text-[#253f60] hover:text-[#64748b] transition-colors p-1 rounded">
                    <Edit3 size={13} />
                  </button>
                  <button onClick={() => remove(item.id)} className="text-[#253f60] hover:text-red-400 transition-colors p-1 rounded">
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

// ── entity helpers ────────────────────────────────────────────────────────────

function EntityIcon({ type }: { type: string }) {
  if (type === 'agencia') return <Building2 size={16} />
  if (type === 'cliente') return <Users size={16} />
  return <User size={16} />
}

function entityColor(type: string) {
  if (type === 'facundo')  return '#f97316'
  if (type === 'mauricio') return '#818cf8'
  if (type === 'agencia')  return '#34d399'
  return '#64748b'
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function VaultPage() {
  usePageTitle('Vault')
  const [entities, setEntities]           = useState<VaultEntity[]>([])
  const [selected, setSelected]           = useState<VaultEntity | null>(null)
  const [activeTab, setActiveTab]         = useState<TabId>('info')
  const [loadingEntities, setLoadingEntities] = useState(true)
  const [showClientAdd, setShowClientAdd] = useState(false)
  const [clientName, setClientName]       = useState('')
  const [addingClient, setAddingClient]   = useState(false)

  useEffect(() => {
    fetch('/api/vault/entities')
      .then(r => r.json())
      .then((data: VaultEntity[]) => {
        setEntities(data)
        if (data.length > 0) setSelected(data[0])
        setLoadingEntities(false)
      })
      .catch(() => setLoadingEntities(false))
  }, [])

  function selectEntity(entity: VaultEntity) {
    setSelected(entity)
    setActiveTab('info')
  }

  async function addClient() {
    if (!clientName.trim()) return
    setAddingClient(true)
    const res = await fetch('/api/vault/entities', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: 'cliente', name: clientName }),
    })
    const newEntity = await res.json()
    setEntities(prev => [...prev, newEntity])
    setSelected(newEntity)
    setActiveTab('info')
    setClientName('')
    setShowClientAdd(false)
    setAddingClient(false)
  }

  const fixed   = entities.filter(e => e.type !== 'cliente')
  const clients = entities.filter(e => e.type === 'cliente')
  const tabs    = selected ? getTabsForType(selected.type) : []

  return (
    <div className="flex flex-col h-full">
      <Header title="Vault" subtitle="Datos personales, financieros y credenciales" />
      <div className="flex flex-1 overflow-hidden">

        {/* Sidebar entidades */}
        <aside className="w-[220px] shrink-0 border-r border-[#1a2d45] flex flex-col bg-[#080f1e]">
          <div className="flex-1 overflow-y-auto p-3 space-y-1">
            <p className="text-[10px] uppercase tracking-widest text-[#253f60] font-semibold px-2 mb-2 mt-1">Equipo</p>
            {fixed.map(entity => (
              <button key={entity.id} onClick={() => selectEntity(entity)}
                className={cls(
                  'w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-left transition-all',
                  selected?.id === entity.id
                    ? 'bg-[#0d1828] border border-[#1a2d45]'
                    : 'hover:bg-[#0d1828]/60 border border-transparent',
                )}>
                <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
                  style={{ background: `${entityColor(entity.type)}15`, color: entityColor(entity.type) }}>
                  <EntityIcon type={entity.type} />
                </div>
                <div className="min-w-0">
                  <p className={cls('text-sm font-medium truncate', selected?.id === entity.id ? 'text-white' : 'text-[#94a3b8]')}>
                    {entity.name}
                  </p>
                  <p className="text-[10px] capitalize" style={{ color: entityColor(entity.type) }}>{entity.type}</p>
                </div>
              </button>
            ))}

            {clients.length > 0 && (
              <div className="pt-3 pb-1">
                <p className="text-[10px] uppercase tracking-widest text-[#253f60] font-semibold px-2">Clientes</p>
              </div>
            )}
            {clients.map(entity => (
              <button key={entity.id} onClick={() => selectEntity(entity)}
                className={cls(
                  'w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-left transition-all',
                  selected?.id === entity.id
                    ? 'bg-[#0d1828] border border-[#1a2d45]'
                    : 'hover:bg-[#0d1828]/60 border border-transparent',
                )}>
                <div className="w-7 h-7 rounded-lg bg-[#64748b]/10 flex items-center justify-center shrink-0 text-[#64748b]">
                  <Users size={14} />
                </div>
                <p className={cls('text-sm font-medium truncate', selected?.id === entity.id ? 'text-white' : 'text-[#94a3b8]')}>
                  {entity.name}
                </p>
              </button>
            ))}

            {showClientAdd && (
              <div className="bg-[#0d1828] border border-[#1a2d45] rounded-xl p-3 space-y-2 mt-1">
                <input
                  placeholder="Nombre del cliente"
                  value={clientName}
                  onChange={e => setClientName(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && addClient()}
                  className="w-full bg-[#060e1a] border border-[#1a2d45] rounded-md px-2 py-1.5 text-xs text-white outline-none focus:border-[#f97316]/50"
                />
                <div className="flex gap-1.5">
                  <button onClick={() => { setShowClientAdd(false); setClientName('') }}
                    className="flex-1 py-1.5 text-xs text-[#64748b] border border-[#1a2d45] rounded-md">✕</button>
                  <button onClick={addClient} disabled={addingClient || !clientName.trim()}
                    className="flex-1 py-1.5 text-xs bg-[#f97316] text-[#0d1828] font-semibold rounded-md disabled:opacity-50">
                    {addingClient ? '...' : 'OK'}
                  </button>
                </div>
              </div>
            )}
          </div>

          <div className="p-3 border-t border-[#1a2d45]">
            <button onClick={() => setShowClientAdd(s => !s)}
              className="w-full flex items-center gap-2 px-3 py-2 text-xs text-[#334155] hover:text-[#f97316] border border-dashed border-[#1a2d45] hover:border-[#f97316]/30 rounded-lg transition-colors">
              <Plus size={12} /> Agregar cliente
            </button>
          </div>
        </aside>

        {/* Contenido principal */}
        <div className="flex-1 overflow-y-auto flex flex-col min-w-0">
          {loadingEntities ? (
            <div className="flex-1 flex items-center justify-center">
              <Loader2 size={24} className="text-[#f97316] animate-spin" />
            </div>
          ) : !selected ? (
            <div className="flex-1 flex items-center justify-center text-[#253f60]">
              <Shield size={40} className="opacity-30" />
            </div>
          ) : (
            <>
              <div className="px-6 pt-6 pb-0">
                <div className="flex items-center gap-3 mb-5">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center"
                    style={{ background: `${entityColor(selected.type)}15`, color: entityColor(selected.type) }}>
                    <EntityIcon type={selected.type} />
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-white">{selected.name}</h2>
                    <p className="text-xs capitalize" style={{ color: entityColor(selected.type) }}>{selected.type}</p>
                  </div>
                </div>

                {/* Tabs dinámicos */}
                <div className="flex gap-1 border-b border-[#1a2d45]">
                  {tabs.map(t => (
                    <button key={t.id} onClick={() => setActiveTab(t.id)}
                      className={cls(
                        'px-4 py-2 text-xs font-semibold transition-all border-b-2 -mb-px',
                        activeTab === t.id
                          ? 'text-[#f97316] border-[#f97316]'
                          : 'text-[#334155] border-transparent hover:text-[#64748b]',
                      )}>
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex-1 p-6">
                {activeTab === 'info'         && <InfoTab        key={selected.id} entityId={selected.id} entityType={selected.type} />}
                {activeTab === 'financiero'   && <FinancialsTab  key={selected.id} entityId={selected.id} />}
                {activeTab === 'credenciales' && <CredentialsTab key={selected.id} entityId={selected.id} />}
                {activeTab === 'redes'        && <SocialTab      key={selected.id} entityId={selected.id} />}
                {activeTab === 'otros'        && <CustomTab      key={selected.id} entityId={selected.id} />}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
