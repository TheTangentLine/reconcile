import { afterEach, describe, expect, it, vi } from 'vitest'
import { api, ApiError } from './client'

const json = (status: number, body: unknown) =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } })

afterEach(() => vi.unstubAllGlobals())

describe('api client', () => {
  it('requests same-origin /api paths and returns the JSON body', async () => {
    const fetch = vi.fn().mockResolvedValue(json(200, [{ slug: 'cfop' }]))
    vi.stubGlobal('fetch', fetch)
    await expect(api.methods()).resolves.toEqual([{ slug: 'cfop' }])
    expect(fetch.mock.calls[0]![0]).toBe('/api/methods')
  })

  it('encodes the slug', async () => {
    const fetch = vi.fn().mockResolvedValue(json(200, {}))
    vi.stubGlobal('fetch', fetch)
    await api.method('a/b')
    expect(fetch.mock.calls[0]![0]).toBe('/api/methods/a%2Fb')
  })

  it('surfaces the server error message and status', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(json(404, { error: 'Method "x" not found' })))
    const err = await api.method('x').catch((e: unknown) => e)
    expect(err).toBeInstanceOf(ApiError)
    expect(err).toMatchObject({ status: 404, message: 'Method "x" not found' })
  })

  it('treats gateway errors as the backend being down', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('<html>Bad Gateway</html>', { status: 502 })))
    await expect(api.methods()).rejects.toMatchObject({ status: 502, message: expect.stringMatching(/backend running/) })
  })

  it('reports network failures with status 0', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('Failed to fetch')))
    await expect(api.methods()).rejects.toMatchObject({ status: 0 })
  })
})
