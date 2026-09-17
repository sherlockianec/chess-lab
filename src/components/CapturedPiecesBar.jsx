import { getPieceIconUrl } from '../lib/pieceIcons.js'
import { ROLE_NAME } from '../lib/material.js'

const VALUE_ORDER = ['q', 'r', 'b', 'n', 'p'] // show the most valuable trophies first

function Row({ pieces, capturedColor, pieceSet, label }) {
  const sorted = [...pieces].sort((a, b) => VALUE_ORDER.indexOf(a.role) - VALUE_ORDER.indexOf(b.role))
  return (
    <div className="captured-row">
      <div className="captured-row__icons">
        {sorted.map(({ role, count }) => (
          <span key={role} className="captured-piece">
            <img src={getPieceIconUrl(pieceSet, capturedColor, ROLE_NAME[role])} alt="" draggable={false} />
            {count > 1 && <span className="captured-piece__count">×{count}</span>}
          </span>
        ))}
      </div>
      {label && <span className="captured-row__label">{label}</span>}
    </div>
  )
}

/**
 * Two trophy rows -- pieces White has captured (shown in Black's color) above
 * or below pieces Black has captured (shown in White's color), arranged to
 * match board orientation the same way the clocks are: whichever side is
 * visually "away" from the viewer sits on top.
 */
export default function CapturedPiecesBar({ material, orientation, pieceSet, visible, position = 'top' }) {
  if (!visible || !material) return null

  const showWhiteRow = position === 'top' ? orientation === 'black' : orientation === 'white'
  return showWhiteRow ? (
    <Row pieces={material.capturedByWhite} capturedColor="black" pieceSet={pieceSet} label={material.whiteLabel} />
  ) : (
    <Row pieces={material.capturedByBlack} capturedColor="white" pieceSet={pieceSet} label={material.blackLabel} />
  )
}
