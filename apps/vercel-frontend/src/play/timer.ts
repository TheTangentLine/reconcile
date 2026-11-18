// Solve timer: armed by a scramble, starts on the first real turn, stops the
// moment the cube is solved.
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { isRotation, type Move } from '../cube/model'

export type Phase = 'free' | 'ready' | 'running' | 'solved'

export interface TimerState {
  phase: Phase
  /** What is being timed: "Full solve", or a formula name when practicing a case. */
  label: string
  startedAt: number
  /** Final time in ms once solved. */
  elapsed: number
  /** Layer turns since the timer started (whole-cube rotations don't count). */
  moves: number
  /** Increases on every finished solve, so it can be recorded exactly once. */
  solveId: number
}

export type TimerAction =
  | { type: 'arm'; label: string }
  | { type: 'turn'; moves: Move[]; solvedAfter: boolean; now: number }
  | { type: 'reset' }

export const initialTimer: TimerState = { phase: 'free', label: '', startedAt: 0, elapsed: 0, moves: 0, solveId: 0 }

export function timerReducer(s: TimerState, a: TimerAction): TimerState {
  switch (a.type) {
    case 'arm':
      return { ...s, phase: 'ready', label: a.label, startedAt: 0, elapsed: 0, moves: 0 }
    case 'reset':
      return { ...s, phase: 'free', label: '', startedAt: 0, elapsed: 0, moves: 0 }
    case 'turn': {
      const turns = a.moves.filter((m) => !isRotation(m)).length
      if (s.phase === 'ready') {
        if (turns === 0) return s // looking around doesn't start the clock
        const started = { ...s, phase: 'running' as const, startedAt: a.now, moves: turns }
        return a.solvedAfter ? { ...started, phase: 'solved', elapsed: 0, solveId: s.solveId + 1 } : started
      }
      if (s.phase === 'running') {
        const moves = s.moves + turns
        return a.solvedAfter
          ? { ...s, phase: 'solved', moves, elapsed: a.now - s.startedAt, solveId: s.solveId + 1 }
          : { ...s, moves }
      }
      return s
    }
  }
}

/**
 * The timer for the play page. `onSolved` is called once per finished solve,
 * from the same event that solved the cube (no effect needed).
 */
export function useSolveTimer(onSolved: (s: TimerState) => void) {
  const [state, setState] = useState(initialTimer)
  const current = useRef(initialTimer)
  const onSolvedRef = useRef(onSolved)
  useEffect(() => {
    onSolvedRef.current = onSolved
  })

  const dispatch = useCallback((a: TimerAction) => {
    const prev = current.current
    const next = timerReducer(prev, a)
    if (next === prev) return
    current.current = next
    setState(next)
    if (next.solveId !== prev.solveId) onSolvedRef.current(next)
  }, [])

  const actions = useMemo(() => ({
    arm: (label: string) => dispatch({ type: 'arm', label }),
    reset: () => dispatch({ type: 'reset' }),
    turn: (moves: Move[], solvedAfter: boolean) =>
      dispatch({ type: 'turn', moves, solvedAfter, now: performance.now() }),
  }), [dispatch])
  return { ...state, ...actions }
}

/** Milliseconds since `startedAt`, refreshed every animation frame while `running`. */
export function useLiveElapsed(running: boolean, startedAt: number) {
  const [now, setNow] = useState(0)
  useEffect(() => {
    if (!running) return
    let raf = 0
    const tick = () => {
      setNow(performance.now())
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [running])
  return running ? Math.max(0, now - startedAt) : 0
}

/** 83456 → "1:23.45", 9876 → "9.87". */
export function formatTime(ms: number) {
  const cs = Math.floor(ms / 10)
  const minutes = Math.floor(cs / 6000)
  const seconds = Math.floor((cs % 6000) / 100)
  const hundredths = String(cs % 100).padStart(2, '0')
  return minutes > 0 ? `${minutes}:${String(seconds).padStart(2, '0')}.${hundredths}` : `${seconds}.${hundredths}`
}

// ---------- Results ----------

export interface Result {
  ms: number
  moves: number
  label: string
  at: number // Date.now()
}

/**
 * Average of the last n times, dropping the best and the worst (how speedcubers
 * count "ao5" / "ao12"). null until there are n results.
 */
export function averageOf(results: Result[], n: number): number | null {
  if (results.length < n) return null
  const last = results.slice(-n).map((r) => r.ms).sort((a, b) => a - b)
  const kept = last.slice(1, -1)
  return kept.reduce((a, b) => a + b, 0) / kept.length
}

export const best = (results: Result[]) =>
  results.length ? Math.min(...results.map((r) => r.ms)) : null

const STORAGE_KEY = 'reconcile.play.results.v1'
const MAX_RESULTS = 100

function load(): Result[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    const parsed: unknown = raw ? JSON.parse(raw) : []
    return Array.isArray(parsed) ? (parsed as Result[]).filter((r) => typeof r?.ms === 'number') : []
  } catch {
    return []
  }
}

/** Results kept in this browser only (localStorage); the page works without it. */
export function useResults() {
  const [results, setResults] = useState<Result[]>(load)
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(results))
    } catch {
      /* storage unavailable (private mode, blocked): keep results in memory */
    }
  }, [results])
  const add = useCallback((r: Result) => setResults((rs) => [...rs, r].slice(-MAX_RESULTS)), [])
  const clear = useCallback(() => setResults([]), [])
  return { results, add, clear }
}
