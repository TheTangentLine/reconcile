import type { Resource } from '../api/useApi'

/** Placeholder shown while a request is loading, or with a retry button when it fails. */
export default function LoadState({ res, label, className = '' }: {
  res: Resource<unknown> & { retry: () => void }
  label: string
  className?: string
}) {
  if (res.status === 'success') return null
  if (res.status === 'loading') {
    return <div className={`load-state ${className}`} role="status">Loading {label}<span className="dots" aria-hidden /></div>
  }
  return (
    <div className={`load-state is-error ${className}`} role="alert">
      <span>Couldn't load {label}. {res.error.message}</span>
      <button type="button" className="btn small" onClick={res.retry}>Try again</button>
    </div>
  )
}
