import { describe, expect, it } from 'vitest'
// Aliased: these "hooks" are plain functions here, so call them directly.
import { useMethod as getMethod, useMethods as getMethods } from '../api/useApi'
import { isSolved, parseAlg, applyMoves, caseState, orientationMoves } from '../cube/model'
import { METHODS } from './methods'

describe('bundled method data', () => {
  it('has unique slugs and unique formula ids per method', () => {
    expect(new Set(METHODS.map((m) => m.slug)).size).toBe(METHODS.length)
    for (const m of METHODS) {
      const ids = m.stages.flatMap((s) => s.formulas.map((f) => f.id))
      expect(new Set(ids).size, m.slug).toBe(ids.length)
    }
  })

  it('every formula parses and solves the case it is shown for', () => {
    for (const m of METHODS)
      for (const s of m.stages)
        for (const f of s.formulas) {
          const moves = parseAlg(f.alg)
          expect(moves.length, f.id).toBeGreaterThan(0)
          const start = caseState(f.alg, f.hold)
          const orient = f.hold ? orientationMoves(start, f.hold.up, f.hold.front) ?? [] : []
          expect(isSolved(applyMoves(start, [...orient, ...moves])), f.id).toBe(true)
        }
  })
})

describe('static data hooks', () => {
  it('useMethods lists every method with counts and no stages', () => {
    const res = getMethods()
    expect(res.status).toBe('success')
    if (res.status !== 'success') return
    expect(res.data.map((m) => m.slug)).toEqual(METHODS.map((m) => m.slug))
    const cfop = res.data.find((m) => m.slug === 'cfop')!
    expect(cfop).not.toHaveProperty('stages')
    expect(cfop.formulaCount).toBe(METHODS.find((m) => m.slug === 'cfop')!.stages.reduce((n, s) => n + s.formulas.length, 0))
  })

  it('useMethod finds a method case-insensitively', () => {
    const res = getMethod('CFOP')
    expect(res.status === 'success' && res.data.name).toBe('CFOP')
  })

  it('useMethod returns a 404 error for unknown slugs', () => {
    const res = getMethod('nope')
    expect(res.status === 'error' && res.error.status).toBe(404)
  })
})
