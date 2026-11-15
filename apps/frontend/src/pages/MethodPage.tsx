import { Link, useParams } from 'react-router'
import FormulaList from '../components/FormulaList'
import Guide from '../components/Guide'
import { useGuideState } from '../components/guideState'
import { useMethodPicker } from '../components/methodPicker'
import { PixelFace } from '../components/Pixel'
import { getMethod, type Method } from '../data/methods'
import NotFound from './NotFound'

export default function MethodPage() {
  const { slug } = useParams()
  const method = getMethod(slug)
  if (!method || method.comingSoon) return <NotFound />
  // Keyed so guide state resets when switching methods.
  return <MethodContent key={method.slug} method={method} />
}

function MethodContent({ method }: { method: Method }) {
  const g = useGuideState(method)
  const picker = useMethodPicker()
  const formulas = method.stages.reduce((n, s) => n + s.formulas.length, 0)

  return (
    <div className="method">
      <section className="m-hero">
        <div className="m-hero-copy">
          <nav className="crumbs" aria-label="Breadcrumb">
            <Link to="/">Home</Link> <span aria-hidden>/</span>{' '}
            <button type="button" className="link-plain" onClick={picker.open}>Methods</button>{' '}
            <span aria-hidden>/</span> <span aria-current="page">{method.name}</span>
          </nav>
          <span className="tag tag-yellow">{method.level}</span>
          <h1 className="display">{method.name}</h1>
          <p className="lead">{method.summary}</p>
          <div className="btn-row">
            <a className="btn primary big" href="#guide">Start practicing</a>
            <button type="button" className="btn big" onClick={picker.open} aria-haspopup="dialog">Switch method</button>
          </div>
        </div>

        <div className="m-hero-tile" style={{ background: method.accent }}>
          <span className="m-hero-letter">{method.letter}</span>
          <PixelFace pattern={method.face} size={120} className="m-hero-face" />
          <dl className="m-stats">
            <div><dt>Stages</dt><dd>{method.stages.length}</dd></div>
            <div><dt>Formulas</dt><dd>{formulas}</dd></div>
            <div><dt>Avg moves</dt><dd>{method.avgMoves}</dd></div>
          </dl>
        </div>
      </section>

      <nav className="jump" aria-label="On this page">
        <a href="#guide">Guide me</a>
        <a href="#formulas">Formulas</a>
        {method.stages.map((s) => (
          <a key={s.id} href={`#stage-${s.id}`}>{s.name}</a>
        ))}
      </nav>

      <Guide method={method} g={g} />

      <FormulaList
        method={method}
        onGuide={(f) => {
          g.selectFormula(f)
          g.setStep(2)
          document.getElementById('guide')?.scrollIntoView({ behavior: 'smooth' })
        }}
      />
    </div>
  )
}
