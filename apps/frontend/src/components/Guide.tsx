import { useEffect, useMemo, useState } from 'react'
import CubeView from '../cube/CubeView'
import {
  applyMoves, caseState, COLOR_KEYS, colorCounts, COLORS, createSolved, describeMove,
  isCenterSticker, isSolved, orientationMoves, parseAlg, randomScramble, setSticker,
  type ColorKey,
} from '../cube/model'
import { usePlayback } from '../cube/usePlayback'
import type { Formula, Method } from '../data/methods'
import type { GuideState, GuideStep } from './guideState'
import CaseDiagram from './CaseDiagram'
import FaceNetEditor, { ColorPalette } from './FaceNetEditor'

const STEPS: { n: GuideStep; title: string }[] = [
  { n: 1, title: 'Enter your colors' },
  { n: 2, title: 'Pick a formula' },
  { n: 3, title: 'Follow along' },
]

const colorName = (c: ColorKey) => COLORS[c].name

function Dot({ c }: { c: ColorKey }) {
  return <span className="dot" style={{ background: COLORS[c].hex }} aria-hidden />
}

export default function Guide({ method, g }: { method: Method; g: GuideState }) {
  const [turnDuration, setTurnDuration] = useState(0.4)

  return (
    <section className="block guide" id="guide" aria-labelledby="guide-title">
      <header className="section-head">
        <span className="kicker">01 / Practice</span>
        <h2 id="guide-title">Guide me through a formula</h2>
        <p className="muted">
          Copy your real cube's colors here, pick a formula, and follow each turn on the 3D cube.
        </p>
      </header>

      <div className="window">
      <div className="window-bar">
        <span className="window-title">guide.exe</span>
        <span className="window-dots" aria-hidden><i /><i /><i /></span>
      </div>
      <ol className="stepper">
        {STEPS.map((s) => (
          <li key={s.n}>
            <button
              type="button"
              className={`stepper-item ${g.step === s.n ? 'is-active' : ''} ${g.step > s.n ? 'is-done' : ''}`}
              aria-current={g.step === s.n ? 'step' : undefined}
              onClick={() => g.setStep(s.n)}
            >
              <span className="stepper-num">{s.n}</span>
              <span className="stepper-title">{s.title}</span>
            </button>
          </li>
        ))}
      </ol>

      {g.step === 1 && <ColorsStep g={g} />}
      {g.step === 2 && <FormulaStep method={method} g={g} />}
      {g.step === 3 && g.formula && (
        // Colors, formula and hold can only change in steps 1–2, which unmounts
        // this, so playback always starts fresh.
        <PlayStep
          g={g}
          formula={g.formula}
          turnDuration={turnDuration}
          onTurnDuration={setTurnDuration}
        />
      )}
      </div>
    </section>
  )
}

function PixelToggle({ g }: { g: GuideState }) {
  return (
    <button type="button" className="viewer-toggle" aria-pressed={g.pixel} onClick={() => g.setPixel(!g.pixel)}
      title="Switch between smooth and pixel rendering">
      {g.pixel ? 'Pixel' : 'Smooth'}
    </button>
  )
}

// ---------- Step 1 ----------

function ColorsStep({ g }: { g: GuideState }) {
  const [brush, setBrush] = useState<ColorKey>('W')
  const counts = colorCounts(g.cube)
  const wrong = COLOR_KEYS.filter((c) => counts[c] !== 9)
  const formula = g.formula

  return (
    <div className="guide-body">
      <CubeView pixelated={g.pixel}
        className="guide-viewer"
        state={g.cube}
        onStickerClick={(pos, normal) => {
          if (!isCenterSticker(pos)) g.setCube(setSticker(g.cube, pos, normal, brush))
        }}
      >
        <PixelToggle g={g} />
      </CubeView>
      <div className="guide-panel">
        <p>
          Hold your cube with the <strong><Dot c="W" /> white center on top</strong> and the{' '}
          <strong><Dot c="G" /> green center facing you</strong>. Pick a color, then tap a square on
          the map or on the 3D cube.
        </p>
        <ColorPalette brush={brush} onBrushChange={setBrush} />
        <FaceNetEditor state={g.cube} onChange={g.setCube} brush={brush} onBrushChange={setBrush} />

        <div className={`notice ${wrong.length ? 'is-warn' : 'is-ok'}`} role="status">
          {wrong.length
            ? `Each color should appear 9 times. Check: ${wrong.map((c) => `${colorName(c)} (${counts[c]})`).join(', ')}.`
            : 'Color counts look right.'}
        </div>

        <div className="btn-row">
          <button type="button" className="btn" onClick={() => g.setCube(createSolved())}>Reset to solved</button>
          <button type="button" className="btn" onClick={() => g.setCube(applyMoves(createSolved(), parseAlg(randomScramble())))}>
            Random scramble
          </button>
          {formula && (
            <button type="button" className="btn" onClick={() => g.setCube(caseState(formula.alg, formula.hold))}>
              Load example for "{formula.name}"
            </button>
          )}
        </div>
        <div className="btn-row end">
          <button type="button" className="btn primary" onClick={() => g.setStep(2)}>Next: pick a formula →</button>
        </div>
      </div>
    </div>
  )
}

// ---------- Step 2 ----------

const OPPOSITE: Record<ColorKey, ColorKey> = { W: 'Y', Y: 'W', G: 'B', B: 'G', R: 'O', O: 'R' }

function FormulaStep({ method, g }: { method: Method; g: GuideState }) {
  const stageOf = (id?: string) => method.stages.find((s) => s.formulas.some((f) => f.id === id))
  const [stageId, setStageId] = useState(stageOf(g.formula?.id)?.id ?? method.stages[0]?.id)
  const stage = method.stages.find((s) => s.id === stageId)
  const orient = orientationMoves(g.cube, g.hold.up, g.hold.front)
  const suggested = g.formula?.hold
  const held = orient ? applyMoves(g.cube, orient) : g.cube

  return (
    <div className="guide-body">
      <CubeView pixelated={g.pixel}
        className="guide-viewer" state={held}>
        <PixelToggle g={g} />
      </CubeView>
      <div className="guide-panel">
        <label className="field-label" htmlFor="stage-select">Stage</label>
        <div className="chips" id="stage-select" role="tablist">
          {method.stages.map((s) => (
            <button key={s.id} type="button" role="tab" aria-selected={s.id === stageId}
              className={`chip ${s.id === stageId ? 'is-active' : ''}`} onClick={() => setStageId(s.id)}>
              {s.name}
            </button>
          ))}
        </div>
        {stage && <p className="muted small">{stage.goal}</p>}

        <div className="formula-picker" role="radiogroup" aria-label="Formula">
          {stage?.formulas.map((f) => (
            <button key={f.id} type="button" role="radio" aria-checked={g.formula?.id === f.id}
              className={`formula-option ${g.formula?.id === f.id ? 'is-active' : ''}`}
              onClick={() => g.selectFormula(f)}>
              <CaseDiagram formula={f} size={56} />
              <span>
                <strong>{f.name}</strong>
                <code className="alg-inline">{f.alg}</code>
              </span>
            </button>
          ))}
        </div>

        <fieldset className="hold">
          <legend className="field-label">How to hold the cube</legend>
          <HoldPicker label="Top" value={g.hold.up} disabled={[g.hold.front, OPPOSITE[g.hold.front]]}
            onChange={(up) => g.setHold({ ...g.hold, up })} />
          <HoldPicker label="Facing you" value={g.hold.front} disabled={[g.hold.up, OPPOSITE[g.hold.up]]}
            onChange={(front) => g.setHold({ ...g.hold, front })} />
          {suggested && (suggested.up !== g.hold.up || suggested.front !== g.hold.front) && (
            <p className="muted small">
              Suggested for this formula: {colorName(suggested.up)} on top, {colorName(suggested.front)} facing you.{' '}
              <button type="button" className="link" onClick={() => g.setHold(suggested)}>Use suggested</button>
            </p>
          )}
          {!orient && <div className="notice is-warn">Those two centers can't be on top and front at the same time.</div>}
        </fieldset>

        <div className="btn-row spread">
          <button type="button" className="btn" onClick={() => g.setStep(1)}>← Colors</button>
          <button type="button" className="btn primary" disabled={!g.formula || !orient} onClick={() => g.setStep(3)}>
            Start guide →
          </button>
        </div>
      </div>
    </div>
  )
}

function HoldPicker({ label, value, disabled, onChange }: {
  label: string; value: ColorKey; disabled: ColorKey[]; onChange: (c: ColorKey) => void
}) {
  return (
    <div className="hold-row">
      <span className="hold-label">{label}</span>
      <div className="palette small" role="radiogroup" aria-label={label}>
        {COLOR_KEYS.map((c) => (
          <button key={c} type="button" role="radio" aria-checked={value === c} aria-label={colorName(c)}
            title={colorName(c)} disabled={disabled.includes(c)}
            className={`swatch ${value === c ? 'is-active' : ''}`}
            style={{ '--swatch': COLORS[c].hex } as React.CSSProperties}
            onClick={() => onChange(c)} />
        ))}
      </div>
    </div>
  )
}

// ---------- Step 3 ----------

const SPEEDS = [
  { label: 'Slow', value: 0.8 },
  { label: 'Normal', value: 0.4 },
  { label: 'Fast', value: 0.2 },
]

function PlayStep({ g, formula, turnDuration, onTurnDuration }: {
  g: GuideState; formula: Formula; turnDuration: number; onTurnDuration: (d: number) => void
}) {
  const start = useMemo(
    () => applyMoves(g.cube, orientationMoves(g.cube, g.hold.up, g.hold.front) ?? []),
    [g.cube, g.hold],
  )
  const moves = useMemo(() => parseAlg(formula.alg), [formula.alg])
  const p = usePlayback(start, moves)
  const finished = p.step === p.total && !p.anim
  const shown = moves[Math.min(p.current, moves.length - 1)]

  // Keyboard: ← / → step, space play/pause.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement).closest('input, textarea, select')) return
      if (e.key === 'ArrowRight') p.next()
      else if (e.key === 'ArrowLeft') p.prev()
      else if (e.key === ' ') {
        e.preventDefault()
        if (p.playing) p.pause()
        else p.play()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  })

  return (
    <div className="guide-body">
      <CubeView pixelated={g.pixel}
        className="guide-viewer" state={p.cube} active={p.anim} turnDuration={turnDuration} onMoveDone={p.onMoveDone}>
        <PixelToggle g={g} />
      </CubeView>
      <div className="guide-panel">
        <div className="hold-summary">
          <span><Dot c={g.hold.up} /> {colorName(g.hold.up)} on top</span>
          <span><Dot c={g.hold.front} /> {colorName(g.hold.front)} facing you</span>
        </div>

        <div className="now" aria-live="polite">
          {finished ? (
            <>
              <div className="now-move done">✓</div>
              <div>
                <strong>{formula.name} complete</strong>
                <p className="muted small">
                  {isSolved(p.cube) ? 'Your cube is solved!' : 'Check that your cube matches the 3D cube.'}
                </p>
              </div>
            </>
          ) : (
            <>
              <div className="now-move">{shown.token}</div>
              <div>
                <strong>Move {p.current + 1} of {p.total}</strong>
                <p className="muted small">{describeMove(shown)}</p>
              </div>
            </>
          )}
        </div>

        <ol className="move-list" aria-label="Moves">
          {moves.map((m, i) => (
            <li key={i}>
              <button
                type="button"
                className={`move-chip ${i < p.step ? 'is-done' : ''} ${i === p.current && !finished ? 'is-current' : ''}`}
                onClick={() => p.jump(i)}
                title={`Jump to move ${i + 1}`}
              >
                {m.token}
              </button>
            </li>
          ))}
        </ol>

        <div className="controls">
          <button type="button" className="btn icon" onClick={() => p.jump(0)} aria-label="Restart" title="Restart">⏮</button>
          <button type="button" className="btn icon" onClick={p.prev} disabled={p.step === 0 || !!p.anim} aria-label="Previous move" title="Previous (←)">◀</button>
          <button type="button" className="btn primary icon wide" onClick={p.playing ? p.pause : p.play}
            aria-label={p.playing ? 'Pause' : 'Play'} title="Play / pause (space)">
            {p.playing ? '❚❚ Pause' : finished ? '↻ Replay' : '▶ Play'}
          </button>
          <button type="button" className="btn icon" onClick={p.next} disabled={finished || !!p.anim} aria-label="Next move" title="Next (→)">▶</button>
        </div>

        <div className="speed" role="radiogroup" aria-label="Speed">
          {SPEEDS.map((s) => (
            <button key={s.label} type="button" role="radio" aria-checked={turnDuration === s.value}
              className={`chip ${turnDuration === s.value ? 'is-active' : ''}`} onClick={() => onTurnDuration(s.value)}>
              {s.label}
            </button>
          ))}
        </div>

        <p className="muted small">{formula.description}</p>

        <div className="btn-row spread">
          <button type="button" className="btn" onClick={() => g.setStep(2)}>← Change formula</button>
          <button type="button" className="btn" onClick={() => g.setStep(1)}>Edit colors</button>
        </div>
      </div>
    </div>
  )
}
