import { useCallback, useEffect, useSyncExternalStore } from 'react'
import { api, ApiError } from './client'
import type { Method, MethodSummary } from './types'

export type Resource<T> =
  | { status: 'loading' }
  | { status: 'success'; data: T }
  | { status: 'error'; error: ApiError }

// A tiny shared cache: each key is fetched once and every component reading it
// re-renders when it settles. Failed keys are dropped on retry.
const cache = new Map<string, Resource<unknown>>()
const listeners = new Set<() => void>()
const emit = () => listeners.forEach((l) => l())
const subscribe = (l: () => void) => {
  listeners.add(l)
  return () => listeners.delete(l)
}
const LOADING: Resource<never> = { status: 'loading' }

function load<T>(key: string, fetcher: () => Promise<T>) {
  if (cache.has(key)) return
  cache.set(key, LOADING)
  fetcher().then(
    (data) => cache.set(key, { status: 'success', data }),
    (err: unknown) => cache.set(key, {
      status: 'error',
      error: err instanceof ApiError ? err : new ApiError(0, String(err)),
    }),
  ).finally(emit)
}

function useResource<T>(key: string, fetcher: () => Promise<T>): Resource<T> & { retry: () => void } {
  const entry = useSyncExternalStore(subscribe, () => cache.get(key)) as Resource<T> | undefined
  useEffect(() => load(key, fetcher), [key, fetcher])
  const retry = useCallback(() => {
    cache.delete(key)
    load(key, fetcher)
    emit()
  }, [key, fetcher])
  return { ...(entry ?? LOADING), retry }
}

export const useMethods = () => useResource<MethodSummary[]>('methods', api.methods)

export function useMethod(slug: string) {
  const fetcher = useCallback(() => api.method(slug), [slug])
  return useResource<Method>(`method:${slug}`, fetcher)
}
