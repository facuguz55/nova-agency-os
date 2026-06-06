'use client'

import { useEffect, useState, useCallback } from 'react'
import { usePageTitle } from '@/lib/usePageTitle'
import Header from '@/components/layout/Header'
import {
  Shield, User, Building2, Users, Plus, Trash2, Eye, EyeOff,
  Copy, Check, Globe, CreditCard, Wallet, Landmark,
  KeyRound, AtSign, Phone, MapPin, Calendar, BadgeCheck,
  Loader2, Save, X, Edit3, Tag, AlertTriangle,
} from 'lucide-react'
import type {
  VaultEntity, VaultPersonal, VaultFinancial, VaultCredential,
  VaultSocial, VaultCustomField, FinancialType, CredentialCategory, SocialPlatform,
} from '@/types/vault'

function cls(...c: (string | false | undefined)[]) { return c.filter(Boolean).join(' ') }
function safeHref(url: string) { return /^https?:\/\//i.test(url) ? url : '#' }

// ─── atoms ────────────────────────────────────────────────────────────────────

function CopyBtn({ value }: { value: string }) {
  const [copied, setCopied] = useState(false)
  function copy() {
    navigator.clipboard.writeText(value)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }
  return (
    <button onClick={copy} className="p-1 rounded transition-colors"
      style={{ color: 'var(--text-3)' }}
      onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = 'var(--amber)' }}
      onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = 'var(--text-3)' }}>
      {copied ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
    </button>
  )
}

function RevealField({ value }: { value: string }) {
  const [show, setShow] = useState(false)
  return (
    <div className="flex items-center gap-1.5 min-w-0">
      <span className="font-mono text-xs truncate" style={{ color: 'var(--text-2)' }}>
        {show ? value : '••••••••••••'}
      </span>
      <button onClick={() => setShow(s => !s)} className="p-1 rounded transition-colors shrink-0"
        style={{ color: 'var(--text-3)' }}
        onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = 'var(--amber)' }}
        onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = 'var(--text-3)' }}>
        {show ? <EyeOff size={12} /> : <Eye size={12} />}
      </button>
      {show && <CopyBtn value={value} />}
    </div>
  )
}

interface FieldProps {
  label: string; value: string; editing: boolean; onChange: (v: string) => void
  icon?: React.ReactNode; inputType?: string
}
function Field({ label, value, editing, onChange, icon, inputType = 'text' }: FieldProps) {
  return (
    <div>
      <label className="text-[10px] uppercase tracking-widest flex items-center gap-1 mb-1"
        style={{ color: 'var(--text-3)' }}>
        {icon}{label}
      </label>
      {editing ? (
        <input
          type={inputType}
          value={value}
          onChange={e => onChange(e.target.value)}
          className="w-full rounded-lg px-3 py-1.5 text-sm outline-none transition-all"
          style={{
            background: 'var(--surface-0)',
            border: '1px solid var(--border)',
            color: 'var(--text)',
          }}
          onFocus={e => { e.currentTarget.style.borderColor = 'rgba(245,158,11,0.4)' }}
          onBlur={e => { e.currentTarget.style.borderColor = 'var(--border)' }}
        />
      ) : (
        <div className="flex items-center gap-1.5 min-w-0">
          <p className="text-sm truncate" style={{ color: value ? 'var(--text-2)' : 'var(--text-4)' }}>
            {value || '—'}
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
      <p className="text-[10px] uppercase tracking-widest mb-0.5" style={{ color: 'var(--text-4)' }}>{label}</p>
      {reveal ? <RevealField value={value} /> : (
        <div className="flex items-center gap-1">
          <span className="text-xs truncate" style={{ color: 'var(--text-2)' }}>{value}</span>
          <CopyBtn value={value} />
        </div>
      )}
    </div>
  )
}

function LoadingState() {
  return (
    <div className="flex items-center justify-center h-32">
      <Loader2 size={20} className="animate-spin" style={{ color: 'var(--amber)' }} />
    </div>
  )
}

function EmptyState({ label }: { label: string }) {
  return (
    <div className="flex flex-col items-center justify-center h-24 text-center">
      <Shield size={24} className="mb-2" style={{ color: 'var(--text-4)' }} />
      <p className="text-sm" style={{ color: 'var(--text-3)' }}>{label}</p>
    </div>
  )
}

// ─── constantes ───────────────────────────────────────────────────────────────

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

// ─── estilos compartidos ──────────────────────────────────────────────────────

const inputCls = "w-full rounded-lg px-3 py-1.5 text-sm outline-none transition-all"
const inputStyle = {
  background: 'var(--surface-0)',
  border: '1px solid var(--border)',
  color: 'var(--text)',
}
const cardStyle = {
  background: 'var(--surface-0)',
  border: '1px solid var(--border)',
}
const addFormStyle = {
  background: 'var(--surface-1)',
  border: '1px solid var(--border)',
}

function SmallInput({ value, onChange, placeholder, type = 'text' }: { value: string; onChange: (v: string) => void; placeholder?: string; type?: string }) {
  return (
    <input type={type} value={value} placeholder={placeholder}
      onChange={e => onChange(e.target.value)}
      className={inputCls} style={inputStyle}
      onFocus={e => { e.currentTarget.style.borderColor = 'rgba(245,158,11,0.4)' }}
      onBlur={e => { e.currentTarget.style.borderColor = 'var(--border)' }}
    />
  )
}

function SmallSelect({ value, onChange, children }: { value: string; onChange: (v: string) => void; children: React.ReactNode }) {
  return (
    <select value={value} onChange={e => onChange(e.target.value)}
      className={inputCls} style={inputStyle}>
      {children}
    </select>
  )
}

function FieldLabel({ children }: { children: React.ReactNode }) {
  return <label className="text-[10px] uppercase tracking-widest block mb-1" style={{ color: 'var(--text-3)' }}>{children}</label>
}

function AddBtn({ onClick, label }: { onClick: () => void; label: string }) {
  return (
    <button onClick={onClick}
      className="flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-lg border transition-all"
      style={{ color: 'var(--amber)', border: '1px solid rgba(245,158,11,0.25)', background: 'transparent' }}
      onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(245,158,11,0.06)' }}
      onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'transparent' }}>
      <Plus size={12} /> {label}
    </button>
  )
}

function CancelBtn({ onClick }: { onClick: () => void }) {
  return (
    <button onClick={onClick}
      className="px-3 py-1.5 text-xs rounded-lg border transition-colors"
      style={{ color: 'var(--text-3)', border: '1px solid var(--border)', background: 'transparent' }}>
      Cancelar
    </button>
  )
}

function SaveBtn({ onClick, saving, disabled }: { onClick: () => void; saving: boolean; disabled?: boolean }) {
  return (
    <button onClick={onClick} disabled={saving || disabled}
      className="flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-lg font-semibold transition-all disabled:opacity-50"
      style={{ background: 'var(--amber)', color: '#000' }}>
      {saving ? <Loader2 size={12} className="animate-spin" /> : <Save size={12} />} Guardar
    </button>
  )
}

// ─── tabs ─────────────────────────────────────────────────────────────────────

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

// ─── InfoTab ──────────────────────────────────────────────────────────────────

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

  function f(field: keyof VaultPersonal) { return (form[field] as string) ?? '' }
  function set(field: keyof VaultPersonal) { return (v: string) => setForm(prev => ({ ...prev, [field]: v })) }

  if (loading) return <LoadingState />

  const isAgencia = entityType === 'agencia'
  const isPerson  = entityType === 'facundo' || entityType === 'mauricio'

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold" style={{ color: 'var(--text)' }}>
          {isAgencia ? 'Información de la Agencia' : entityType === 'cliente' ? 'Datos de Contacto' : 'Datos Personales'}
        </h3>
        <div className="flex gap-2">
          {editing ? (
            <>
              <button onClick={() => { setEditing(false); setForm(data ?? {}) }}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-lg border transition-colors"
                style={{ color: 'var(--text-3)', border: '1px solid var(--border)' }}>
                <X size={12} /> Cancelar
              </button>
              <button onClick={save} disabled={saving}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-lg font-semibold transition-colors disabled:opacity-50"
                style={{ background: 'var(--amber)', color: '#000' }}>
                {saving ? <Loader2 size={12} className="animate-spin" /> : <Save size={12} />} Guardar
              </button>
            </>
          ) : (
            <button onClick={() => setEditing(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-lg border transition-colors"
              style={{ color: 'var(--text-3)', border: '1px solid var(--border)' }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = 'var(--text)' }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = 'var(--text-3)' }}>
              <Edit3 size={12} /> Editar
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Field label={isAgencia ? 'Razón Social' : 'Nombre completo'} value={f('full_name')} editing={editing} onChange={set('full_name')} icon={<User size={10} />} />
        <Field label="Email" value={f('email')} editing={editing} onChange={set('email')} icon={<AtSign size={10} />} inputType="email" />
        <Field label="Teléfono" value={f('phone')} editing={editing} onChange={set('phone')} icon={<Phone size={10} />} />
        <Field label="WhatsApp" value={f('whatsapp')} editing={editing} onChange={set('whatsapp')} icon={<Phone size={10} />} />
        {isPerson && (
          <>
            <Field label="DNI" value={f('dni')} editing={editing} onChange={set('dni')} />
            <Field label="CUIT" value={f('cuit')} editing={editing} onChange={set('cuit')} />
            <Field label="Fecha de nacimiento" value={f('birth_date')} editing={editing} onChange={set('birth_date')} icon={<Calendar size={10} />} inputType="date" />
            <Field label="Nacionalidad" value={f('nationality')} editing={editing} onChange={set('nationality')} />
          </>
        )}
        {!isPerson && <Field label="CUIT" value={f('cuit')} editing={editing} onChange={set('cuit')} />}
        <Field label="Dirección" value={f('address')} editing={editing} onChange={set('address')} icon={<MapPin size={10} />} />
        <Field label="Ciudad" value={f('city')} editing={editing} onChange={set('city')} icon={<MapPin size={10} />} />
        <Field label="Provincia" value={f('province')} editing={editing} onChange={set('province')} />
        <Field label="País" value={f('country')} editing={editing} onChange={set('country')} />
      </div>

      <div>
        <label className="text-[10px] uppercase tracking-widest block mb-1" style={{ color: 'var(--text-3)' }}>Notas</label>
        {editing ? (
          <textarea
            value={form.notes ?? ''}
            onChange={e => setForm(p => ({ ...p, notes: e.target.value }))}
            rows={3}
            className="w-full rounded-lg px-3 py-2 text-sm outline-none resize-none"
            style={{ background: 'var(--surface-0)', border: '1px solid var(--border)', color: 'var(--text)' }}
            onFocus={e => { e.currentTarget.style.borderColor = 'rgba(245,158,11,0.4)' }}
            onBlur={e => { e.currentTarget.style.borderColor = 'var(--border)' }}
          />
        ) : (
          <p className="text-sm" style={{ color: 'var(--text-2)' }}>{data?.notes || <span style={{ color: 'var(--text-4)' }}>—</span>}</p>
        )}
      </div>
    </div>
  )
}

// ─── FinancialsTab ─────────────────────────────────────────────────────────────

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
        <h3 className="text-sm font-semibold" style={{ color: 'var(--text)' }}>Datos Financieros</h3>
        <AddBtn onClick={() => setShowAdd(s => !s)} label="Agregar" />
      </div>

      {showAdd && (
        <div className="rounded-xl p-4 space-y-3" style={addFormStyle}>
          <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: 'var(--text-3)' }}>Nuevo registro</p>
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: 'Tipo', el: <SmallSelect value={form.type} onChange={v => setForm(f => ({ ...f, type: v as FinancialType }))}>{Object.entries(FINANCIAL_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</SmallSelect> },
              { label: 'Etiqueta', el: <SmallInput value={form.label} onChange={v => setForm(f => ({ ...f, label: v }))} placeholder="ej: Cuenta Galicia" /> },
              { label: 'Valor / Número', el: <SmallInput value={form.value} onChange={v => setForm(f => ({ ...f, value: v }))} placeholder="CBU, alias..." /> },
              { label: 'Banco', el: <SmallInput value={form.bank_name} onChange={v => setForm(f => ({ ...f, bank_name: v }))} placeholder="ej: Banco Galicia" /> },
              { label: 'Moneda', el: <SmallSelect value={form.currency} onChange={v => setForm(f => ({ ...f, currency: v }))}><option>ARS</option><option>USD</option><option>EUR</option><option>USDT</option></SmallSelect> },
              { label: 'Notas', el: <SmallInput value={form.notes} onChange={v => setForm(f => ({ ...f, notes: v }))} placeholder="Opcional..." /> },
            ].map(({ label, el }) => (
              <div key={label}><FieldLabel>{label}</FieldLabel>{el}</div>
            ))}
          </div>
          <div className="flex gap-2 pt-1">
            <CancelBtn onClick={() => setShowAdd(false)} />
            <SaveBtn onClick={add} saving={saving} disabled={!form.label} />
          </div>
        </div>
      )}

      {items.length === 0 && !showAdd && <EmptyState label="No hay datos financieros" />}

      <div className="space-y-2">
        {items.map(item => (
          <div key={item.id} className="rounded-xl p-4 flex items-start gap-3" style={cardStyle}>
            <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
              style={{ background: 'var(--surface-2)', border: '1px solid var(--border)', color: 'var(--amber)' }}>
              {FIN_ICONS[item.type]}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <p className="text-sm font-semibold" style={{ color: 'var(--text)' }}>{item.label}</p>
                <span className="text-[10px] px-1.5 py-0.5 rounded" style={{ background: 'var(--surface-2)', color: 'var(--text-3)' }}>{FINANCIAL_LABELS[item.type]}</span>
                {item.currency !== 'ARS' && <span className="text-[10px] px-1.5 py-0.5 rounded" style={{ background: 'rgba(245,158,11,0.1)', color: 'var(--amber)' }}>{item.currency}</span>}
              </div>
              {item.bank_name && <p className="text-xs mb-1" style={{ color: 'var(--text-3)' }}>{item.bank_name}</p>}
              {item.value && (
                <div className="flex items-center gap-1">
                  <span className="text-[10px] uppercase" style={{ color: 'var(--text-4)' }}>Valor:</span>
                  <RevealField value={item.value} />
                </div>
              )}
              {item.notes && <p className="text-xs mt-1" style={{ color: 'var(--text-3)' }}>{item.notes}</p>}
            </div>
            <button onClick={() => remove(item.id)} className="p-1 rounded transition-colors shrink-0"
              style={{ color: 'var(--text-3)' }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = '#ef4444' }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = 'var(--text-3)' }}>
              <Trash2 size={13} />
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── CredentialsTab ───────────────────────────────────────────────────────────

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
        <h3 className="text-sm font-semibold" style={{ color: 'var(--text)' }}>Credenciales y Accesos</h3>
        <AddBtn onClick={() => setShowAdd(s => !s)} label="Agregar" />
      </div>

      {showAdd && (
        <div className="rounded-xl p-4 space-y-3" style={addFormStyle}>
          <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: 'var(--text-3)' }}>Nueva credencial</p>
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: 'Categoría', el: <SmallSelect value={form.category} onChange={v => setForm(f => ({ ...f, category: v as CredentialCategory }))}>{Object.entries(CRED_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</SmallSelect> },
              { label: 'Servicio', el: <SmallInput value={form.service_name} onChange={v => setForm(f => ({ ...f, service_name: v }))} placeholder="ej: Instagram Nova" /> },
              { label: 'URL', el: <SmallInput value={form.service_url} onChange={v => setForm(f => ({ ...f, service_url: v }))} placeholder="https://..." /> },
              { label: 'Usuario', el: <SmallInput value={form.username} onChange={v => setForm(f => ({ ...f, username: v }))} /> },
              { label: 'Email usado', el: <SmallInput value={form.email_used} onChange={v => setForm(f => ({ ...f, email_used: v }))} type="email" /> },
              { label: 'Contraseña', el: <SmallInput value={form.password} onChange={v => setForm(f => ({ ...f, password: v }))} type="password" /> },
              { label: 'Teléfono 2FA', el: <SmallInput value={form.phone_2fa} onChange={v => setForm(f => ({ ...f, phone_2fa: v }))} /> },
              { label: 'Email recuperación', el: <SmallInput value={form.recovery_email} onChange={v => setForm(f => ({ ...f, recovery_email: v }))} type="email" /> },
            ].map(({ label, el }) => (
              <div key={label}><FieldLabel>{label}</FieldLabel>{el}</div>
            ))}
            <div className="col-span-2">
              <FieldLabel>Notas</FieldLabel>
              <SmallInput value={form.notes} onChange={v => setForm(f => ({ ...f, notes: v }))} />
            </div>
          </div>
          <div className="flex gap-2 pt-1">
            <CancelBtn onClick={() => setShowAdd(false)} />
            <SaveBtn onClick={add} saving={saving} disabled={!form.service_name} />
          </div>
        </div>
      )}

      {items.length === 0 && !showAdd && <EmptyState label="No hay credenciales guardadas" />}

      {Object.entries(grouped).map(([cat, creds]) => (
        <div key={cat} className="space-y-2">
          <p className="text-[10px] uppercase tracking-widest font-semibold px-1" style={{ color: 'var(--text-4)' }}>
            {CRED_LABELS[cat as CredentialCategory]}
          </p>
          {creds.map(item => (
            <div key={item.id} className="rounded-xl p-4" style={cardStyle}>
              <div className="flex items-start justify-between gap-2 mb-3">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg flex items-center justify-center"
                    style={{ background: 'var(--surface-2)', border: '1px solid var(--border)', color: '#818cf8' }}>
                    <KeyRound size={13} />
                  </div>
                  <div>
                    <p className="text-sm font-semibold" style={{ color: 'var(--text)' }}>{item.service_name}</p>
                    {item.service_url && (
                      <a href={safeHref(item.service_url)} target="_blank" rel="noopener noreferrer"
                        className="text-[10px] truncate block max-w-[200px] transition-colors"
                        style={{ color: 'var(--text-3)' }}
                        onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = 'var(--amber)' }}
                        onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = 'var(--text-3)' }}>
                        {item.service_url}
                      </a>
                    )}
                  </div>
                </div>
                <button onClick={() => remove(item.id)} className="p-1 rounded transition-colors shrink-0"
                  style={{ color: 'var(--text-3)' }}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = '#ef4444' }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = 'var(--text-3)' }}>
                  <Trash2 size={13} />
                </button>
              </div>
              <div className="grid grid-cols-2 gap-x-4 gap-y-2">
                {item.username      && <CredRow label="Usuario"      value={item.username}       reveal={false} />}
                {item.email_used    && <CredRow label="Email"        value={item.email_used}     reveal={false} />}
                {item.password      && <CredRow label="Contraseña"   value={item.password}       reveal />}
                {item.phone_2fa     && <CredRow label="2FA"          value={item.phone_2fa}      reveal={false} />}
                {item.recovery_email && <CredRow label="Recuperación" value={item.recovery_email} reveal={false} />}
              </div>
              {item.notes && <p className="text-xs mt-2 pt-2" style={{ color: 'var(--text-3)', borderTop: '1px solid var(--border)' }}>{item.notes}</p>}
            </div>
          ))}
        </div>
      ))}
    </div>
  )
}

// ─── SocialTab ────────────────────────────────────────────────────────────────

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
        <h3 className="text-sm font-semibold" style={{ color: 'var(--text)' }}>Redes Sociales</h3>
        <AddBtn onClick={() => setShowAdd(s => !s)} label="Agregar" />
      </div>

      {showAdd && (
        <div className="rounded-xl p-4 space-y-3" style={addFormStyle}>
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: 'Plataforma', el: <SmallSelect value={form.platform} onChange={v => setForm(f => ({ ...f, platform: v as SocialPlatform }))}>{Object.entries(PLATFORM_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</SmallSelect> },
              { label: 'Handle / @', el: <SmallInput value={form.handle} onChange={v => setForm(f => ({ ...f, handle: v }))} placeholder="@usuario" /> },
              { label: 'URL', el: <SmallInput value={form.url} onChange={v => setForm(f => ({ ...f, url: v }))} placeholder="https://..." /> },
              { label: 'Email usado', el: <SmallInput value={form.email_used} onChange={v => setForm(f => ({ ...f, email_used: v }))} type="email" /> },
              { label: 'Teléfono', el: <SmallInput value={form.phone_used} onChange={v => setForm(f => ({ ...f, phone_used: v }))} /> },
              { label: 'Seguidores', el: <SmallInput value={form.followers} onChange={v => setForm(f => ({ ...f, followers: v }))} type="number" /> },
            ].map(({ label, el }) => (
              <div key={label}><FieldLabel>{label}</FieldLabel>{el}</div>
            ))}
            <div className="col-span-2 flex items-center gap-2">
              <input type="checkbox" id="verified" checked={form.is_verified}
                onChange={e => setForm(f => ({ ...f, is_verified: e.target.checked }))}
                className="w-4 h-4 accent-[#f59e0b]" />
              <label htmlFor="verified" className="text-sm" style={{ color: 'var(--text-2)' }}>Cuenta verificada</label>
            </div>
            <div className="col-span-2"><FieldLabel>Notas</FieldLabel><SmallInput value={form.notes} onChange={v => setForm(f => ({ ...f, notes: v }))} /></div>
          </div>
          <div className="flex gap-2 pt-1">
            <CancelBtn onClick={() => setShowAdd(false)} />
            <SaveBtn onClick={add} saving={saving} disabled={!form.platform} />
          </div>
        </div>
      )}

      {items.length === 0 && !showAdd && <EmptyState label="No hay redes sociales guardadas" />}

      <div className="grid grid-cols-2 gap-3">
        {items.map(item => (
          <div key={item.id} className="rounded-xl p-4" style={cardStyle}>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center"
                  style={{ background: 'var(--surface-2)', border: '1px solid var(--border)', color: 'var(--amber)' }}>
                  {SOCIAL_ICONS[item.platform]}
                </div>
                <div>
                  <div className="flex items-center gap-1">
                    <p className="text-sm font-semibold" style={{ color: 'var(--text)' }}>{PLATFORM_LABELS[item.platform]}</p>
                    {item.is_verified && <BadgeCheck size={13} className="text-[#818cf8]" />}
                  </div>
                  {item.handle && <p className="text-xs" style={{ color: 'var(--amber)' }}>{item.handle}</p>}
                </div>
              </div>
              <button onClick={() => remove(item.id)} className="p-1 rounded transition-colors"
                style={{ color: 'var(--text-3)' }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = '#ef4444' }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = 'var(--text-3)' }}>
                <Trash2 size={13} />
              </button>
            </div>
            <div className="space-y-1.5">
              {item.followers != null && (
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] uppercase" style={{ color: 'var(--text-4)' }}>Seguidores:</span>
                  <span className="text-xs font-semibold" style={{ color: 'var(--text-2)' }}>{item.followers.toLocaleString()}</span>
                </div>
              )}
              {item.email_used  && <CredRow label="Email"    value={item.email_used}  reveal={false} />}
              {item.phone_used  && <CredRow label="Teléfono" value={item.phone_used}  reveal={false} />}
              {item.url && (
                <a href={safeHref(item.url)} target="_blank" rel="noopener noreferrer"
                  className="text-[10px] truncate block transition-colors"
                  style={{ color: 'var(--text-3)' }}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = 'var(--amber)' }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = 'var(--text-3)' }}>
                  {item.url}
                </a>
              )}
              {item.notes && <p className="text-xs mt-1" style={{ color: 'var(--text-3)' }}>{item.notes}</p>}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── CustomTab ────────────────────────────────────────────────────────────────

const EMPTY_CUSTOM = { label: '', value: '', notes: '' }

function CustomTab({ entityId }: { entityId: string }) {
  const [items, setItems]       = useState<VaultCustomField[]>([])
  const [loading, setLoading]   = useState(true)
  const [showAdd, setShowAdd]   = useState(false)
  const [form, setForm]         = useState(EMPTY_CUSTOM)
  const [saving, setSaving]     = useState(false)
  const [editId, setEditId]     = useState<string | null>(null)
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
          <h3 className="text-sm font-semibold" style={{ color: 'var(--text)' }}>Datos personalizados</h3>
          <p className="text-[11px] mt-0.5" style={{ color: 'var(--text-3)' }}>Agregá cualquier dato con etiqueta libre</p>
        </div>
        <AddBtn onClick={() => setShowAdd(s => !s)} label="Agregar" />
      </div>

      {showAdd && (
        <div className="rounded-xl p-4 space-y-3" style={addFormStyle}>
          <div className="grid grid-cols-2 gap-3">
            <div><FieldLabel>Etiqueta</FieldLabel><SmallInput value={form.label} onChange={v => setForm(f => ({ ...f, label: v }))} placeholder="ej: Número de pasaporte" /></div>
            <div><FieldLabel>Valor</FieldLabel><SmallInput value={form.value} onChange={v => setForm(f => ({ ...f, value: v }))} placeholder="ej: AAB123456" /></div>
            <div className="col-span-2"><FieldLabel>Notas</FieldLabel><SmallInput value={form.notes} onChange={v => setForm(f => ({ ...f, notes: v }))} placeholder="Opcional..." /></div>
          </div>
          <div className="flex gap-2 pt-1">
            <CancelBtn onClick={() => { setShowAdd(false); setForm(EMPTY_CUSTOM) }} />
            <SaveBtn onClick={add} saving={saving} disabled={!form.label.trim()} />
          </div>
        </div>
      )}

      {items.length === 0 && !showAdd && <EmptyState label="No hay datos personalizados" />}

      <div className="space-y-2">
        {items.map(item => (
          <div key={item.id} className="rounded-xl p-4" style={cardStyle}>
            {editId === item.id ? (
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div><FieldLabel>Etiqueta</FieldLabel><SmallInput value={editForm.label} onChange={v => setEditForm(f => ({ ...f, label: v }))} /></div>
                  <div><FieldLabel>Valor</FieldLabel><SmallInput value={editForm.value} onChange={v => setEditForm(f => ({ ...f, value: v }))} /></div>
                  <div className="col-span-2"><FieldLabel>Notas</FieldLabel><SmallInput value={editForm.notes} onChange={v => setEditForm(f => ({ ...f, notes: v }))} /></div>
                </div>
                <div className="flex gap-2">
                  <CancelBtn onClick={() => setEditId(null)} />
                  <button onClick={() => update(item.id)}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-lg font-semibold"
                    style={{ background: 'var(--amber)', color: '#000' }}>
                    <Save size={12} /> Guardar
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex items-start gap-3">
                <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
                  style={{ background: 'var(--surface-2)', border: '1px solid var(--border)', color: 'var(--text-3)' }}>
                  <Tag size={12} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] uppercase tracking-widest mb-0.5" style={{ color: 'var(--text-3)' }}>{item.label}</p>
                  <div className="flex items-center gap-1">
                    <p className="text-sm truncate" style={{ color: item.value ? 'var(--text-2)' : 'var(--text-4)' }}>{item.value || '—'}</p>
                    {item.value && <CopyBtn value={item.value} />}
                  </div>
                  {item.notes && <p className="text-xs mt-1" style={{ color: 'var(--text-3)' }}>{item.notes}</p>}
                </div>
                <div className="flex gap-1 shrink-0">
                  <button onClick={() => { setEditId(item.id); setEditForm({ label: item.label, value: item.value ?? '', notes: item.notes ?? '' }) }}
                    className="p-1 rounded transition-colors"
                    style={{ color: 'var(--text-3)' }}
                    onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = 'var(--text)' }}
                    onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = 'var(--text-3)' }}>
                    <Edit3 size={13} />
                  </button>
                  <button onClick={() => remove(item.id)} className="p-1 rounded transition-colors"
                    style={{ color: 'var(--text-3)' }}
                    onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = '#ef4444' }}
                    onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = 'var(--text-3)' }}>
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

// ─── entity helpers ───────────────────────────────────────────────────────────

function EntityIcon({ type }: { type: string }) {
  if (type === 'agencia') return <Building2 size={16} />
  if (type === 'cliente') return <Users size={16} />
  return <User size={16} />
}

function entityColor(type: string) {
  if (type === 'facundo')  return '#f59e0b'
  if (type === 'mauricio') return '#818cf8'
  if (type === 'agencia')  return '#34d399'
  return '#666'
}

// ─── Main ─────────────────────────────────────────────────────────────────────

export default function VaultPage() {
  usePageTitle('Vault')
  const [entities, setEntities]           = useState<VaultEntity[]>([])
  const [selected, setSelected]           = useState<VaultEntity | null>(null)
  const [activeTab, setActiveTab]         = useState<TabId>('info')
  const [loadingEntities, setLoadingEntities] = useState(true)
  const [vaultError, setVaultError]       = useState(false)
  const [showClientAdd, setShowClientAdd] = useState(false)
  const [clientName, setClientName]       = useState('')
  const [addingClient, setAddingClient]   = useState(false)

  useEffect(() => {
    fetch('/api/vault/entities')
      .then(async r => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`)
        const data = await r.json()
        const arr: VaultEntity[] = Array.isArray(data) ? data : []
        setEntities(arr)
        if (arr.length > 0) setSelected(arr[0])
        setLoadingEntities(false)
      })
      .catch(() => {
        setVaultError(true)
        setLoadingEntities(false)
      })
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
    <div className="flex flex-col h-full" style={{ background: 'var(--bg)' }}>
      <Header title="Vault" subtitle="Datos personales, financieros y credenciales" />
      <div className="flex flex-1 overflow-hidden">

        {/* Sidebar entidades */}
        <aside className="w-[220px] shrink-0 flex flex-col"
          style={{ background: 'var(--surface-0)', borderRight: '1px solid var(--border)' }}>
          <div className="flex-1 overflow-y-auto p-3 space-y-1">
            <p className="text-[10px] uppercase tracking-widest font-semibold px-2 mb-2 mt-1"
              style={{ color: 'var(--text-4)', fontFamily: 'var(--font-display)' }}>Equipo</p>
            {fixed.map(entity => (
              <button key={entity.id} onClick={() => selectEntity(entity)}
                className={cls('w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-left transition-all')}
                style={{
                  background: selected?.id === entity.id ? 'var(--surface-2)' : 'transparent',
                  border: selected?.id === entity.id ? '1px solid var(--border)' : '1px solid transparent',
                }}>
                <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
                  style={{ background: `${entityColor(entity.type)}12`, color: entityColor(entity.type) }}>
                  <EntityIcon type={entity.type} />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium truncate"
                    style={{ color: selected?.id === entity.id ? 'var(--text)' : 'var(--text-2)' }}>
                    {entity.name}
                  </p>
                  <p className="text-[10px] capitalize" style={{ color: entityColor(entity.type) }}>{entity.type}</p>
                </div>
              </button>
            ))}

            {clients.length > 0 && (
              <div className="pt-3 pb-1">
                <p className="text-[10px] uppercase tracking-widest font-semibold px-2"
                  style={{ color: 'var(--text-4)', fontFamily: 'var(--font-display)' }}>Clientes</p>
              </div>
            )}
            {clients.map(entity => (
              <button key={entity.id} onClick={() => selectEntity(entity)}
                className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-left transition-all"
                style={{
                  background: selected?.id === entity.id ? 'var(--surface-2)' : 'transparent',
                  border: selected?.id === entity.id ? '1px solid var(--border)' : '1px solid transparent',
                }}>
                <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
                  style={{ background: 'rgba(255,255,255,0.05)', color: 'var(--text-3)' }}>
                  <Users size={14} />
                </div>
                <p className="text-sm font-medium truncate"
                  style={{ color: selected?.id === entity.id ? 'var(--text)' : 'var(--text-2)' }}>
                  {entity.name}
                </p>
              </button>
            ))}

            {showClientAdd && (
              <div className="rounded-xl p-3 space-y-2 mt-1" style={addFormStyle}>
                <input
                  placeholder="Nombre del cliente"
                  value={clientName}
                  onChange={e => setClientName(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && addClient()}
                  className="w-full rounded-lg px-2 py-1.5 text-xs outline-none"
                  style={{ background: 'var(--surface-0)', border: '1px solid var(--border)', color: 'var(--text)' }}
                />
                <div className="flex gap-1.5">
                  <button onClick={() => { setShowClientAdd(false); setClientName('') }}
                    className="flex-1 py-1.5 text-xs rounded-lg border"
                    style={{ color: 'var(--text-3)', border: '1px solid var(--border)' }}>✕</button>
                  <button onClick={addClient} disabled={addingClient || !clientName.trim()}
                    className="flex-1 py-1.5 text-xs rounded-lg font-semibold disabled:opacity-50"
                    style={{ background: 'var(--amber)', color: '#000' }}>
                    {addingClient ? '...' : 'OK'}
                  </button>
                </div>
              </div>
            )}
          </div>

          <div className="p-3" style={{ borderTop: '1px solid var(--border)' }}>
            <button onClick={() => setShowClientAdd(s => !s)}
              className="w-full flex items-center gap-2 px-3 py-2 text-xs rounded-lg border border-dashed transition-colors"
              style={{ color: 'var(--text-3)', borderColor: 'var(--border)' }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = 'var(--amber)'; (e.currentTarget as HTMLElement).style.borderColor = 'rgba(245,158,11,0.3)' }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = 'var(--text-3)'; (e.currentTarget as HTMLElement).style.borderColor = 'var(--border)' }}>
              <Plus size={12} /> Agregar cliente
            </button>
          </div>
        </aside>

        {/* Contenido principal */}
        <div className="flex-1 overflow-y-auto flex flex-col min-w-0">
          {loadingEntities ? (
            <div className="flex-1 flex items-center justify-center">
              <Loader2 size={24} className="animate-spin" style={{ color: 'var(--amber)' }} />
            </div>
          ) : vaultError ? (
            <div className="flex-1 flex flex-col items-center justify-center gap-4 p-8 text-center">
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center"
                style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)' }}>
                <AlertTriangle size={20} className="text-red-400" />
              </div>
              <div>
                <p className="font-semibold" style={{ color: 'var(--text)' }}>No se pudo cargar el Vault</p>
                <p className="text-sm mt-1" style={{ color: 'var(--text-3)' }}>
                  Las tablas del vault pueden no estar creadas en Supabase todavía. Verificá la conexión y los permisos.
                </p>
              </div>
            </div>
          ) : !selected ? (
            <div className="flex-1 flex items-center justify-center">
              <Shield size={40} style={{ color: 'var(--text-4)', opacity: 0.3 }} />
            </div>
          ) : (
            <>
              <div className="px-6 pt-6 pb-0">
                <div className="flex items-center gap-3 mb-5">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center"
                    style={{ background: `${entityColor(selected.type)}12`, color: entityColor(selected.type) }}>
                    <EntityIcon type={selected.type} />
                  </div>
                  <div>
                    <h2 className="text-base font-bold" style={{ color: 'var(--text)' }}>{selected.name}</h2>
                    <p className="text-xs capitalize" style={{ color: entityColor(selected.type) }}>{selected.type}</p>
                  </div>
                </div>

                {/* Tabs */}
                <div className="flex gap-1" style={{ borderBottom: '1px solid var(--border)' }}>
                  {tabs.map(t => (
                    <button key={t.id} onClick={() => setActiveTab(t.id)}
                      className="px-4 py-2 text-xs font-semibold transition-all border-b-2 -mb-px"
                      style={{
                        color: activeTab === t.id ? 'var(--amber)' : 'var(--text-3)',
                        borderColor: activeTab === t.id ? 'var(--amber)' : 'transparent',
                      }}>
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
