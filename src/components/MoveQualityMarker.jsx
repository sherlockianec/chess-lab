import { squareToPercent } from '../lib/boardGeometry.js'

const EDGE_MARGIN = 5 // percent -- keeps the badge from being clipped by the board frame's rounded corners

/** Positioned absolutely within .board-frame, at the top-right corner of `square`. */
export default function MoveQualityMarker({ square, orientation, classification }) {
  if (!square || !classification) return null
  const { left, top } = squareToPercent(square, orientation)
  const anchorLeft = Math.min(100 - EDGE_MARGIN, Math.max(EDGE_MARGIN, left + 12.5))
  const anchorTop = Math.min(100 - EDGE_MARGIN, Math.max(EDGE_MARGIN, top))
  return (
    <div
      className={`move-quality-marker quality-badge--${classification.key}`}
      style={{ left: `${anchorLeft}%`, top: `${anchorTop}%` }}
      title={classification.label}
      aria-hidden="true"
    >
      {classification.symbol}
    </div>
  )
}
