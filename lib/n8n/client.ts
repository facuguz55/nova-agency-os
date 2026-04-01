const N8N_BASE_URL = process.env.N8N_BASE_URL!
const N8N_API_KEY = process.env.N8N_API_KEY!

interface N8NExecution {
  id: string
  workflowId: string
  mode: string
  status: string
  startedAt: string
  stoppedAt?: string
  data?: {
    resultData?: {
      error?: { message: string }
    }
  }
}

interface N8NWorkflow {
  id: string
  name: string
  active: boolean
  createdAt: string
  updatedAt: string
}

async function n8nFetch(path: string) {
  const res = await fetch(`${N8N_BASE_URL}/api/v1${path}`, {
    headers: {
      'X-N8N-API-KEY': N8N_API_KEY,
      'Content-Type': 'application/json',
    },
    next: { revalidate: 0 },
  })

  if (!res.ok) {
    throw new Error(`n8n API error: ${res.status} ${res.statusText}`)
  }

  return res.json()
}

export async function getWorkflows(): Promise<N8NWorkflow[]> {
  const data = await n8nFetch('/workflows?limit=50')
  return data.data || []
}

export async function getExecutions(workflowId?: string, limit = 50) {
  const query = workflowId
    ? `/executions?workflowId=${workflowId}&limit=${limit}&includeData=false`
    : `/executions?limit=${limit}&includeData=false`
  const data = await n8nFetch(query)
  return data.data || []
}

export async function getExecution(executionId: string): Promise<N8NExecution> {
  return n8nFetch(`/executions/${executionId}`)
}

export async function formatExecutionsForDB(executions: N8NExecution[], workflowMap: Map<string, string>) {
  return executions.map(exec => {
    const durationMs = exec.stoppedAt
      ? new Date(exec.stoppedAt).getTime() - new Date(exec.startedAt).getTime()
      : null

    const status = exec.status === 'success' ? 'success'
      : exec.status === 'error' ? 'failed'
      : exec.status === 'running' ? 'running'
      : 'paused'

    return {
      workflow_name: workflowMap.get(exec.workflowId) || `Workflow ${exec.workflowId}`,
      execution_id: exec.id,
      status,
      execution_time_ms: durationMs,
      error_message: exec.data?.resultData?.error?.message || null,
      timestamp: exec.startedAt,
    }
  })
}
