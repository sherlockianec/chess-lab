const TONE_BY_KEY = {
  brilliant: 'brilliant',
  great: 'great',
  best: 'best',
  excellent: 'excellent',
  good: 'good',
  book: 'book',
  inaccuracy: 'inaccuracy',
  mistake: 'mistake',
  miss: 'miss',
  blunder: 'blunder',
}

export default function MoveQualityBadge({ classification, size = 'md' }) {
  if (!classification) return null
  return (
    <span className={`quality-badge quality-badge--${TONE_BY_KEY[classification.key]} quality-badge--${size}`}>
      {classification.label}
    </span>
  )
}
