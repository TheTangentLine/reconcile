// State for the play page's cube: a queue of moves animated one at a time.
import { useCallback, useMemo, useReducer } from 'react'
import type { ActiveMove } from '../cube/CubeView'
import { applyMove, applyMoves, invertMove, type CubeState, type Move } from '../cube/model'

export interface PlayState {
  /** What's on screen, not counting the turn being animated. */
  cube: CubeState
  /** Where the cube ends up once every queued move has played. */
  target: CubeState
  queue: Move[]
  anim: (ActiveMove & { undo?: boolean }) | null
  nextId: number
  /** Moves already applied, oldest first (for undo and the move log). */
  history: Move[]
}

export type PlayAction =
  | { type: 'turn'; moves: Move[] }
  | { type: 'done' }
  | { type: 'undo' }
  | { type: 'set'; cube: CubeState }

/** Keeps the queue short when someone types faster than the animation. */
export const MAX_QUEUE = 24

const startNext = (s: PlayState): PlayState => {
  if (s.anim || s.queue.length === 0) return s
  const [move, ...queue] = s.queue
  return { ...s, queue, anim: { move, id: s.nextId }, nextId: s.nextId + 1 }
}

export function playReducer(s: PlayState, a: PlayAction): PlayState {
  switch (a.type) {
    case 'turn': {
      const room = Math.max(0, MAX_QUEUE - s.queue.length)
      const moves = a.moves.slice(0, room)
      if (moves.length === 0) return s
      return startNext({ ...s, target: applyMoves(s.target, moves), queue: [...s.queue, ...moves] })
    }
    case 'done': {
      if (!s.anim) return s
      const cube = applyMove(s.cube, s.anim.move)
      const history = s.anim.undo ? s.history : [...s.history, s.anim.move]
      return startNext({ ...s, cube, history, anim: null })
    }
    case 'undo': {
      // Only when nothing is playing, so "undo" always means the last move you saw.
      if (s.anim || s.queue.length > 0 || s.history.length === 0) return s
      const last = s.history[s.history.length - 1]
      const inverse = invertMove(last)
      return {
        ...s,
        history: s.history.slice(0, -1),
        target: applyMove(s.target, inverse),
        anim: { move: inverse, id: s.nextId, undo: true },
        nextId: s.nextId + 1,
      }
    }
    case 'set':
      return { cube: a.cube, target: a.cube, queue: [], anim: null, nextId: s.nextId + 1, history: [] }
  }
}

export function initialPlayState(cube: CubeState): PlayState {
  return { cube, target: cube, queue: [], anim: null, nextId: 1, history: [] }
}

export function usePlayCube(start: CubeState) {
  const [state, dispatch] = useReducer(playReducer, start, initialPlayState)
  const actions = useMemo(() => ({
    turn: (moves: Move[]) => dispatch({ type: 'turn', moves }),
    undo: () => dispatch({ type: 'undo' }),
    set: (cube: CubeState) => dispatch({ type: 'set', cube }),
  }), [])
  const onMoveDone = useCallback(() => dispatch({ type: 'done' }), [])
  return { ...state, ...actions, onMoveDone, busy: !!state.anim || state.queue.length > 0 }
}
