import { describe, expect, it } from 'vitest'
import {
  applyMoves, caseState, centerColor, colorCounts, createSolved, describeMove, getFacelet,
  invertAlg, isSolved, orientationMoves, parseAlg, parseMove, randomScramble, setFacelet,
  type CubeState,
} from './model'

const run = (alg: string, from: CubeState = createSolved()) => applyMoves(from, parseAlg(alg))
const repeat = (alg: string, n: number) => Array(n).fill(alg).join(' ')

describe('solved cube', () => {
  it('has 9 stickers of each color and is solved', () => {
    const cube = createSolved()
    expect(Object.values(colorCounts(cube))).toEqual([9, 9, 9, 9, 9, 9])
    expect(isSolved(cube)).toBe(true)
  })

  it('uses white up and green front', () => {
    const cube = createSolved()
    expect(centerColor(cube, 'U')).toBe('W')
    expect(centerColor(cube, 'F')).toBe('G')
  })
})

describe('single turns', () => {
  it('R brings the front column up', () => {
    const cube = run('R')
    for (const r of [0, 1, 2]) {
      expect(getFacelet(cube, 'U', r, 2)).toBe('G')
      expect(getFacelet(cube, 'U', r, 0)).toBe('W')
    }
  })

  it('U moves the right side onto the front', () => {
    const cube = run('U')
    for (const c of [0, 1, 2]) expect(getFacelet(cube, 'F', 0, c)).toBe('R')
    expect(getFacelet(cube, 'F', 1, 0)).toBe('G')
  })

  it('y turns the whole cube like U', () => {
    const cube = run('y')
    expect(centerColor(cube, 'F')).toBe('R')
    expect(isSolved(cube)).toBe(true)
  })

  it('every face turn has order 4', () => {
    for (const f of ['R', 'L', 'U', 'D', 'F', 'B', 'M', 'E', 'S', 'r', 'x']) {
      for (let n = 1; n < 4; n++) expect(isSolved(run(repeat(f, n))), `${f} x${n}`).toBe(f === 'x')
      expect(isSolved(run(repeat(f, 4))), `${f} x4`).toBe(true)
    }
  })
})

describe('equivalent notations', () => {
  const same = (a: string, b: string) => expect(run(a)).toEqual(run(b))

  it('Rw is r, and r is R plus M\'', () => {
    same('Rw', 'r')
    same('r', "R M'")
  })

  it('x is R M\' L\'', () => same('x', "R M' L'"))
  it("R2 and R2' are both a half turn", () => same("R2'", 'R R'))
  it("R3 is R'", () => same('R3', "R'"))
})

describe('known algorithm orders', () => {
  it.each([
    ["R U R' U'", 6],
    ["R U R' U R U2 R'", 6], // Sune
    ["R U R' U' R' F R2 U' R' U' R U R' F'", 2], // T-perm
    ["M2 U M2 U M' U2 M2 U2 M' U2", 2], // Z-perm
    ['M2 U M2 U2 M2 U M2', 2], // H-perm
  ])('%s returns to solved after %i repeats', (alg, order) => {
    for (let n = 1; n < order; n++) expect(isSolved(run(repeat(alg, n)))).toBe(false)
    expect(isSolved(run(repeat(alg, order)))).toBe(true)
  })
})

describe('inverse', () => {
  it('undoes any scramble', () => {
    for (let i = 0; i < 20; i++) {
      const moves = parseAlg(randomScramble())
      expect(isSolved(applyMoves(applyMoves(createSolved(), moves), invertAlg(moves)))).toBe(true)
    }
  })

  it("keeps half turns and flips primes", () => {
    expect(invertAlg(parseAlg("R U' F2")).map((m) => m.token)).toEqual(["F2", 'U', "R'"])
  })
})

describe('parser', () => {
  it('ignores brackets, extra spaces and curly primes', () => {
    expect(parseAlg(" (R U)  [R’ U'] ").map((m) => m.token)).toEqual(['R', 'U', "R'", "U'"])
  })

  it('rejects unknown moves', () => {
    expect(() => parseMove('Q')).toThrow(/Unknown move/)
    expect(() => parseAlg('R X')).toThrow(/Unknown move/)
  })

  it('describes moves in plain words', () => {
    expect(describeMove(parseMove("R'"))).toBe('Turn the right face counter-clockwise')
    expect(describeMove(parseMove('U2'))).toBe('Turn the top face twice (180°)')
    expect(describeMove(parseMove('y'))).toBe('Rotate the whole cube (like U) clockwise')
  })
})

describe('orientation', () => {
  it('finds a rotation for yellow up, green front', () => {
    const moves = orientationMoves(createSolved(), 'Y', 'G')!
    expect(moves).not.toBeNull()
    const held = applyMoves(createSolved(), moves)
    expect(centerColor(held, 'U')).toBe('Y')
    expect(centerColor(held, 'F')).toBe('G')
  })

  it('returns [] when already held that way', () => {
    expect(orientationMoves(createSolved(), 'W', 'G')).toEqual([])
  })

  it('returns null for opposite colors', () => {
    expect(orientationMoves(createSolved(), 'W', 'Y')).toBeNull()
  })
})

describe('caseState', () => {
  it('is the position the formula solves', () => {
    const alg = "R U R' U' R' F R2 U' R' U' R U R' F'"
    const hold = { up: 'Y', front: 'G' } as const
    const start = caseState(alg, hold)
    expect(isSolved(start)).toBe(false)
    const orient = orientationMoves(start, hold.up, hold.front)!
    expect(isSolved(applyMoves(start, [...orient, ...parseAlg(alg)]))).toBe(true)
  })
})

describe('editing facelets', () => {
  it('changes exactly one sticker', () => {
    const cube = setFacelet(createSolved(), 'F', 0, 0, 'R')
    expect(getFacelet(cube, 'F', 0, 0)).toBe('R')
    expect(colorCounts(cube)).toMatchObject({ G: 8, R: 10 })
  })
})
