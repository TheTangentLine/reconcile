import { useEffect, useRef } from 'react'
import { Link, useLocation } from 'react-router'
import { METHODS } from '../data/methods'
import { PixelFace } from './Pixel'

/** "Choose a method" window, built on the native <dialog> (focus trap + Esc for free). */
export default function MethodPicker({ open, onClose }: { open: boolean; onClose: () => void }) {
  const ref = useRef<HTMLDialogElement>(null)
  const { pathname } = useLocation()

  useEffect(() => {
    const d = ref.current
    if (!d) return
    if (open && !d.open) d.showModal()
    if (!open && d.open) d.close()
  }, [open])

  return (
    <dialog
      ref={ref}
      className="picker"
      aria-labelledby="picker-title"
      onClose={onClose}
      // Clicking the dimmed backdrop closes the window.
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div className="window-bar">
        <span className="window-title" id="picker-title">select_method.exe</span>
        <button type="button" className="window-close" onClick={onClose} aria-label="Close">×</button>
      </div>

      <div className="picker-body">
        <p className="picker-lead">
          <span className="kicker">Choose your method</span>
          New to cubing? Start with <strong>Absolute Beginner</strong>.
        </p>

        <ul className="picker-list">
          {METHODS.map((m, i) => {
            const formulas = m.stages.reduce((n, s) => n + s.formulas.length, 0)
            const current = pathname === `/method/${m.slug}`
            const inner = (
              <>
                <span className="picker-letter" style={{ background: m.accent }}>{m.letter}</span>
                <span className="picker-info">
                  <span className="picker-name">
                    {m.name}
                    {current && <span className="tag tag-ink">You are here</span>}
                    {m.comingSoon && <span className="tag">Soon</span>}
                  </span>
                  <span className="picker-tagline">{m.tagline}</span>
                  <span className="picker-meta">
                    {m.level} · {m.stages.length} stages · {formulas} formulas · {m.avgMoves} moves
                  </span>
                </span>
                <PixelFace pattern={m.face} size={48} className="picker-face" />
              </>
            )
            return (
              <li key={m.slug} style={{ '--i': i } as React.CSSProperties}>
                {m.comingSoon ? (
                  <div className="picker-item is-disabled" aria-disabled>{inner}</div>
                ) : (
                  <Link to={`/method/${m.slug}`} className="picker-item" onClick={onClose}>
                    {inner}
                    <span className="picker-arrow" aria-hidden>→</span>
                  </Link>
                )}
              </li>
            )
          })}
        </ul>
      </div>

      <div className="picker-foot">
        <span>Tab to move · Enter to open</span>
        <span>Esc to close</span>
      </div>
    </dialog>
  )
}
