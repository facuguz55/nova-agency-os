import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(_req: Request, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params
  const supabase = await createClient()

  const { data: confirmation, error } = await supabase
    .from('email_confirmations')
    .select('*, actions_log(*)')
    .eq('token', token)
    .single()

  if (error || !confirmation) {
    return new Response(`
      <html><body style="font-family:sans-serif;background:#0f172a;color:#e2e8f0;display:flex;align-items:center;justify-content:center;height:100vh;margin:0">
        <div style="text-align:center;padding:2rem;background:#1e293b;border-radius:1rem;border:1px solid #334155">
          <h2 style="color:#ef4444">Token inválido</h2>
          <p style="color:#475569">Este link de confirmación no existe o ya fue usado.</p>
        </div>
      </body></html>
    `, { headers: { 'Content-Type': 'text/html' } })
  }

  if (confirmation.approved_at) {
    return new Response(`
      <html><body style="font-family:sans-serif;background:#0f172a;color:#e2e8f0;display:flex;align-items:center;justify-content:center;height:100vh;margin:0">
        <div style="text-align:center;padding:2rem;background:#1e293b;border-radius:1rem;border:1px solid #334155">
          <h2 style="color:#22c55e">Ya aprobado</h2>
          <p style="color:#475569">Esta acción ya fue confirmada anteriormente.</p>
        </div>
      </body></html>
    `, { headers: { 'Content-Type': 'text/html' } })
  }

  if (new Date(confirmation.expires_at) < new Date()) {
    return new Response(`
      <html><body style="font-family:sans-serif;background:#0f172a;color:#e2e8f0;display:flex;align-items:center;justify-content:center;height:100vh;margin:0">
        <div style="text-align:center;padding:2rem;background:#1e293b;border-radius:1rem;border:1px solid #334155">
          <h2 style="color:#f97316">Link expirado</h2>
          <p style="color:#475569">Este link de confirmación ha expirado. Solicitá una nueva acción.</p>
        </div>
      </body></html>
    `, { headers: { 'Content-Type': 'text/html' } })
  }

  // Mostrar página de confirmación
  const action = confirmation.actions_log as { description: string; action_type: string } | null
  return new Response(`
    <html>
    <head><title>Confirmar acción — Nova OS</title></head>
    <body style="font-family:sans-serif;background:#0f172a;color:#e2e8f0;display:flex;align-items:center;justify-content:center;height:100vh;margin:0">
      <div style="text-align:center;padding:2rem;background:#1e293b;border-radius:1rem;border:1px solid #334155;max-width:500px;width:90%">
        <div style="width:48px;height:48px;background:rgba(255,140,66,0.1);border:1px solid rgba(255,140,66,0.3);border-radius:12px;display:flex;align-items:center;justify-content:center;margin:0 auto 1rem">
          <svg width="24" height="24" viewBox="0 0 32 32" fill="none"><polygon points="16,2 30,28 2,28" fill="none" stroke="#ff8c42" stroke-width="2" stroke-linejoin="round"/></svg>
        </div>
        <h2 style="color:#fff;margin-bottom:0.5rem">Confirmar acción HIGH RISK</h2>
        <p style="color:#94a3b8;font-size:0.875rem;margin-bottom:1rem">Esta acción fue solicitada en Nova Agency OS</p>
        <div style="background:#0f172a;border:1px solid #334155;border-radius:0.5rem;padding:1rem;margin-bottom:1.5rem;text-align:left">
          <p style="color:#475569;font-size:0.75rem;margin-bottom:0.25rem">ACCIÓN</p>
          <p style="color:#fff;font-size:0.875rem">${action?.description || 'Sin descripción'}</p>
          <p style="color:#475569;font-size:0.75rem;margin-top:0.5rem">Tipo: ${action?.action_type || '—'}</p>
        </div>
        <form method="POST" action="/api/confirm/${token}">
          <button type="submit" style="background:#ff8c42;color:#fff;border:none;padding:0.75rem 2rem;border-radius:0.75rem;font-size:0.875rem;font-weight:600;cursor:pointer;width:100%">
            ✓ Aprobar y ejecutar
          </button>
        </form>
        <p style="color:#334155;font-size:0.75rem;margin-top:1rem">Esta acción es irreversible. Solo aprobá si reconocés esta solicitud.</p>
      </div>
    </body></html>
  `, { headers: { 'Content-Type': 'text/html' } })
}

export async function POST(_req: Request, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params
  const supabase = await createClient()

  const { data: confirmation, error } = await supabase
    .from('email_confirmations')
    .select('*')
    .eq('token', token)
    .single()

  if (error || !confirmation || confirmation.approved_at) {
    return NextResponse.redirect(new URL('/login', process.env.NEXT_PUBLIC_APP_URL!))
  }

  // Aprobar
  await supabase.from('email_confirmations').update({
    approved_at: new Date().toISOString(),
    approved_by: 'email_link',
  }).eq('token', token)

  await supabase.from('actions_log').update({
    status: 'executed',
    result: 'Aprobado vía email de confirmación',
  }).eq('id', confirmation.action_id)

  return new Response(`
    <html><body style="font-family:sans-serif;background:#0f172a;color:#e2e8f0;display:flex;align-items:center;justify-content:center;height:100vh;margin:0">
      <div style="text-align:center;padding:2rem;background:#1e293b;border-radius:1rem;border:1px solid #334155">
        <h2 style="color:#22c55e">✓ Acción aprobada</h2>
        <p style="color:#94a3b8">La acción fue confirmada y ejecutada exitosamente.</p>
        <p style="color:#334155;font-size:0.75rem;margin-top:1rem">Podés cerrar esta ventana.</p>
      </div>
    </body></html>
  `, { headers: { 'Content-Type': 'text/html' } })
}
