const CHOICES = [
  { role: 'q', label: 'Queen', white: '♕', black: '♛' },
  { role: 'r', label: 'Rook', white: '♖', black: '♜' },
  { role: 'b', label: 'Bishop', white: '♗', black: '♝' },
  { role: 'n', label: 'Knight', white: '♘', black: '♞' },
]

/** Small modal asking which piece a pawn should promote to. `color` is 'w' | 'b'. */
export default function PromotionPicker({ color, onPick, onCancel }) {
  return (
    <div className="promotion-overlay" role="dialog" aria-modal="true" aria-label="Choose promotion piece" onClick={onCancel}>
      <div className="promotion-panel" onClick={(event) => event.stopPropagation()}>
        {CHOICES.map(({ role, label, white, black }) => (
          <button
            key={role}
            type="button"
            className="promotion-choice"
            onClick={() => onPick(role)}
            aria-label={`Promote to ${label}`}
            autoFocus={role === 'q'}
          >
            <span aria-hidden="true">{color === 'w' ? white : black}</span>
          </button>
        ))}
      </div>
    </div>
  )
}
