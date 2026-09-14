// Solid glyph shapes only (see PiecePalette.jsx for why) — color is applied via
// CSS classes (.is-white / .is-black) rather than switching Unicode code points.
const CHOICES = [
  { role: 'q', label: 'Queen', glyph: '♛' },
  { role: 'r', label: 'Rook', glyph: '♜' },
  { role: 'b', label: 'Bishop', glyph: '♝' },
  { role: 'n', label: 'Knight', glyph: '♞' },
]

/** Small modal asking which piece a pawn should promote to. `color` is 'w' | 'b'. */
export default function PromotionPicker({ color, onPick, onCancel }) {
  return (
    <div className="promotion-overlay" role="dialog" aria-modal="true" aria-label="Choose promotion piece" onClick={onCancel}>
      <div className="promotion-panel" onClick={(event) => event.stopPropagation()}>
        {CHOICES.map(({ role, label, glyph }) => (
          <button
            key={role}
            type="button"
            className={`promotion-choice ${color === 'w' ? 'is-white' : 'is-black'}`}
            onClick={() => onPick(role)}
            aria-label={`Promote to ${label}`}
            autoFocus={role === 'q'}
          >
            <span aria-hidden="true">{glyph}</span>
          </button>
        ))}
      </div>
    </div>
  )
}
