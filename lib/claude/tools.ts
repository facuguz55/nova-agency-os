import Anthropic from '@anthropic-ai/sdk'

export const TOOLS: Anthropic.Tool[] = [
  // ── CLIENTES ────────────────────────────────────────────────
  {
    name: 'create_client',
    description: 'Crea un nuevo cliente en el sistema.',
    input_schema: {
      type: 'object' as const,
      properties: {
        name:           { type: 'string', description: 'Nombre del cliente o empresa' },
        email:          { type: 'string', description: 'Email de contacto' },
        industry:       { type: 'string', description: 'Industria o rubro' },
        contact_person: { type: 'string', description: 'Nombre de la persona de contacto' },
        status:         { type: 'string', enum: ['active', 'inactive', 'prospect'] },
        notes:          { type: 'string', description: 'Notas adicionales' },
      },
      required: ['name'],
    },
  },
  {
    name: 'list_clients',
    description: 'Lista los clientes registrados en el sistema.',
    input_schema: {
      type: 'object' as const,
      properties: {
        status: { type: 'string', enum: ['active', 'inactive', 'prospect'] },
      },
    },
  },

  // ── PROYECTOS ───────────────────────────────────────────────
  {
    name: 'create_project',
    description: 'Crea un nuevo proyecto asociado a un cliente.',
    input_schema: {
      type: 'object' as const,
      properties: {
        name:        { type: 'string', description: 'Nombre del proyecto' },
        client_name: { type: 'string', description: 'Nombre del cliente al que pertenece' },
        status:      { type: 'string', enum: ['planning', 'active', 'completed', 'paused'] },
        description: { type: 'string' },
        budget:      { type: 'number', description: 'Presupuesto en USD' },
      },
      required: ['name', 'client_name'],
    },
  },
  {
    name: 'list_projects',
    description: 'Lista los proyectos del sistema.',
    input_schema: {
      type: 'object' as const,
      properties: {
        status: { type: 'string', enum: ['planning', 'active', 'completed', 'paused'] },
      },
    },
  },
  {
    name: 'update_project',
    description: 'Actualiza el estado u otros campos de un proyecto existente.',
    input_schema: {
      type: 'object' as const,
      properties: {
        project_name: { type: 'string', description: 'Nombre del proyecto a actualizar' },
        status:       { type: 'string', enum: ['planning', 'active', 'completed', 'paused'] },
        description:  { type: 'string' },
        budget:       { type: 'number' },
      },
      required: ['project_name'],
    },
  },

  {
    name: 'list_subprojects',
    description: 'Lista los subproyectos (etapas) de un proyecto específico.',
    input_schema: {
      type: 'object' as const,
      properties: {
        project_name: { type: 'string', description: 'Nombre del proyecto padre' },
      },
      required: ['project_name'],
    },
  },
  {
    name: 'create_subproject',
    description: 'Crea un subproyecto (etapa/fase) dentro de un proyecto existente.',
    input_schema: {
      type: 'object' as const,
      properties: {
        name:          { type: 'string', description: 'Nombre del subproyecto' },
        project_name:  { type: 'string', description: 'Nombre del proyecto padre' },
        status:        { type: 'string', enum: ['planning', 'active', 'completed', 'paused'] },
        description:   { type: 'string' },
        budget:        { type: 'number' },
        add_to_budget: { type: 'boolean', description: 'Si suma al presupuesto total del proyecto' },
      },
      required: ['name', 'project_name'],
    },
  },
  {
    name: 'create_calendar_event',
    description: 'Agrega un evento o recordatorio al calendario creando una tarea con fecha.',
    input_schema: {
      type: 'object' as const,
      properties: {
        title:        { type: 'string', description: 'Nombre del evento' },
        due_date:     { type: 'string', description: 'Fecha del evento (YYYY-MM-DD)' },
        description:  { type: 'string' },
        client_name:  { type: 'string' },
        project_name: { type: 'string' },
        priority:     { type: 'string', enum: ['low', 'medium', 'high', 'urgent'] },
      },
      required: ['title', 'due_date'],
    },
  },

  // ── TAREAS ──────────────────────────────────────────────────
  {
    name: 'create_task',
    description: 'Crea una nueva tarea. Puede vincularse a un proyecto o cliente.',
    input_schema: {
      type: 'object' as const,
      properties: {
        title:        { type: 'string', description: 'Título de la tarea' },
        description:  { type: 'string', description: 'Descripción detallada' },
        status:       { type: 'string', enum: ['todo', 'in_progress', 'done', 'blocked'], description: 'Estado inicial (default: todo)' },
        priority:     { type: 'string', enum: ['low', 'medium', 'high', 'urgent'], description: 'Prioridad (default: medium)' },
        assigned_to:  { type: 'string', description: 'Nombre o email de quien se asigna la tarea' },
        client_name:  { type: 'string', description: 'Nombre del cliente asociado (opcional)' },
        project_name: { type: 'string', description: 'Nombre del proyecto asociado (opcional)' },
        due_date:     { type: 'string', description: 'Fecha de vencimiento en formato YYYY-MM-DD' },
      },
      required: ['title'],
    },
  },
  {
    name: 'list_tasks',
    description: 'Lista las tareas del sistema con filtros opcionales.',
    input_schema: {
      type: 'object' as const,
      properties: {
        status:       { type: 'string', enum: ['todo', 'in_progress', 'done', 'blocked'] },
        priority:     { type: 'string', enum: ['low', 'medium', 'high', 'urgent'] },
        client_name:  { type: 'string', description: 'Filtrar por nombre de cliente' },
        project_name: { type: 'string', description: 'Filtrar por nombre de proyecto' },
      },
    },
  },
  {
    name: 'update_task',
    description: 'Actualiza una tarea existente. Usá esta tool para cambiar estado, prioridad u otros campos.',
    input_schema: {
      type: 'object' as const,
      properties: {
        task_title:  { type: 'string', description: 'Título (o parte del título) de la tarea a actualizar' },
        status:      { type: 'string', enum: ['todo', 'in_progress', 'done', 'blocked'] },
        priority:    { type: 'string', enum: ['low', 'medium', 'high', 'urgent'] },
        description: { type: 'string' },
        due_date:    { type: 'string', description: 'Fecha de vencimiento YYYY-MM-DD' },
        assigned_to: { type: 'string' },
      },
      required: ['task_title'],
    },
  },
  {
    name: 'delete_task',
    description: 'Elimina una tarea del sistema.',
    input_schema: {
      type: 'object' as const,
      properties: {
        task_title: { type: 'string', description: 'Título (o parte del título) de la tarea a eliminar' },
      },
      required: ['task_title'],
    },
  },

  // ── NOTAS ───────────────────────────────────────────────────
  {
    name: 'create_note',
    description: 'Crea una nota. Puede vincularse a un cliente o proyecto.',
    input_schema: {
      type: 'object' as const,
      properties: {
        title:        { type: 'string', description: 'Título de la nota' },
        content:      { type: 'string', description: 'Contenido de la nota' },
        client_name:  { type: 'string', description: 'Nombre del cliente asociado (opcional)' },
        project_name: { type: 'string', description: 'Nombre del proyecto asociado (opcional)' },
      },
      required: ['title'],
    },
  },
  {
    name: 'list_notes',
    description: 'Lista las notas del sistema.',
    input_schema: {
      type: 'object' as const,
      properties: {
        search:       { type: 'string', description: 'Texto para buscar en título o contenido' },
        client_name:  { type: 'string', description: 'Filtrar por nombre de cliente' },
        project_name: { type: 'string', description: 'Filtrar por nombre de proyecto' },
      },
    },
  },
  {
    name: 'delete_note',
    description: 'Elimina una nota del sistema.',
    input_schema: {
      type: 'object' as const,
      properties: {
        note_title: { type: 'string', description: 'Título (o parte del título) de la nota a eliminar' },
      },
      required: ['note_title'],
    },
  },

  // ── FACTURAS ────────────────────────────────────────────────
  {
    name: 'create_invoice',
    description: 'Crea una factura para un cliente.',
    input_schema: {
      type: 'object' as const,
      properties: {
        client_name:  { type: 'string', description: 'Nombre del cliente' },
        amount:       { type: 'number', description: 'Monto en USD' },
        description:  { type: 'string', description: 'Descripción del servicio facturado' },
        status:       { type: 'string', enum: ['draft', 'pending', 'paid'], description: 'Estado inicial (default: pending)' },
        due_date:     { type: 'string', description: 'Fecha de vencimiento YYYY-MM-DD' },
      },
      required: ['client_name', 'amount'],
    },
  },
  {
    name: 'list_invoices',
    description: 'Lista las facturas del sistema.',
    input_schema: {
      type: 'object' as const,
      properties: {
        status:      { type: 'string', enum: ['draft', 'pending', 'paid', 'overdue', 'canceled'] },
        client_name: { type: 'string', description: 'Filtrar por nombre de cliente' },
      },
    },
  },
  {
    name: 'mark_invoice_paid',
    description: 'Marca una factura como pagada.',
    input_schema: {
      type: 'object' as const,
      properties: {
        invoice_number: { type: 'string', description: 'Número de factura (ej: INV-0001) o nombre del cliente para buscar la más reciente' },
      },
      required: ['invoice_number'],
    },
  },

  // ── TEMPLATES ───────────────────────────────────────────────
  {
    name: 'create_template',
    description: 'Crea un template de email.',
    input_schema: {
      type: 'object' as const,
      properties: {
        name:    { type: 'string', description: 'Nombre del template' },
        subject: { type: 'string', description: 'Asunto del email' },
        body:    { type: 'string', description: 'Cuerpo del email (puede incluir placeholders como [Nombre])' },
        type:    { type: 'string', enum: ['general', 'onboarding', 'seguimiento', 'propuesta', 'reporte', 'cobranza'] },
      },
      required: ['name', 'subject', 'body'],
    },
  },
  {
    name: 'list_templates',
    description: 'Lista los templates de email disponibles.',
    input_schema: {
      type: 'object' as const,
      properties: {
        type: { type: 'string', enum: ['general', 'onboarding', 'seguimiento', 'propuesta', 'reporte', 'cobranza'] },
      },
    },
  },
  {
    name: 'personalize_template',
    description: 'Personaliza un template de email con IA para un cliente específico.',
    input_schema: {
      type: 'object' as const,
      properties: {
        template_name: { type: 'string', description: 'Nombre del template a personalizar' },
        client_name:   { type: 'string', description: 'Nombre del cliente para el que personalizar' },
      },
      required: ['template_name', 'client_name'],
    },
  },

  // ── AUTOMATIZACIONES ────────────────────────────────────────
  {
    name: 'create_automation',
    description: 'Crea una nueva automatización en el sistema.',
    input_schema: {
      type: 'object' as const,
      properties: {
        name:         { type: 'string' },
        trigger_type: { type: 'string', enum: ['email', 'webhook', 'schedule', 'manual'] },
        description:  { type: 'string' },
        client_name:  { type: 'string' },
        notes:        { type: 'string' },
        status:       { type: 'string', enum: ['active', 'inactive'] },
      },
      required: ['name', 'trigger_type'],
    },
  },
  {
    name: 'list_automations',
    description: 'Lista las automatizaciones del sistema.',
    input_schema: {
      type: 'object' as const,
      properties: {
        status: { type: 'string', enum: ['active', 'inactive'] },
      },
    },
  },

  // ── DECISIONES ──────────────────────────────────────────────
  {
    name: 'save_decision',
    description: 'Guarda una decisión importante en la memoria persistente del sistema.',
    input_schema: {
      type: 'object' as const,
      properties: {
        decision: { type: 'string' },
        context:  { type: 'string' },
        impact:   { type: 'string' },
        tags:     { type: 'array', items: { type: 'string' } },
      },
      required: ['decision', 'context'],
    },
  },

  // ── ROADMAP ─────────────────────────────────────────────────
  {
    name: 'list_roadmap',
    description: 'Muestra el roadmap mensual de un cliente (semanas y sus items).',
    input_schema: {
      type: 'object' as const,
      properties: {
        client_name: { type: 'string', description: 'Nombre del cliente' },
        month:       { type: 'number', description: 'Mes (1-12). Default: mes actual' },
        year:        { type: 'number', description: 'Año. Default: año actual' },
      },
      required: ['client_name'],
    },
  },
  {
    name: 'set_roadmap_week',
    description: 'Crea o actualiza una semana del roadmap de un cliente. Usá para agregar o editar semanas.',
    input_schema: {
      type: 'object' as const,
      properties: {
        client_name: { type: 'string', description: 'Nombre del cliente' },
        week:        { type: 'number', description: 'Número de semana (1-5)' },
        title:       { type: 'string', description: 'Título de la semana (ej: "Lanzamiento de redes")' },
        items:       { type: 'array', items: { type: 'string' }, description: 'Lista de tareas o entregables de esa semana' },
        month:       { type: 'number', description: 'Mes (1-12). Default: mes actual' },
        year:        { type: 'number', description: 'Año. Default: año actual' },
      },
      required: ['client_name', 'week', 'title'],
    },
  },
  {
    name: 'delete_roadmap_week',
    description: 'Elimina una semana del roadmap de un cliente.',
    input_schema: {
      type: 'object' as const,
      properties: {
        client_name: { type: 'string', description: 'Nombre del cliente' },
        week:        { type: 'number', description: 'Número de semana a eliminar (1-5)' },
        month:       { type: 'number', description: 'Mes (1-12). Default: mes actual' },
        year:        { type: 'number', description: 'Año. Default: año actual' },
      },
      required: ['client_name', 'week'],
    },
  },

  // ── MÉTRICAS ────────────────────────────────────────────────
  {
    name: 'get_metrics',
    description: 'Obtiene las últimas métricas de redes sociales.',
    input_schema: {
      type: 'object' as const,
      properties: {},
    },
  },

  // ── MEMORIA IA ──────────────────────────────────────────────
  {
    name: 'save_memory',
    description: 'Guarda un aprendizaje, patrón o lección en tu memoria persistente. Usá esta tool cada vez que detectés algo importante: un patrón de comportamiento de un cliente, una solución que funcionó, una lección aprendida.',
    input_schema: {
      type: 'object' as const,
      properties: {
        category:   { type: 'string', enum: ['pattern','decision','lesson','observation','fact'], description: 'Tipo de memoria' },
        title:      { type: 'string', description: 'Título corto descriptivo' },
        content:    { type: 'string', description: 'Descripción detallada del aprendizaje' },
        tags:       { type: 'array', items: { type: 'string' }, description: 'Tags para categorizar (ej: ["cliente", "facturación"])' },
        confidence: { type: 'number', description: 'Confianza en este aprendizaje del 0 al 100' },
      },
      required: ['category', 'title', 'content'],
    },
  },
  {
    name: 'list_memory',
    description: 'Consulta tu memoria persistente. Usá esta tool ANTES de tomar decisiones importantes para ver si ya aprendiste algo relevante.',
    input_schema: {
      type: 'object' as const,
      properties: {
        category: { type: 'string', enum: ['pattern','decision','lesson','observation','fact'] },
        search:   { type: 'string', description: 'Texto para buscar en título o contenido' },
        limit:    { type: 'number', description: 'Máximo de resultados (default 10)' },
      },
    },
  },
  {
    name: 'update_memory',
    description: 'Refuerza o actualiza un aprendizaje existente. Usá esta tool cuando aplicás un aprendizaje previo y funciona (incrementa times_applied) o cuando encontrás nueva evidencia.',
    input_schema: {
      type: 'object' as const,
      properties: {
        title_search:            { type: 'string', description: 'Título o parte del título de la memoria a actualizar' },
        new_content:             { type: 'string', description: 'Nuevo contenido (opcional)' },
        confidence_adjustment:   { type: 'number', description: 'Ajuste de confianza (-20 a +20)' },
        increment_times_applied: { type: 'boolean', description: 'Si incrementar el contador de usos' },
      },
      required: ['title_search'],
    },
  },
  {
    name: 'save_observation',
    description: 'Guarda una observación sobre el estado actual del sistema (alertas, patrones detectados, recomendaciones).',
    input_schema: {
      type: 'object' as const,
      properties: {
        type:     { type: 'string', enum: ['alert','pattern','insight','recommendation'] },
        title:    { type: 'string' },
        content:  { type: 'string' },
        severity: { type: 'string', enum: ['info','warning','critical'] },
      },
      required: ['type', 'title', 'content'],
    },
  },
]
