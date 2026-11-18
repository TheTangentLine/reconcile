import { useState } from 'react'
import { Link } from 'react-router'
import { useMethodPicker } from '../components/methodPicker'
import { PixelArt, PixelFace } from '../components/Pixel'
import { BRUSH, CLOUD, HEART, LIST, MOUSE, PAUSE, PLAY, SPARKLE, UP_ARROW } from '../components/pixelIcons'
import CubeView, { type ActiveMove } from '../cube/CubeView'
import { applyMove, createSolved, parseAlg, type CubeState } from '../cube/model'
import { useMethods } from '../api/useApi'
import LoadState from '../components/LoadState'

const LOOP_ALG = "R U R' U' R' F R2 U' R' U' R U R' F'"
const LOOP = parseAlg(LOOP_ALG)

/** Hero cube that keeps running the T-perm, which undoes itself every two loops. */
function useIdleLoop() {
  const [cube, setCube] = useState<CubeState>(createSolved)
  const [i, setI] = useState(0)
  const [paused, setPaused] = useState(false)
  const move = LOOP[i % LOOP.length]
  const active: ActiveMove | null = paused ? null : { move, id: i + 1 }
  return {
    cube, active, paused, move,
    index: i % LOOP.length,
    togglePause: () => setPaused((p) => !p),
    reset: () => { setCube(createSolved()); setI(0) },
    onMoveDone: () => {
      setCube((c) => applyMove(c, move))
      setI((n) => n + 1)
    },
  }
}

const pad = (n: number) => String(n).padStart(2, '0')

const STEPS = [
  { n: '01', title: 'Enter your colors', text: 'Paint the 3D cube or the unfolded map so it matches the cube in your hands.', icon: BRUSH },
  { n: '02', title: 'Pick a formula', text: 'Choose a stage and formula, plus which color goes on top and which faces you.', icon: LIST },
  { n: '03', title: 'Follow along', text: 'Watch one turn at a time. Pause, step back, or slow it down until it clicks.', icon: PLAY },
]

const NOTATION = [
  ['R', 'Right face clockwise'],
  ["R'", 'Right face counter-clockwise'],
  ['R2', 'Right face twice'],
  ['U  D', 'Up and down faces'],
  ['F  B', 'Front and back faces'],
  ['M', 'Middle slice, like L'],
  ['x y z', 'Turn the whole cube'],
]

export default function HomePage() {
  const picker = useMethodPicker()
  const idle = useIdleLoop()
  const [pixel, setPixel] = useState(true)
  const methods = useMethods()
  const formulas = methods.status === 'success'
    ? methods.data.reduce((n, m) => n + m.formulaCount, 0)
    : '--'

  return (
    <div className="home">
      {/* ---------- Hero ---------- */}
      <section className="hero" aria-labelledby="hero-title">
        <div className="h-title">
          <span className="h-counter" aria-label={`T-perm, move ${idle.index + 1} of ${LOOP.length}`}>
            [{pad(idle.index + 1)}/{LOOP.length}]
          </span>
          <h1 id="hero-title" className="stagger">
            <span style={{ '--x': 5 } as React.CSSProperties}>Learn</span>
            <span style={{ '--x': 0 } as React.CSSProperties}>the cube,</span>
            <span style={{ '--x': 3 } as React.CSSProperties}>one turn</span>
            <span style={{ '--x': 1 } as React.CSSProperties}>at a time</span>
          </h1>
        </div>

        <div className="h-stat">
          <div className="h-stat-num">
            <PixelArt rows={UP_ARROW} scale={5} />
            <strong>{formulas}</strong>
            <span>formulas</span>
          </div>
          <p>Every formula comes with a step-by-step 3D guide, from your first cross to your last PLL.</p>
        </div>

        <span className="h-word h-word-l" aria-hidden>Turn</span>
        <span className="h-word h-word-r" aria-hidden>Solve</span>

        <div className="h-cube-wrap">
          <CubeView className="h-cube" state={idle.cube} active={idle.active} turnDuration={0.55}
            onMoveDone={idle.onMoveDone} autoRotate pixelated={pixel} />
          {/* Floating stickers */}
          <div className="sticker sticker-move" style={{ '--r': '-8deg' } as React.CSSProperties} aria-hidden>
            <span>now</span><strong>{idle.move.token}</strong>
          </div>
          <PixelFace pattern="YYYYYYRYG" size={52} className="sticker sticker-face" />
          <PixelArt rows={SPARKLE} palette={{ X: '#ffb020' }} scale={4} className="sticker sticker-spark" />
          <PixelArt rows={HEART} palette={{ X: '#f08bb4' }} scale={5} className="sticker sticker-heart" />
          <PixelArt rows={CLOUD} scale={4} className="sticker sticker-cloud" />
        </div>

        <div className="h-note">
          <p>From your first scramble to your first full solve, we turn along with you.</p>
        </div>

        <div className="h-cta">
          <p>Copy your cube's colors, pick a formula, and follow every turn on a 3D cube you can spin around.</p>
          <div className="btn-row">
            <button type="button" className="btn primary big" onClick={picker.open} aria-haspopup="dialog">
              <PixelArt rows={PLAY} scale={2} /> Choose a method
            </button>
            <Link className="btn big" to="/play">Play &amp; time yourself</Link>
            <a className="btn big ghost" href="#how">How it works</a>
          </div>
        </div>

        <div className="h-tools" role="toolbar" aria-label="Hero cube controls">
          <button type="button" aria-pressed={pixel} onClick={() => setPixel(!pixel)} title="Pixel / smooth rendering">
            {pixel ? 'PX' : 'HD'}
          </button>
          <button type="button" onClick={idle.togglePause} title={idle.paused ? 'Play' : 'Pause'}
            aria-label={idle.paused ? 'Play cube animation' : 'Pause cube animation'}>
            {idle.paused ? <PixelArt rows={PLAY} scale={2} /> : <PixelArt rows={PAUSE} scale={2} />}
          </button>
          <button type="button" onClick={idle.reset} title="Reset to solved" aria-label="Reset cube to solved">↺</button>
        </div>

        <a className="h-scroll" href="#methods">
          <PixelArt rows={MOUSE} scale={2} />
          <span>Scroll to explore</span>
        </a>
      </section>

      {/* ---------- Notation marquee ---------- */}
      <div className="marquee" aria-hidden>
        <div className="marquee-track">
          {[0, 1].map((k) => (
            <span key={k}>
              R U R' U' ✦ F R U R' U' F' ✦ M2 U M2 U2 M2 U M2 ✦ R U R' U R U2 R' ✦ x y z ✦ U' L' U L ✦&nbsp;
            </span>
          ))}
        </div>
      </div>

      {/* ---------- Methods ---------- */}
      <section className="block" id="methods" aria-labelledby="methods-title">
        <header className="section-head row">
          <div>
            <span className="kicker">Methods</span>
            <h2 id="methods-title">Choose your path</h2>
            <p className="muted">Each method is a different way to solve. New? Start with Absolute Beginner.</p>
          </div>
          <button type="button" className="btn" onClick={picker.open}>Compare all</button>
        </header>
        <LoadState res={methods} label="methods" />
        {methods.status === 'success' && <div className="tiles">
          {methods.data.map((m) => {
            const count = m.formulaCount
            const body = (
              <>
                <div className="tile-head">
                  <span className="tile-letter">{m.letter}</span>
                  <span className="tile-name">{m.name}</span>
                </div>
                <p className="tile-desc">{m.tagline}</p>
                <PixelFace pattern={m.face} size={88} className="tile-face" />
                <div className="tile-foot">
                  <span className="tile-arrow" aria-hidden>{m.comingSoon ? '…' : '→'}</span>
                  <span>{m.comingSoon ? 'Coming soon' : `${m.level} · ${count} formulas`}</span>
                </div>
              </>
            )
            return m.comingSoon ? (
              <div key={m.slug} className="tile is-disabled" style={{ background: m.accent }} aria-disabled>{body}</div>
            ) : (
              <Link key={m.slug} to={`/method/${m.slug}`} className="tile" style={{ background: m.accent }}>{body}</Link>
            )
          })}
        </div>}
      </section>

      {/* ---------- How it works ---------- */}
      <section className="block" id="how" aria-labelledby="how-title">
        <header className="section-head">
          <span className="kicker">How it works</span>
          <h2 id="how-title">Three steps, one turn at a time</h2>
        </header>
        <ol className="how">
          {STEPS.map((s) => (
            <li key={s.n} className="how-card ticks">
              <div className="how-top">
                <span className="how-num">{s.n}</span>
                <PixelArt rows={s.icon} palette={{ Y: '#ffd23f' }} scale={5} />
              </div>
              <h3>{s.title}</h3>
              <p className="muted">{s.text}</p>
            </li>
          ))}
        </ol>
      </section>

      {/* ---------- Notebook / notation ---------- */}
      <section className="notebook" aria-labelledby="notation-title">
        <div className="note">
          <span className="note-tape" aria-hidden />
          <h3 id="notation-title">Notation cheat sheet</h3>
          <ul>
            {NOTATION.map(([k, v]) => (
              <li key={k}><code>{k}</code><span>{v}</span></li>
            ))}
          </ul>
        </div>
        <div className="notebook-copy">
          <PixelArt rows={SPARKLE} palette={{ X: '#f08bb4' }} scale={5} />
          <p>
            This isn't a speedcubing course.<br />
            It's a notebook you turn along with,<br />
            at your own speed, as often as you like.
          </p>
          <button type="button" className="link-arrow" onClick={picker.open}>Open a method →</button>
        </div>
      </section>
    </div>
  )
}
