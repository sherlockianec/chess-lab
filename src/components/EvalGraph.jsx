const WIDTH = 100
const HEIGHT = 38

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

/** A smooth curve through `points`: each interior point pulls the curve like a
 * control handle, and the line actually passes through the midpoint between
 * consecutive points -- a small, well-known trick for turning a jagged
 * point-to-point line into a gently rounded one without a full spline. */
function smoothLine(points) {
  if (points.length === 0) return ''
  if (points.length === 1) return `M ${points[0].x} ${points[0].y}`
  let d = `M ${points[0].x.toFixed(2)} ${points[0].y.toFixed(2)}`
  for (let i = 1; i < points.length - 1; i++) {
    const curr = points[i]
    const next = points[i + 1]
    const midX = (curr.x + next.x) / 2
    const midY = (curr.y + next.y) / 2
    d += ` Q ${curr.x.toFixed(2)} ${curr.y.toFixed(2)} ${midX.toFixed(2)} ${midY.toFixed(2)}`
  }
  const last = points[points.length - 1]
  d += ` L ${last.x.toFixed(2)} ${last.y.toFixed(2)}`
  return d
}

/**
 * Eval-over-time chart for game review, styled like a two-color "territory" map
 * rather than a plain line: white's share of the board fills in from the
 * bottom, black's from the top, split by a smoothed line at the current
 * evaluation. Clicking anywhere jumps to the nearest ply.
 */
export default function EvalGraph({ evals, positionCount, currentIndex, onSelect, analyzing }) {
  if (positionCount < 2) {
    return <p className="hint-text">Not enough moves yet to graph.</p>
  }

  const xAt = (i) => (i / (positionCount - 1)) * WIDTH
  const yAt = (i) => HEIGHT - (whitePercent(evals[i]) / 100) * HEIGHT
  const points = Array.from({ length: positionCount }, (_, i) => ({ x: xAt(i), y: yAt(i) }))

  const linePath = smoothLine(points)
  const areaPath = `${linePath} L ${points[points.length - 1].x.toFixed(2)} ${HEIGHT} L ${points[0].x.toFixed(2)} ${HEIGHT} Z`

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
        aria-label="Evaluation across the game — white's territory fills from the bottom, black's from the top"
      >
        <rect x="0" y="0" width={WIDTH} height={HEIGHT} className="eval-graph__bg-black" />
        <path d={areaPath} className="eval-graph__area-white" />
        <line x1="0" y1={HEIGHT / 2} x2={WIDTH} y2={HEIGHT / 2} className="eval-graph__zero" />
        <path d={linePath} className="eval-graph__line" fill="none" />
        <line x1={xAt(currentIndex)} y1="0" x2={xAt(currentIndex)} y2={HEIGHT} className="eval-graph__cursor" />
        <circle cx={xAt(currentIndex)} cy={yAt(currentIndex)} r="1.6" className="eval-graph__dot" />
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
