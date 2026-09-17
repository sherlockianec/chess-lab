export default function MoveQualityBadge({ classification, size = 'md' }) {
  if (!classification) return null
  return (
    <span className={`quality-badge quality-badge--${classification.key} quality-badge--${size}`}>
      {classification.symbol && <span className="quality-badge__symbol">{classification.symbol}</span>}
      {classification.label}
    </span>
  )
}
