import { useCallback, useEffect, useRef, useState } from 'react'
import { Link } from 'react-router'
import type { Formula } from '../api/types'
import { useMethod, useMethods } from '../api/useApi'
import CaseDiagram from '../components/CaseDiagram'
import CubeView from '../cube/CubeView'
import {
  applyMoves, caseState, createSolved, isSolved, orientationMoves, parseAlg, parseMove,
  randomScramble, type CubeState, type Move,
} from '../cube/model'
import { MAX_QUEUE, usePlayCube } from '../play/playCube'
import {
  averageOf, best, formatTime, useLiveElapsed, useResults, useSolveTimer,
  type Result, type TimerState,
} from '../play/timer'

// ---------- Controls ----------

/** Letter keys turn layers (Shift = counter-clockwise); x/y/z turn the whole cube. */
const KEY_MOVES: Record<string, string> = {
  KeyR: 'R', KeyL: 'L', KeyU: 'U', KeyD: 'D', KeyF: 'F', KeyB: 'B',
  KeyM: 'M', KeyE: 'E', KeyS: 'S', KeyX: 'x', KeyY: 'y', KeyZ: 'z',
}
/** Arrow keys look around the cube: ← shows the right side, ↑ shows the bottom. */
const ARROW_MOVES: Record<string, string> = {
  ArrowLeft: 'y', ArrowRight: "y'", ArrowUp: 'x', ArrowDown: "x'",
}

const PAD = [
  'R', "R'", 'U', "U'", 'F', "F'",
  'L', "L'", 'D', "D'", 'B', "B'",
  'M', "M'", 'x', "x'", 'y', "y'",
]

const isTyping = (t: EventTarget | null) =>
  t instanceof HTMLElement && (t.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(t.tagName))

/** The case a formula solves, held the way the formula expects (e.g. yellow on top). */
function heldCase(f: Formula): CubeState {
  const start = caseState(f.alg, f.hold)
  const orient = f.hold ? orientationMoves(start, f.hold.up, f.hold.front) ?? [] : []
  return applyMoves(start, orient)
}

// ---------- Page ----------

export default function PlayPage() {
  const play = usePlayCube(createSolved())
  const { results, add, clear } = useResults()
  const timer = useSolveTimer(
    useCallback((t: TimerState) => add({ ms: t.elapsed, moves: t.moves, label: t.label, at: Date.now() }), [add]),
  )
  const [pixel, setPixel] = useState(false)
  const [scramble, setScramble] = useState<string | null>(null)
  const [practicing, setPracticing] = useState<Formula | null>(null)
  const mainRef = useRef<HTMLElement>(null)

  /** On small screens the sheet sits below the cube: bring the cube back into view. */
  const showCube = () => {
    const el = mainRef.current
    if (!el || el.getBoundingClientRect().top >= 0) return
    const smooth = !window.matchMedia('(prefers-reduced-motion: reduce)').matches
    el.scrollIntoView({ behavior: smooth ? 'smooth' : 'auto', block: 'start' })
  }

  /** Every turn goes through here: keyboard, drag, move pad and formula playback. */
  const turn = (moves: Move[]) => {
    if (moves.length === 0 || play.queue.length >= MAX_QUEUE) return
    play.turn(moves)
    timer.turn(moves, isSolved(applyMoves(play.target, moves)))
  }

  const newScramble = () => {
    const alg = randomScramble()
    play.set(applyMoves(createSolved(), parseAlg(alg)))
    setScramble(alg)
    setPracticing(null)
    timer.arm('Full solve')
  }

  const reset = () => {
    play.set(createSolved())
    setScramble(null)
    setPracticing(null)
    timer.reset()
  }

  const practice = (f: Formula) => {
    play.set(heldCase(f))
    setScramble(null)
    setPracticing(f)
    timer.arm(f.name)
    showCube()
  }

  /** Set up the case, then play the formula on it (not timed). */
  const demo = (f: Formula) => {
    play.set(heldCase(f))
    play.turn(parseAlg(f.alg))
    setScramble(null)
    setPracticing(f)
    timer.reset()
    showCube()
  }

  // Keyboard controls. Re-subscribed every render so handlers see fresh state.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (isTyping(e.target) || e.altKey) return
      const undo = e.code === 'Backspace' || ((e.ctrlKey || e.metaKey) && e.code === 'KeyZ')
      if (undo) {
        e.preventDefault()
        play.undo()
        return
      }
      if (e.ctrlKey || e.metaKey || e.repeat) return // leave browser shortcuts alone
      const token = KEY_MOVES[e.code] ?? ARROW_MOVES[e.code]
      if (token) {
        e.preventDefault()
        const prime = e.shiftKey && !(e.code in ARROW_MOVES)
        turn([parseMove(prime ? `${token}'` : token)])
      } else if (e.code === 'Space') {
        e.preventDefault()
        if (timer.phase !== 'running') newScramble()
      } else if (e.code === 'Escape') {
        reset()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  })

  const speed = play.queue.length > 2 ? 0.07 : 0.15

  return (
    <div className="play">
      <section className="play-main" aria-label="Cube" ref={mainRef}>
        <TimerPanel timer={timer} results={results} />

        <div className="btn-row play-actions">
          <button type="button" className="btn primary" onClick={newScramble} disabled={timer.phase === 'running'}>
            Scramble <kbd>Space</kbd>
          </button>
          <button type="button" className="btn" onClick={play.undo} disabled={play.busy || play.history.length === 0}>
            Undo <kbd>⌫</kbd>
          </button>
          <button type="button" className="btn ghost" onClick={reset}>
            Reset <kbd>Esc</kbd>
          </button>
        </div>

        {(scramble || practicing) && (
          <div className="play-banner">
            <span className="kicker">{practicing ? `Practicing ${practicing.name}` : 'Scramble'}</span>
            <div className="alg">
              {parseAlg(practicing ? practicing.alg : scramble!).map((m, i) => <span key={i}>{m.token}</span>)}
            </div>
          </div>
        )}

        <CubeView
          className="play-viewer"
          state={play.cube}
          active={play.anim}
          turnDuration={speed}
          onMoveDone={play.onMoveDone}
          onTurn={(m) => turn([m])}
          pixelated={pixel}
        >
          <button type="button" className="viewer-toggle" aria-pressed={pixel} onClick={() => setPixel(!pixel)}
            title="Switch between smooth and pixel rendering">
            {pixel ? 'Pixel' : 'Smooth'}
          </button>
          <p className="play-hint">Drag a sticker to turn · drag the background to look around</p>
        </CubeView>

        <div className="move-pad" role="group" aria-label="Turn buttons">
          {PAD.map((t) => (
            <button key={t} type="button" className="btn small" onClick={() => turn([parseMove(t)])}
              aria-label={`Turn ${t}`}>
              {t}
            </button>
          ))}
        </div>

        <MoveLog history={play.history} />
        <KeyHelp />
      </section>

      <aside className="play-side" aria-label="Formula sheet">
        <FormulaSheet onPractice={practice} onDemo={demo} />
        <Results results={results} onClear={clear} />
      </aside>
    </div>
  )
}

// ---------- Timer ----------

function TimerPanel({ timer, results }: { timer: TimerState; results: Result[] }) {
  const live = useLiveElapsed(timer.phase === 'running', timer.startedAt)
  const shown = timer.phase === 'running' ? live : timer.phase === 'solved' ? timer.elapsed : 0
  const prevBest = best(results.slice(0, -1))
  const isBest = timer.phase === 'solved' && (prevBest === null || timer.elapsed <= prevBest)
  const tps = timer.elapsed > 0 ? (timer.moves / (timer.elapsed / 1000)).toFixed(1) : '-'

  return (
    <div className={`timer is-${timer.phase}`}>
      <div className="timer-digits" aria-label={`Time ${formatTime(shown)}`}>{formatTime(shown)}</div>
      <div className="timer-status" aria-live="polite">
        {timer.phase === 'free' && <>Free play. Press <strong>Scramble</strong> for a timed solve.</>}
        {timer.phase === 'ready' && <>{timer.label}: the timer starts on your first turn.</>}
        {timer.phase === 'running' && <>{timer.label} · {timer.moves} moves</>}
        {timer.phase === 'solved' && (
          <>
            <strong>Solved!</strong> {timer.label} · {timer.moves} moves · {tps} TPS
            {isBest && results.length > 1 && <span className="tag tag-yellow">New best</span>}
          </>
        )}
      </div>
    </div>
  )
}

function Results({ results, onClear }: { results: Result[]; onClear: () => void }) {
  const fmt = (ms: number | null) => (ms === null ? '-' : formatTime(ms))
  return (
    <section className="window play-results">
      <div className="window-bar"><span className="window-title">times.log</span></div>
      <div className="play-panel-body">
        <dl className="stats">
          <div><dt>Best</dt><dd>{fmt(best(results))}</dd></div>
          <div><dt>Ao5</dt><dd>{fmt(averageOf(results, 5))}</dd></div>
          <div><dt>Ao12</dt><dd>{fmt(averageOf(results, 12))}</dd></div>
          <div><dt>Solves</dt><dd>{results.length}</dd></div>
        </dl>
        {results.length > 0 ? (
          <>
            <ol className="times" reversed>
              {results.slice(-8).reverse().map((r) => (
                <li key={r.at}>
                  <strong>{formatTime(r.ms)}</strong>
                  <span className="muted">{r.label} · {r.moves} moves</span>
                </li>
              ))}
            </ol>
            <button type="button" className="btn small ghost" onClick={() => {
              if (window.confirm('Delete all saved times?')) onClear()
            }}>Clear times</button>
          </>
        ) : (
          <p className="muted small">No solves yet. Times are saved in this browser only.</p>
        )}
      </div>
    </section>
  )
}

// ---------- Formula sheet ----------

function FormulaSheet({ onPractice, onDemo }: { onPractice: (f: Formula) => void; onDemo: (f: Formula) => void }) {
  const methods = useMethods()
  const [slug, setSlug] = useState('cfop')
  const [stageId, setStageId] = useState('pll-full')
  const [query, setQuery] = useState('')
  const method = useMethod(slug)

  const stages = method.status === 'success' ? method.data.stages : []
  const stage = stages.find((s) => s.id === stageId) ?? stages[0]
  const q = query.trim().toLowerCase()
  const formulas = q
    ? stages.flatMap((s) => s.formulas).filter((f) => `${f.name} ${f.alg}`.toLowerCase().includes(q))
    : stage?.formulas ?? []

  return (
    <section className="window play-sheet">
      <div className="window-bar"><span className="window-title">formula_sheet.txt</span></div>
      <div className="play-panel-body">
        <div className="sheet-controls">
          <label className="sheet-field">
            <span className="kicker">Method</span>
            <select value={slug} onChange={(e) => { setSlug(e.target.value); setStageId('') }}>
              {methods.status === 'success' && methods.data.filter((m) => !m.comingSoon).map((m) => (
                <option key={m.slug} value={m.slug}>{m.name}</option>
              ))}
            </select>
          </label>
          <label className="sheet-field">
            <span className="kicker">Search</span>
            <input type="search" value={query} placeholder="T-perm, Sune, R U R'…" onChange={(e) => setQuery(e.target.value)} />
          </label>
        </div>

        {!q && (
          <div className="chips" role="tablist" aria-label="Stages">
            {stages.map((s) => (
              <button key={s.id} type="button" role="tab" aria-selected={s.id === stage?.id}
                className={`chip ${s.id === stage?.id ? 'is-active' : ''}`} onClick={() => setStageId(s.id)}>
                {s.name.replace(/^\d+\.\s*/, '')} <span className="muted">{s.formulas.length}</span>
              </button>
            ))}
          </div>
        )}

        <ul className="sheet-list">
          {formulas.map((f) => (
            <li key={f.id} className="sheet-row">
              <CaseDiagram formula={f} size={64} />
              <div className="sheet-info">
                <strong>{f.name}</strong>
                <code className="sheet-alg">{f.alg}</code>
                <div className="sheet-actions">
                  <button type="button" className="btn small primary" onClick={() => onPractice(f)}>Practice</button>
                  <button type="button" className="btn small" onClick={() => onDemo(f)}>Show me</button>
                </div>
              </div>
            </li>
          ))}
          {formulas.length === 0 && <li className="muted small">No formulas match “{query}”.</li>}
        </ul>
        {method.status === 'success' && (
          <p className="muted small">
            Step-by-step help for any of these: <Link to={`/method/${slug}`}>{method.data.name} guide</Link>.
          </p>
        )}
      </div>
    </section>
  )
}

// ---------- Move log & help ----------

function MoveLog({ history }: { history: Move[] }) {
  if (history.length === 0) return null
  const shown = history.slice(-30)
  return (
    <div className="move-log" aria-label="Moves so far">
      <span className="kicker">Moves ({history.length})</span>
      <div className="alg">
        {history.length > shown.length && <span className="muted">…</span>}
        {shown.map((m, i) => <span key={history.length - shown.length + i}>{m.token}</span>)}
      </div>
    </div>
  )
}

function KeyHelp() {
  return (
    <details className="key-help">
      <summary>Keyboard controls</summary>
      <table>
        <tbody>
          <tr><td><kbd>R</kbd> <kbd>L</kbd> <kbd>U</kbd> <kbd>D</kbd> <kbd>F</kbd> <kbd>B</kbd></td><td>Turn that face clockwise</td></tr>
          <tr><td><kbd>Shift</kbd> + letter</td><td>Counter-clockwise (R')</td></tr>
          <tr><td><kbd>M</kbd> <kbd>E</kbd> <kbd>S</kbd></td><td>Middle slices</td></tr>
          <tr><td><kbd>X</kbd> <kbd>Y</kbd> <kbd>Z</kbd> or arrow keys</td><td>Turn the whole cube</td></tr>
          <tr><td><kbd>Space</kbd></td><td>New scramble (starts a timed solve)</td></tr>
          <tr><td><kbd>⌫</kbd> or <kbd>Ctrl</kbd>+<kbd>Z</kbd></td><td>Undo</td></tr>
          <tr><td><kbd>Esc</kbd></td><td>Reset to solved</td></tr>
        </tbody>
      </table>
      <p className="muted small">On a phone or tablet: drag a sticker with your finger, or use the buttons.</p>
    </details>
  )
}
