import { useState } from 'react'
import { parseAlg } from '../cube/model'
import type { Formula, Method } from '../api/types'
import CaseDiagram from './CaseDiagram'

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false)
  return (
    <button
      type="button"
      className="btn small"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(text)
          setCopied(true)
          setTimeout(() => setCopied(false), 1200)
        } catch {
          /* clipboard unavailable */
        }
      }}
    >
      {copied ? 'Copied!' : 'Copy'}
    </button>
  )
}

export default function FormulaList({ method, onGuide }: { method: Method; onGuide: (f: Formula) => void }) {
  return (
    <section className="block formulas" id="formulas" aria-labelledby="formulas-title">
      <header className="section-head">
        <span className="kicker">02 / Reference</span>
        <h2 id="formulas-title">Formulas</h2>
        <p className="muted">
          Each diagram shows the top of the cube before you start. Press <strong>Guide me</strong> to
          practice it step by step.
        </p>
      </header>

      {method.stages.map((stage, si) => (
        <div key={stage.id} className="stage" id={`stage-${stage.id}`}>
          <div className="stage-head">
            <span className="stage-num">{String(si + 1).padStart(2, '0')}</span>
            <div>
              <h3>{stage.name.replace(/^\d+\.\s*/, '')}</h3>
              <p className="muted">{stage.goal}</p>
            </div>
          </div>
          <div className="formula-grid">
            {stage.formulas.map((f) => (
              <article key={f.id} className="formula-card ticks">
                <div className="formula-diagram">
                  <CaseDiagram formula={f} />
                </div>
                <div className="formula-body">
                  <h4>{f.name}</h4>
                  <div className="alg" aria-label={`Formula: ${f.alg}`}>
                    {parseAlg(f.alg).map((m, i) => <span key={i}>{m.token}</span>)}
                  </div>
                  <p className="muted small">{f.description}</p>
                  <div className="btn-row">
                    <button type="button" className="btn primary small" onClick={() => onGuide(f)}>
                      Guide me
                    </button>
                    <CopyButton text={f.alg} />
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>
      ))}
    </section>
  )
}
