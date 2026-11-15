import { Link } from 'react-router'
import { PixelFace } from '../components/Pixel'

export default function NotFound() {
  return (
    <div className="block not-found">
      <PixelFace pattern="WRWRWRWRW" size={96} />
      <h1 className="display">404</h1>
      <p className="muted">This page doesn't exist, or the method isn't ready yet.</p>
      <Link className="btn primary big" to="/">Back home</Link>
    </div>
  )
}
