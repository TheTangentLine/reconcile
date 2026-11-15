// Static stand-in for the API hooks used by apps/frontend.
//
// Same names and return shapes as apps/frontend/src/api/useApi.ts, so every
// page and component is identical in both apps; only the data source differs.
// Here the data is bundled, so it's always ready ("success") immediately.
import { METHODS } from '../data/methods'
import type { Method, MethodSummary } from './types'

export class ApiError extends Error {
  readonly status: number
  constructor(status: number, message: string) {
    super(message)
    this.status = status
  }
}

export type Resource<T> =
  | { status: 'loading' }
  | { status: 'success'; data: T }
  | { status: 'error'; error: ApiError }

type WithRetry<T> = Resource<T> & { retry: () => void }

const noop = () => {}

const SUMMARIES: MethodSummary[] = METHODS.map(({ stages, ...m }) => ({
  ...m,
  stageCount: stages.length,
  formulaCount: stages.reduce((n, s) => n + s.formulas.length, 0),
}))

// Built once, so components get the same object on every render.
const METHODS_RESOURCE: WithRetry<MethodSummary[]> = { status: 'success', data: SUMMARIES, retry: noop }
const METHOD_RESOURCES = new Map<string, WithRetry<Method>>(
  METHODS.map((m) => [m.slug, { status: 'success', data: m, retry: noop }]),
)

export const useMethods = (): WithRetry<MethodSummary[]> => METHODS_RESOURCE

export function useMethod(slug: string): WithRetry<Method> {
  return METHOD_RESOURCES.get(slug.toLowerCase()) ?? {
    status: 'error',
    error: new ApiError(404, `Method "${slug}" not found`),
    retry: noop,
  }
}
