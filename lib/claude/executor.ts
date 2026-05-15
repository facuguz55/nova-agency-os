import { createClient } from '@/lib/supabase/server'
import Anthropic from '@anthropic-ai/sdk'

export async function executeTool(name: string, input: Record<string, unknown>): Promise<string> {
  const supabase = await createClient()

  try {
    switch (name) {

      // ── CLIENTES ──────────────────────────────────────────
      case 'create_client': {
        const { data, error } = await supabase.from('clients').insert({
          name:           input.name as string,
          email:          (input.email as string) || null,
          industry:       (input.industry as string) || null,
          contact_person: (input.contact_person as string) || null,
          status:         (input.status as string) || 'active',
          notes:          (input.notes as string) || null,
        }).select().single()
        if (error) return `Error al crear cliente: ${error.message}`
        await logAction(supabase, `Cliente creado via IA: ${input.name}`)
        return `✅ Cliente "${data.name}" creado (ID: ${data.id})`
      }

      case 'list_clients': {
        let query = supabase.from('clients').select('name, email, industry, status, contact_person').order('created_at', { ascending: false }).limit(20)
        if (input.status) query = query.eq('status', input.status as string)
        const { data, error } = await query
        if (error) return `Error: ${error.message}`
        if (!data?.length) return 'No hay clientes registrados.'
        return JSON.stringify(data, null, 2)
      }

      // ── PROYECTOS ─────────────────────────────────────────
      case 'create_project': {
        const { data: clients } = await supabase.from('clients').select('id, name').ilike('name', `%${input.client_name}%`).limit(1)
        if (!clients?.length) return `No encontré un cliente llamado "${input.client_name}". ¿Querés que primero lo cree?`
        const { data, error } = await supabase.from('projects').insert({
          name:        input.name as string,
          client_id:   clients[0].id,
          status:      (input.status as string) || 'planning',
          description: (input.description as string) || null,
          budget:      (input.budget as number) || null,
        }).select().single()
        if (error) return `Error al crear proyecto: ${error.message}`
        await logAction(supabase, `Proyecto creado via IA: ${input.name} (cliente: ${clients[0].name})`)
        return `✅ Proyecto "${data.name}" creado para "${clients[0].name}" — estado: ${data.status}`
      }

      case 'list_projects': {
        let query = supabase.from('projects').select('id, name, status, description, budget, clients(name)').is('parent_id', null).order('created_at', { ascending: false }).limit(20)
        if (input.status) query = query.eq('status', input.status as string)
        const { data, error } = await query
        if (error) return `Error: ${error.message}`
        if (!data?.length) return 'No hay proyectos registrados.'
        // Incluir subproyectos de cada proyecto
        const withSubs = await Promise.all((data || []).map(async (p: { id: string; name: string; status: string; description: string | null; budget: number | null; clients: { name: string } | { name: string }[] | null }) => {
          const { data: subs } = await supabase.from('projects').select('name, status, budget, description').eq('parent_id', p.id)
          return { ...p, subproyectos: subs || [] }
        }))
        return JSON.stringify(withSubs, null, 2)
      }

      case 'list_subprojects': {
        const { data: projects } = await supabase.from('projects').select('id, name').ilike('name', `%${input.project_name}%`).is('parent_id', null).limit(1)
        if (!projects?.length) return `No encontré un proyecto llamado "${input.project_name}".`
        const { data, error } = await supabase.from('projects').select('name, status, budget, description, add_to_budget').eq('parent_id', projects[0].id)
        if (error) return `Error: ${error.message}`
        if (!data?.length) return `El proyecto "${projects[0].name}" no tiene subproyectos todavía.`
        return `Subproyectos de "${projects[0].name}":\n${JSON.stringify(data, null, 2)}`
      }

      case 'create_subproject': {
        const { data: parents } = await supabase.from('projects').select('id, name, client_id').ilike('name', `%${input.project_name}%`).is('parent_id', null).limit(1)
        if (!parents?.length) return `No encontré un proyecto llamado "${input.project_name}".`
        const { data, error } = await supabase.from('projects').insert({
          name:          input.name as string,
          parent_id:     parents[0].id,
          client_id:     parents[0].client_id,
          status:        (input.status as string) || 'planning',
          description:   (input.description as string) || null,
          budget:        (input.budget as number) || null,
          add_to_budget: (input.add_to_budget as boolean) ?? true,
        }).select().single()
        if (error) return `Error al crear subproyecto: ${error.message}`
        await logAction(supabase, `Subproyecto creado via IA: ${input.name} (dentro de ${parents[0].name})`)
        return `✅ Subproyecto "${data.name}" creado dentro de "${parents[0].name}"`
      }

      case 'create_calendar_event': {
        let clientId  = null
        let projectId = null
        if (input.client_name) {
          const { data } = await supabase.from('clients').select('id').ilike('name', `%${input.client_name}%`).limit(1)
          if (data?.length) clientId = data[0].id
        }
        if (input.project_name) {
          const { data } = await supabase.from('projects').select('id').ilike('name', `%${input.project_name}%`).limit(1)
          if (data?.length) projectId = data[0].id
        }
        const { data, error } = await supabase.from('tasks').insert({
          title:       input.title as string,
          description: (input.description as string) || null,
          status:      'todo',
          priority:    (input.priority as string) || 'medium',
          due_date:    input.due_date as string,
          client_id:   clientId,
          project_id:  projectId,
        }).select().single()
        if (error) return `Error al crear evento: ${error.message}`
        await logAction(supabase, `Evento de calendario creado via IA: ${input.title} — ${input.due_date}`)
        return `✅ Evento "${data.title}" agregado al calendario para el ${input.due_date}`
      }

      case 'update_project': {
        const { data: projects } = await supabase.from('projects').select('id, name').ilike('name', `%${input.project_name}%`).limit(1)
        if (!projects?.length) return `No encontré un proyecto llamado "${input.project_name}".`
        const updates: Record<string, unknown> = {}
        if (input.status)      updates.status      = input.status
        if (input.description) updates.description = input.description
        if (input.budget)      updates.budget      = input.budget
        const { error } = await supabase.from('projects').update(updates).eq('id', projects[0].id)
        if (error) return `Error al actualizar: ${error.message}`
        return `✅ Proyecto "${projects[0].name}" actualizado.`
      }

      // ── TAREAS ────────────────────────────────────────────
      case 'create_task': {
        let clientId  = null
        let projectId = null

        if (input.client_name) {
          const { data } = await supabase.from('clients').select('id, name').ilike('name', `%${input.client_name}%`).limit(1)
          if (data?.length) clientId = data[0].id
        }
        if (input.project_name) {
          const { data } = await supabase.from('projects').select('id, name').ilike('name', `%${input.project_name}%`).limit(1)
          if (data?.length) projectId = data[0].id
        }

        const { data, error } = await supabase.from('tasks').insert({
          title:       input.title as string,
          description: (input.description as string) || null,
          status:      (input.status as string) || 'todo',
          priority:    (input.priority as string) || 'medium',
          assigned_to: (input.assigned_to as string) || null,
          client_id:   clientId,
          project_id:  projectId,
          due_date:    (input.due_date as string) || null,
        }).select().single()

        if (error) return `Error al crear tarea: ${error.message}`
        await logAction(supabase, `Tarea creada via IA: ${input.title}`)
        return `✅ Tarea "${data.title}" creada — prioridad: ${data.priority}, estado: ${data.status}${data.due_date ? `, vence: ${data.due_date}` : ''}`
      }

      case 'list_tasks': {
        let query = supabase.from('tasks').select('title, status, priority, due_date, assigned_to, projects(name), clients(name)').order('due_date', { ascending: true, nullsFirst: false }).limit(30)
        if (input.status)   query = query.eq('status', input.status as string)
        if (input.priority) query = query.eq('priority', input.priority as string)
        if (input.client_name) {
          const { data: clients } = await supabase.from('clients').select('id').ilike('name', `%${input.client_name}%`).limit(1)
          if (clients?.length) query = query.eq('client_id', clients[0].id)
        }
        if (input.project_name) {
          const { data: projects } = await supabase.from('projects').select('id').ilike('name', `%${input.project_name}%`).limit(1)
          if (projects?.length) query = query.eq('project_id', projects[0].id)
        }
        const { data, error } = await query
        if (error) return `Error: ${error.message}`
        if (!data?.length) return 'No hay tareas con esos filtros.'
        return JSON.stringify(data, null, 2)
      }

      case 'update_task': {
        const { data: tasks } = await supabase.from('tasks').select('id, title').ilike('title', `%${input.task_title}%`).limit(1)
        if (!tasks?.length) return `No encontré una tarea con título "${input.task_title}".`
        const updates: Record<string, unknown> = {}
        if (input.status)      updates.status      = input.status
        if (input.priority)    updates.priority    = input.priority
        if (input.description) updates.description = input.description
        if (input.due_date)    updates.due_date    = input.due_date
        if (input.assigned_to) updates.assigned_to = input.assigned_to
        const { error } = await supabase.from('tasks').update(updates).eq('id', tasks[0].id)
        if (error) return `Error al actualizar tarea: ${error.message}`
        await logAction(supabase, `Tarea actualizada via IA: ${tasks[0].title}`)
        return `✅ Tarea "${tasks[0].title}" actualizada.`
      }

      case 'delete_task': {
        const { data: tasks } = await supabase.from('tasks').select('id, title').ilike('title', `%${input.task_title}%`).limit(1)
        if (!tasks?.length) return `No encontré una tarea con título "${input.task_title}".`
        const { error } = await supabase.from('tasks').delete().eq('id', tasks[0].id)
        if (error) return `Error al eliminar tarea: ${error.message}`
        await logAction(supabase, `Tarea eliminada via IA: ${tasks[0].title}`)
        return `✅ Tarea "${tasks[0].title}" eliminada.`
      }

      // ── NOTAS ─────────────────────────────────────────────
      case 'create_note': {
        let clientId  = null
        let projectId = null
        if (input.client_name) {
          const { data } = await supabase.from('clients').select('id').ilike('name', `%${input.client_name}%`).limit(1)
          if (data?.length) clientId = data[0].id
        }
        if (input.project_name) {
          const { data } = await supabase.from('projects').select('id').ilike('name', `%${input.project_name}%`).limit(1)
          if (data?.length) projectId = data[0].id
        }
        const { data, error } = await supabase.from('notes').insert({
          title:      input.title as string,
          content:    (input.content as string) || null,
          client_id:  clientId,
          project_id: projectId,
        }).select().single()
        if (error) return `Error al crear nota: ${error.message}`
        await logAction(supabase, `Nota creada via IA: ${input.title}`)
        return `✅ Nota "${data.title}" creada (ID: ${data.id})`
      }

      case 'list_notes': {
        let query = supabase.from('notes').select('title, content, updated_at, projects(name), clients(name)').order('updated_at', { ascending: false }).limit(20)
        if (input.search) query = query.or(`title.ilike.%${input.search}%,content.ilike.%${input.search}%`)
        if (input.client_name) {
          const { data: clients } = await supabase.from('clients').select('id').ilike('name', `%${input.client_name}%`).limit(1)
          if (clients?.length) query = query.eq('client_id', clients[0].id)
        }
        if (input.project_name) {
          const { data: projects } = await supabase.from('projects').select('id').ilike('name', `%${input.project_name}%`).limit(1)
          if (projects?.length) query = query.eq('project_id', projects[0].id)
        }
        const { data, error } = await query
        if (error) return `Error: ${error.message}`
        if (!data?.length) return 'No hay notas con esos filtros.'
        return JSON.stringify(data.map(n => ({ ...n, content: n.content?.slice(0, 120) })), null, 2)
      }

      case 'delete_note': {
        const { data: notes } = await supabase.from('notes').select('id, title').ilike('title', `%${input.note_title}%`).limit(1)
        if (!notes?.length) return `No encontré una nota con título "${input.note_title}".`
        const { error } = await supabase.from('notes').delete().eq('id', notes[0].id)
        if (error) return `Error al eliminar nota: ${error.message}`
        await logAction(supabase, `Nota eliminada via IA: ${notes[0].title}`)
        return `✅ Nota "${notes[0].title}" eliminada.`
      }

      // ── FACTURAS ──────────────────────────────────────────
      case 'create_invoice': {
        const { data: clients } = await supabase.from('clients').select('id, name').ilike('name', `%${input.client_name}%`).limit(1)
        if (!clients?.length) return `No encontré un cliente llamado "${input.client_name}".`

        const { count } = await supabase.from('invoices').select('*', { count: 'exact', head: true })
        const invoiceNumber = `INV-${String((count || 0) + 1).padStart(4, '0')}`

        const { data, error } = await supabase.from('invoices').insert({
          client_id:      clients[0].id,
          amount:         input.amount as number,
          status:         (input.status as string) || 'pending',
          description:    (input.description as string) || null,
          due_date:       (input.due_date as string) || null,
          invoice_number: invoiceNumber,
        }).select().single()
        if (error) return `Error al crear factura: ${error.message}`
        await logAction(supabase, `Factura ${invoiceNumber} creada via IA para ${clients[0].name} por $${input.amount}`)
        return `✅ Factura ${data.invoice_number} creada para "${clients[0].name}" — $${Number(data.amount).toLocaleString()} — estado: ${data.status}`
      }

      case 'list_invoices': {
        let query = supabase.from('invoices').select('invoice_number, amount, status, due_date, description, clients(name)').order('created_at', { ascending: false }).limit(20)
        if (input.status) query = query.eq('status', input.status as string)
        if (input.client_name) {
          const { data: clients } = await supabase.from('clients').select('id').ilike('name', `%${input.client_name}%`).limit(1)
          if (clients?.length) query = query.eq('client_id', clients[0].id)
        }
        const { data, error } = await query
        if (error) return `Error: ${error.message}`
        if (!data?.length) return 'No hay facturas con esos filtros.'
        return JSON.stringify(data, null, 2)
      }

      case 'mark_invoice_paid': {
        // Intentar por número de factura primero, luego por cliente
        const invNum = (input.invoice_number as string).toUpperCase()
        let invoiceId: string | null = null
        let invoiceLabel = ''

        const { data: byNum } = await supabase.from('invoices').select('id, invoice_number').ilike('invoice_number', `%${invNum}%`).limit(1)
        if (byNum?.length) {
          invoiceId    = byNum[0].id
          invoiceLabel = byNum[0].invoice_number
        } else {
          // Buscar por cliente
          const { data: clients } = await supabase.from('clients').select('id').ilike('name', `%${invNum}%`).limit(1)
          if (clients?.length) {
            const { data: inv } = await supabase.from('invoices').select('id, invoice_number').eq('client_id', clients[0].id).neq('status', 'paid').order('created_at', { ascending: false }).limit(1)
            if (inv?.length) { invoiceId = inv[0].id; invoiceLabel = inv[0].invoice_number }
          }
        }

        if (!invoiceId) return `No encontré una factura pendiente para "${input.invoice_number}".`

        const { error } = await supabase.from('invoices').update({ status: 'paid', paid_at: new Date().toISOString() }).eq('id', invoiceId)
        if (error) return `Error al marcar como pagada: ${error.message}`
        await logAction(supabase, `Factura ${invoiceLabel} marcada como pagada via IA`)
        return `✅ Factura ${invoiceLabel} marcada como pagada.`
      }

      // ── TEMPLATES ─────────────────────────────────────────
      case 'create_template': {
        const { data, error } = await supabase.from('email_templates').insert({
          name:    input.name as string,
          subject: input.subject as string,
          body:    input.body as string,
          type:    (input.type as string) || 'general',
        }).select().single()
        if (error) return `Error al crear template: ${error.message}`
        await logAction(supabase, `Template creado via IA: ${input.name}`)
        return `✅ Template "${data.name}" creado (tipo: ${data.type})`
      }

      case 'list_templates': {
        let query = supabase.from('email_templates').select('name, subject, type, created_at').order('created_at', { ascending: false }).limit(20)
        if (input.type) query = query.eq('type', input.type as string)
        const { data, error } = await query
        if (error) return `Error: ${error.message}`
        if (!data?.length) return 'No hay templates registrados.'
        return JSON.stringify(data, null, 2)
      }

      case 'personalize_template': {
        const { data: templates } = await supabase.from('email_templates').select('name, subject, body').ilike('name', `%${input.template_name}%`).limit(1)
        if (!templates?.length) return `No encontré un template llamado "${input.template_name}".`

        const { data: clients } = await supabase.from('clients').select('name, email, industry, notes').ilike('name', `%${input.client_name}%`).limit(1)
        if (!clients?.length) return `No encontré un cliente llamado "${input.client_name}".`

        const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! })
        const res = await anthropic.messages.create({
          model: 'claude-haiku-4-5-20251001',
          max_tokens: 1024,
          messages: [{
            role: 'user',
            content: `Personalizá este template de email para el siguiente cliente. Respondé SOLO con el email personalizado.\n\nTemplate:\n${templates[0].body}\n\nCliente: ${clients[0].name}\nEmail: ${clients[0].email || 'N/A'}\nIndustria: ${clients[0].industry || 'N/A'}\nNotas: ${clients[0].notes || 'Sin notas'}`,
          }],
        })
        const personalized = res.content[0].type === 'text' ? res.content[0].text : templates[0].body
        return `✅ Template "${templates[0].name}" personalizado para "${clients[0].name}":\n\nAsunto: ${templates[0].subject}\n\n${personalized}`
      }

      // ── AUTOMATIZACIONES ──────────────────────────────────
      case 'create_automation': {
        let clientId = null
        if (input.client_name) {
          const { data: clients } = await supabase.from('clients').select('id, name').ilike('name', `%${input.client_name}%`).limit(1)
          if (clients?.length) clientId = clients[0].id
        }
        const { data, error } = await supabase.from('automations').insert({
          name:         input.name as string,
          trigger_type: input.trigger_type as string,
          description:  (input.description as string) || null,
          client_id:    clientId,
          notes:        (input.notes as string) || null,
          status:       (input.status as string) || 'active',
        }).select().single()
        if (error) return `Error al crear automatización: ${error.message}`
        await logAction(supabase, `Automatización creada via IA: ${input.name}`)
        return `✅ Automatización "${data.name}" creada (trigger: ${data.trigger_type}, estado: ${data.status})`
      }

      case 'list_automations': {
        let query = supabase.from('automations').select('name, status, trigger_type, description, clients(name)').order('created_at', { ascending: false }).limit(20)
        if (input.status) query = query.eq('status', input.status as string)
        const { data, error } = await query
        if (error) return `Error: ${error.message}`
        if (!data?.length) return 'No hay automatizaciones registradas.'
        return JSON.stringify(data, null, 2)
      }

      // ── DECISIONES ────────────────────────────────────────
      case 'save_decision': {
        const { data, error } = await supabase.from('decisions_memory').insert({
          decision: input.decision as string,
          context:  input.context as string,
          impact:   (input.impact as string) || null,
          tags:     (input.tags as string[]) || [],
        }).select().single()
        if (error) return `Error al guardar decisión: ${error.message}`
        await logAction(supabase, `Decisión guardada via IA: ${(input.decision as string).slice(0, 80)}`, 'decision')
        return `✅ Decisión guardada en memoria (ID: ${data.id})`
      }

      // ── MÉTRICAS ──────────────────────────────────────────
      case 'get_metrics': {
        const { data, error } = await supabase.from('latest_metrics').select('*').single()
        if (error || !data) return 'No hay métricas cargadas aún.'
        return JSON.stringify(data, null, 2)
      }

      // ── MEMORIA IA ────────────────────────────────────────
      case 'save_memory': {
        const { data, error } = await supabase.from('ai_memory').insert({
          category:   (input.category as string) || 'general',
          title:      input.title as string,
          content:    input.content as string,
          tags:       (input.tags as string[]) || [],
          confidence: (input.confidence as number) || 50,
          source:     'chat',
        }).select().single()
        if (error) return `Error al guardar memoria: ${error.message}`
        return `🧠 Memoria guardada: "${data.title}" (categoría: ${data.category}, confianza: ${data.confidence}%)`
      }

      case 'list_memory': {
        let query = supabase.from('ai_memory').select('title, category, content, confidence, times_applied, tags').order('times_applied', { ascending: false }).limit((input.limit as number) || 10)
        if (input.category) query = query.eq('category', input.category as string)
        if (input.search)   query = query.or(`title.ilike.%${input.search}%,content.ilike.%${input.search}%`)
        const { data, error } = await query
        if (error) return `Error: ${error.message}`
        if (!data?.length) return 'No tengo memorias guardadas sobre ese tema todavía.'
        return JSON.stringify(data, null, 2)
      }

      case 'update_memory': {
        const { data: memories } = await supabase.from('ai_memory').select('id, title, confidence, times_applied, content').ilike('title', `%${input.title_search}%`).limit(1)
        if (!memories?.length) return `No encontré una memoria con título "${input.title_search}".`
        const m = memories[0]
        const updates: Record<string, unknown> = {}
        if (input.new_content)             updates.content       = input.new_content
        if (input.confidence_adjustment)   updates.confidence    = Math.min(100, Math.max(0, m.confidence + (input.confidence_adjustment as number)))
        if (input.increment_times_applied) updates.times_applied = m.times_applied + 1
        const { error } = await supabase.from('ai_memory').update(updates).eq('id', m.id)
        if (error) return `Error al actualizar memoria: ${error.message}`
        return `✅ Memoria "${m.title}" actualizada.`
      }

      case 'save_observation': {
        const { data, error } = await supabase.from('ai_observations').insert({
          type:     input.type as string,
          title:    input.title as string,
          content:  input.content as string,
          severity: (input.severity as string) || 'info',
          resolved: false,
        }).select().single()
        if (error) return `Error al guardar observación: ${error.message}`
        return `👁️ Observación guardada: "${data.title}" (${data.type}, severidad: ${data.severity})`
      }

      default:
        return `Tool "${name}" no implementada.`
    }
  } catch (err: unknown) {
    return `Error interno: ${err instanceof Error ? err.message : String(err)}`
  }
}

async function logAction(
  supabase: Awaited<ReturnType<typeof import('@/lib/supabase/server').createClient>>,
  description: string,
  actionType = 'other',
) {
  await supabase.from('actions_log').insert({
    action_type:  actionType,
    description,
    status:       'executed',
    created_by:   'Nova AI',
  })
}
