import { describe, expect, it } from 'vitest'
import { applyMoves, createSolved, isSolved, parseAlg, parseMove } from '../cube/model'
import { initialPlayState, MAX_QUEUE, playReducer, type PlayState } from './playCube'
import { averageOf, best, formatTime, initialTimer, timerReducer, type Result } from './timer'

const finishAll = (s: PlayState) => {
  while (s.anim) s = playReducer(s, { type: 'done' })
  return s
}

describe('play cube queue', () => {
  it('animates queued moves one at a time and ends at the target', () => {
    let s = initialPlayState(createSolved())
    s = playReducer(s, { type: 'turn', moves: parseAlg("R U R' U'") })
    expect(s.anim?.move.token).toBe('R')
    expect(s.queue.map((m) => m.token)).toEqual(['U', "R'", "U'"])
    s = finishAll(s)
    expect(s.history.map((m) => m.token)).toEqual(['R', 'U', "R'", "U'"])
    expect(s.cube).toEqual(applyMoves(createSolved(), parseAlg("R U R' U'")))
    expect(s.cube).toEqual(s.target)
  })

  it('undo reverses the last move and removes it from the history', () => {
    let s = finishAll(playReducer(initialPlayState(createSolved()), { type: 'turn', moves: parseAlg('R U') }))
    s = finishAll(playReducer(s, { type: 'undo' }))
    expect(s.history.map((m) => m.token)).toEqual(['R'])
    expect(s.cube).toEqual(applyMoves(createSolved(), parseAlg('R')))
  })

  it('undo is ignored while moves are still playing', () => {
    const s = playReducer(initialPlayState(createSolved()), { type: 'turn', moves: parseAlg('R U') })
    expect(playReducer(s, { type: 'undo' })).toBe(s)
  })

  it('caps the queue', () => {
    const s = playReducer(initialPlayState(createSolved()), { type: 'turn', moves: Array(100).fill(parseMove('R')) })
    expect(s.queue.length + (s.anim ? 1 : 0)).toBeLessThanOrEqual(MAX_QUEUE + 1)
  })

  it('set replaces the cube and clears everything', () => {
    const scrambled = applyMoves(createSolved(), parseAlg('F2 L'))
    const s = playReducer(playReducer(initialPlayState(createSolved()), { type: 'turn', moves: parseAlg('R') }), { type: 'set', cube: scrambled })
    expect(s).toMatchObject({ cube: scrambled, target: scrambled, queue: [], anim: null, history: [] })
  })
})

describe('solve timer', () => {
  const R = parseAlg('R'), y = parseAlg('y')

  it('waits for the first layer turn, then stops when solved', () => {
    let t = timerReducer(initialTimer, { type: 'arm', label: 'Full solve' })
    t = timerReducer(t, { type: 'turn', moves: y, solvedAfter: false, now: 100 })
    expect(t.phase).toBe('ready') // rotating the cube doesn't start it
    t = timerReducer(t, { type: 'turn', moves: R, solvedAfter: false, now: 1000 })
    expect(t).toMatchObject({ phase: 'running', startedAt: 1000, moves: 1 })
    t = timerReducer(t, { type: 'turn', moves: [...R, ...y], solvedAfter: false, now: 2000 })
    expect(t.moves).toBe(2)
    t = timerReducer(t, { type: 'turn', moves: R, solvedAfter: true, now: 4500 })
    expect(t).toMatchObject({ phase: 'solved', elapsed: 3500, moves: 3, solveId: 1 })
  })

  it('does nothing in free play', () => {
    const t = timerReducer(initialTimer, { type: 'turn', moves: R, solvedAfter: true, now: 1 })
    expect(t).toBe(initialTimer)
  })

  it('works end to end with a real scramble', () => {
    const scramble = parseAlg("R U F'")
    const cube = applyMoves(createSolved(), scramble)
    expect(isSolved(cube)).toBe(false)
    let t = timerReducer(initialTimer, { type: 'arm', label: 'test' })
    let state = cube
    let now = 0
    for (const m of parseAlg("F U' R'")) {
      state = applyMoves(state, [m])
      t = timerReducer(t, { type: 'turn', moves: [m], solvedAfter: isSolved(state), now: (now += 500) })
    }
    expect(t).toMatchObject({ phase: 'solved', moves: 3, elapsed: 1000 })
  })
})

describe('results', () => {
  const r = (ms: number): Result => ({ ms, moves: 0, label: '', at: 0 })

  it('formats times like a speedcube timer', () => {
    expect(formatTime(9876)).toBe('9.87')
    expect(formatTime(83456)).toBe('1:23.45')
    expect(formatTime(0)).toBe('0.00')
  })

  it('ao5 drops the best and worst of the last five', () => {
    expect(averageOf([r(1), r(2), r(3), r(4)], 5)).toBeNull()
    expect(averageOf([r(99), r(10), r(20), r(30), r(40), r(1000)], 5)).toBe(30)
    expect(best([r(5), r(3), r(9)])).toBe(3)
  })
})
