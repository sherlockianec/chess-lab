/** Vertical eval bar. `evaluation` is { cp } | { mate } | null, always from White's perspective. */
export default function EvalBar({ evaluation, visible }) {
  if (!visible) return null

  let whitePercent = 50
  let label = '0.0'

  if (evaluation && typeof evaluation.mate === 'number') {
    whitePercent = evaluation.mate > 0 ? 99 : 1
    label = `M${Math.abs(evaluation.mate)}`
  } else if (evaluation && typeof evaluation.cp === 'number') {
    const pawns = evaluation.cp / 100
    // A saturating curve: small edges move the bar a little, big ones approach the
    // ends without ever quite reaching them (a huge material lead still shows as
    // "close to winning", not "already over").
    whitePercent = 50 + 50 * Math.tanh(pawns / 3)
    label = pawns > 0 ? `+${pawns.toFixed(1)}` : pawns.toFixed(1)
  }

  return (
    <div className="eval-bar" role="img" aria-label={`Engine evaluation: ${label}, from White's perspective`}>
      <div className="eval-bar__black" style={{ height: `${100 - whitePercent}%` }} />
      <span className="eval-bar__label">{label}</span>
    </div>
  )
}
