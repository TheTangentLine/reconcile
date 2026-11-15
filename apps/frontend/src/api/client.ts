import type { Method, MethodSummary } from './types'

/** Same-origin by default: nginx (Docker) and the Vite dev server both proxy /api. */
const BASE = (import.meta.env.VITE_API_URL ?? '').replace(/\/$/, '') + '/api'

export class ApiError extends Error {
  readonly status: number
  constructor(status: number, message: string) {
    super(message)
    this.status = status
  }
}

async function get<T>(path: string): Promise<T> {
  let res: Response
  try {
    res = await fetch(BASE + path, { headers: { Accept: 'application/json' } })
  } catch {
    throw new ApiError(0, "Can't reach the server. Is the backend running?")
  }
  if (res.status === 502 || res.status === 503 || res.status === 504) {
    throw new ApiError(res.status, "Can't reach the server. Is the backend running?")
  }
  if (!res.ok) {
    const body = await res.json().catch(() => null) as { error?: string } | null
    throw new ApiError(res.status, body?.error ?? `Request failed (${res.status})`)
  }
  return res.json() as Promise<T>
}

export const api = {
  methods: () => get<MethodSummary[]>('/methods'),
  method: (slug: string) => get<Method>(`/methods/${encodeURIComponent(slug)}`),
}
