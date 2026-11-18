import { describe, expect, it } from 'vitest'
// Aliased: these "hooks" are plain functions here, so call them directly.
import { useMethod as getMethod, useMethods as getMethods } from '../api/useApi'
import { isSolved, parseAlg, caseState } from '../cube/model'
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

// ---------- Full OLL / PLL sanity checks ----------
// Each formula is checked on the cube model: the case it solves must leave the
// first two layers alone, and the cases must all be different from each other
// (counting two cases as the same if they only differ by turning the top layer).
import {
  applyMoves, createSolved, invertAlg, orientationMoves, parseMove, rotateVec,
  type CubeState, type Cubie, type Vec3,
} from '../cube/model'

const SOLVED = createSolved()
const S0 = applyMoves(SOLVED, orientationMoves(SOLVED, 'Y', 'G')!) // yellow up, green front
const U = parseMove('U')

/** View the cube yellow-up, green-front again (some formulas rotate it, e.g. V-perm's y). */
const normalize = (s: CubeState) => applyMoves(s, orientationMoves(s, 'Y', 'G') ?? [])
const caseOf = (alg: string) => normalize(applyMoves(S0, invertAlg(parseAlg(alg))))
const at = (s: CubeState, p: Vec3) => s.find((c) => c.pos[0] === p[0] && c.pos[1] === p[1] && c.pos[2] === p[2])!
const fingerprint = (c: Cubie) => `${c.id}|${c.stickers.map((st) => st.normal.join() + st.color).sort().join(';')}`
const f2lIntact = (s: CubeState) => S0.filter((c) => c.pos[1] < 1).every((c) => fingerprint(at(s, c.pos)) === fingerprint(c))
const topLayer = (s: CubeState) => s.filter((c) => c.pos[1] === 1)
const turnsOfU = (s: CubeState) => [0, 1, 2, 3].map((k) => applyMoves(s, Array(k).fill(U)))

/** Which top-layer stickers are yellow, ignoring how the top layer is turned. */
function orientationKey(s: CubeState) {
  return turnsOfU(s)
    .map((t) => topLayer(t).flatMap((c) => c.stickers.filter((st) => st.color === 'Y').map((st) => `${c.pos}|${st.normal}`)).sort().join(' '))
    .sort()[0]
}

const LL_POSITIONS = topLayer(S0).map((c) => c.pos).sort((a, b) => a.join().localeCompare(b.join()))
const HOME = new Map(S0.map((c) => [c.id, c.pos]))
/** Where each top-layer piece belongs, ignoring turns of the top layer before and after. */
function permutationKey(s: CubeState) {
  const keys: string[] = []
  for (const t of turnsOfU(s))
    for (let b = 0; b < 4; b++)
      keys.push(LL_POSITIONS.map((p) => rotateVec(HOME.get(at(t, p).id)!, 1, b).join()).join(' '))
  return keys.sort()[0]
}

const stage = (id: string) => METHODS.find((m) => m.slug === 'cfop')!.stages.find((s) => s.id === id)!

describe('full OLL', () => {
  const formulas = stage('oll-full').formulas

  it('has all 57 cases', () => expect(formulas).toHaveLength(57))

  it.each(formulas.map((f) => [f.name, f.alg]))('%s keeps the first two layers solved', (_, alg) => {
    expect(f2lIntact(caseOf(alg))).toBe(true)
  })

  it('cases are all different, and none is already oriented', () => {
    const keys = formulas.map((f) => orientationKey(caseOf(f.alg)))
    const dupes = formulas.filter((_, i) => keys.indexOf(keys[i]) !== i).map((f) => f.name)
    expect(dupes).toEqual([])
    expect(keys).not.toContain(orientationKey(S0))
  })
})

describe('full PLL', () => {
  const formulas = stage('pll-full').formulas

  it('has all 21 cases', () => expect(formulas).toHaveLength(21))

  it.each(formulas.map((f) => [f.name, f.alg]))('%s keeps F2L solved and the top all yellow', (_, alg) => {
    const c = caseOf(alg)
    expect(f2lIntact(c)).toBe(true)
    expect(topLayer(c).every((p) => p.stickers.every((st) => st.color !== 'Y' || st.normal[1] === 1))).toBe(true)
  })

  it('cases are all different, and none is already solved', () => {
    const keys = formulas.map((f) => permutationKey(caseOf(f.alg)))
    const dupes = formulas.filter((_, i) => keys.indexOf(keys[i]) !== i).map((f) => f.name)
    expect(dupes).toEqual([])
    expect(keys).not.toContain(permutationKey(S0))
  })
})
