import { useCallback, useReducer } from 'react'
import type { ActiveMove } from './CubeView'
import { applyMove, applyMoves, invertMove, type CubeState, type Move } from './model'

interface State {
  cube: CubeState // state after `step` moves, not counting the running animation
  step: number
  anim: (ActiveMove & { dir: 1 | -1 }) | null
  playing: boolean
  nextId: number
}

type Action =
  | { type: 'next' }
  | { type: 'prev' }
  | { type: 'done' }
  | { type: 'play' }
  | { type: 'pause' }
  | { type: 'jump'; step: number }

/**
 * Step through `moves` starting from `start`. Remount the owner (via `key`)
 * when `start` or `moves` change, so the playback restarts cleanly.
 */
export function usePlayback(start: CubeState, moves: Move[]) {
  const reducer = useCallback(
    (s: State, a: Action): State => {
      const forward = (st: State): State =>
        st.step < moves.length
          ? { ...st, anim: { move: moves[st.step], id: st.nextId, dir: 1 }, nextId: st.nextId + 1 }
          : { ...st, playing: false }

      switch (a.type) {
        case 'next':
          return s.anim ? s : forward(s)
        case 'prev':
          if (s.anim || s.step === 0) return s
          return {
            ...s,
            playing: false,
            anim: { move: invertMove(moves[s.step - 1]), id: s.nextId, dir: -1 },
            nextId: s.nextId + 1,
          }
        case 'done': {
          if (!s.anim) return s
          const after: State = {
            ...s,
            cube: applyMove(s.cube, s.anim.move),
            step: s.step + s.anim.dir,
            anim: null,
          }
          return after.playing ? forward(after) : after
        }
        case 'play': {
          // At the end? Start over from the beginning.
          const base = s.step >= moves.length && !s.anim ? { ...s, cube: start, step: 0 } : s
          const playing = { ...base, playing: true }
          return playing.anim ? playing : forward(playing)
        }
        case 'pause':
          return { ...s, playing: false }
        case 'jump':
          return {
            ...s,
            cube: applyMoves(start, moves.slice(0, a.step)),
            step: a.step,
            anim: null,
            playing: false,
          }
      }
    },
    [moves, start],
  )

  const [state, dispatch] = useReducer(reducer, {
    cube: start,
    step: 0,
    anim: null,
    playing: false,
    nextId: 1,
  })

  return {
    ...state,
    total: moves.length,
    /** The move being shown or about to be done next. */
    current: state.anim ? state.anim.dir === 1 ? state.step : state.step - 1 : state.step,
    next: () => dispatch({ type: 'next' }),
    prev: () => dispatch({ type: 'prev' }),
    play: () => dispatch({ type: 'play' }),
    pause: () => dispatch({ type: 'pause' }),
    jump: (step: number) => dispatch({ type: 'jump', step }),
    onMoveDone: () => dispatch({ type: 'done' }),
  }
}
