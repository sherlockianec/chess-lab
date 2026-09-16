import { getPieceIconUrl } from '../lib/pieceIcons.js'

const CHOICES = [
  { role: 'queen', label: 'Queen' },
  { role: 'rook', label: 'Rook' },
  { role: 'bishop', label: 'Bishop' },
  { role: 'knight', label: 'Knight' },
]

/** Small modal asking which piece a pawn should promote to. `color` is 'w' | 'b'. */
export default function PromotionPicker({ color, pieceSet, onPick, onCancel }) {
  const fullColor = color === 'w' ? 'white' : 'black'
  return (
    <div className="promotion-overlay" role="dialog" aria-modal="true" aria-label="Choose promotion piece" onClick={onCancel}>
      <div className="promotion-panel" onClick={(event) => event.stopPropagation()}>
        {CHOICES.map(({ role, label }) => (
          <button
            key={role}
            type="button"
            className="promotion-choice"
            onClick={() => onPick(role[0])}
            aria-label={`Promote to ${label}`}
            autoFocus={role === 'queen'}
          >
            <img src={getPieceIconUrl(pieceSet, fullColor, role)} alt="" draggable={false} />
          </button>
        ))}
      </div>
    </div>
  )
}
