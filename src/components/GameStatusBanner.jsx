export default function GameStatusBanner({ message, tone = 'info', thinking }) {
  if (!message && !thinking) return null
  return (
    <div className={`status-banner status-banner--${tone}`} role="status" aria-live="polite">
      {thinking && <span className="thinking-dot" aria-hidden="true" />}
      <span>{message}</span>
    </div>
  )
}
