import { useMemo, useState } from 'react'
import { Link, Route, Routes } from 'react-router'
import MethodPicker from './components/MethodPicker'
import { MethodPickerContext } from './components/methodPicker'
import { PixelArt } from './components/Pixel'
import { HEART } from './components/pixelIcons'
import { METHODS } from './data/methods'
import HomePage from './pages/HomePage'
import MethodPage from './pages/MethodPage'
import NotFound from './pages/NotFound'

function BrandMark() {
  return (
    <span className="brand-mark" aria-hidden>
      {['#ef5a3c', '#1fae5b', '#ffd23f', '#4f86f0'].map((c) => <i key={c} style={{ background: c }} />)}
    </span>
  )
}

/** Circular "stamp" with text running around it. */
function Stamp() {
  return (
    <svg className="stamp" viewBox="0 0 100 100" aria-hidden>
      <defs>
        <path id="stamp-circle" d="M50,50 m-37,0 a37,37 0 1,1 74,0 a37,37 0 1,1 -74,0" />
      </defs>
      <circle cx="50" cy="50" r="48" fill="none" stroke="currentColor" strokeWidth="1.5" />
      <circle cx="50" cy="50" r="27" fill="none" stroke="currentColor" strokeWidth="1.5" />
      <text className="stamp-ring"><textPath href="#stamp-circle">ALWAYS IN BETA · ALWAYS IN BETA · </textPath></text>
      <text x="50" y="47" textAnchor="middle" className="stamp-center">TURN</text>
      <text x="50" y="58" textAnchor="middle" className="stamp-center">SLOWLY</text>
    </svg>
  )
}

export default function App() {
  const [pickerOpen, setPickerOpen] = useState(false)
  const picker = useMemo(() => ({ open: () => setPickerOpen(true) }), [])

  return (
    <MethodPickerContext.Provider value={picker}>
      <div className="frame">
        <header className="topbar">
          <Link to="/" className="tb-cell brand">
            <BrandMark />
            <span className="brand-name">Reconcile</span>
            <span className="brand-tld">.cube</span>
          </Link>
          <div className="tb-cell tb-meta hide-sm">
            <span>Public notebook</span>
            <span>Learn by turning</span>
          </div>
          <div className="tb-cell tb-meta hide-md">
            <span>Version 0.1</span>
            <span>Always in beta</span>
          </div>
          <div className="tb-cell tb-grow" />
          <div className="tb-cell">
            <button type="button" className="pill" onClick={picker.open} aria-haspopup="dialog">
              Methods
              <span className="burger" aria-hidden><i /><i /><i /></span>
            </button>
          </div>
        </header>

        <main>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/method/:slug" element={<MethodPage />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </main>

        <footer className="footer">
          <div className="foot-cell foot-reminder">
            <span className="kicker">Reminder</span>
            <p className="foot-quote">Slow turns.<br />Fast solves.</p>
            <PixelArt rows={HEART} palette={{ X: '#f08bb4' }} scale={5} className="foot-heart" />
          </div>
          <div className="foot-cell foot-brand">
            <div>
              <strong className="foot-name">Reconcile.cube</strong>
              <p>A notebook for learning the cube.<br />Placeholder content, always in beta.</p>
            </div>
            <Stamp />
          </div>
          <nav className="foot-cell foot-links" aria-label="Footer">
            <button type="button" className="link-plain" onClick={picker.open}>All methods</button>
            {METHODS.filter((m) => !m.comingSoon).map((m) => (
              <Link key={m.slug} to={`/method/${m.slug}`}>{m.name}</Link>
            ))}
            <span className="muted">© 2026 Reconcile</span>
          </nav>
          <div className="foot-bar">
            <span>Collecting · Turning · Solving</span>
            <span>Made with three.js and too many scrambles</span>
          </div>
        </footer>
      </div>

      <MethodPicker open={pickerOpen} onClose={() => setPickerOpen(false)} />
    </MethodPickerContext.Provider>
  )
}
