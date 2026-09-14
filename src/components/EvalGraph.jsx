const WIDTH = 100
const HEIGHT = 34

function whitePercent(ev) {
  if (!ev) return 50
  if (typeof ev.mate === 'number') return ev.mate > 0 ? 97 : 3
  if (typeof ev.cp === 'number') return 50 + 50 * Math.tanh(ev.cp / 100 / 3)
  return 50
}

function formatEval(ev) {
  if (!ev) return '—'
  if (typeof ev.mate === 'number') return `M${Math.abs(ev.mate)}`
  if (typeof ev.cp === 'number') {
    const pawns = ev.cp / 100
    return pawns > 0 ? `+${pawns.toFixed(1)}` : pawns.toFixed(1)
  }
  return '—'
}

/**
 * A compact eval-over-time chart for game review. Pass an evals map keyed by ply
 * index (sparse is fine — points without an eval yet just sit at the midline).
 * Clicking anywhere on the graph jumps to the nearest ply.
 */
export default function EvalGraph({ evals, positionCount, currentIndex, onSelect, analyzing }) {
  if (positionCount < 2) {
    return <p className="hint-text">Not enough moves yet to graph.</p>
  }

  const xAt = (i) => (i / (positionCount - 1)) * WIDTH
  const yAt = (i) => HEIGHT - (whitePercent(evals[i]) / 100) * HEIGHT

  let path = ''
  for (let i = 0; i < positionCount; i++) {
    path += `${i === 0 ? 'M' : 'L'} ${xAt(i).toFixed(2)} ${yAt(i).toFixed(2)} `
  }

  const handleClick = (event) => {
    const rect = event.currentTarget.getBoundingClientRect()
    const ratio = (event.clientX - rect.left) / rect.width
    onSelect(Math.round(ratio * (positionCount - 1)))
  }

  const analyzedCount = Object.keys(evals).length
  const currentEval = evals[currentIndex]

  return (
    <div className="eval-graph">
      <svg
        viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
        preserveAspectRatio="none"
        className="eval-graph__svg"
        onClick={handleClick}
        role="img"
        aria-label="Evaluation across the game"
      >
        <line x1="0" y1={HEIGHT / 2} x2={WIDTH} y2={HEIGHT / 2} className="eval-graph__zero" />
        <path d={path} className="eval-graph__area-top" fill="none" />
        <line
          x1={xAt(currentIndex)}
          y1="0"
          x2={xAt(currentIndex)}
          y2={HEIGHT}
          className="eval-graph__cursor"
        />
        <circle cx={xAt(currentIndex)} cy={yAt(currentIndex)} r="1.8" className="eval-graph__dot" />
      </svg>
      <div className="eval-graph__footer">
        <span>{formatEval(currentEval)}</span>
        {analyzing && (
          <span className="hint-text hint-text--muted">
            Analyzing… {analyzedCount}/{positionCount}
          </span>
        )}
      </div>
    </div>
  )
}
