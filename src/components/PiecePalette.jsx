const PALETTE = [
  { role: 'k', color: 'w' }, { role: 'q', color: 'w' }, { role: 'r', color: 'w' },
  { role: 'b', color: 'w' }, { role: 'n', color: 'w' }, { role: 'p', color: 'w' },
  { role: 'k', color: 'b' }, { role: 'q', color: 'b' }, { role: 'r', color: 'b' },
  { role: 'b', color: 'b' }, { role: 'n', color: 'b' }, { role: 'p', color: 'b' },
]

const GLYPHS = {
  w: { k: '♔', q: '♕', r: '♖', b: '♗', n: '♘', p: '♙' },
  b: { k: '♚', q: '♛', r: '♜', b: '♝', n: '♞', p: '♟' },
}

const ROLE_NAMES = { k: 'king', q: 'queen', r: 'rook', b: 'bishop', n: 'knight', p: 'pawn' }
const COLOR_NAMES = { w: 'white', b: 'black' }

/**
 * A grid of draggable piece swatches plus an eraser tool. Chessground's
 * dragNewPiece() needs the *native* mouse/touch event that started the drag, so
 * each swatch wires mousedown/touchstart directly rather than a plain onClick.
 */
export default function PiecePalette({ eraserActive, onEraserToggle, onDragStart }) {
  const startDrag = ({ role, color }) => (event) => {
    event.preventDefault()
    onDragStart({ role: ROLE_NAMES[role], color: COLOR_NAMES[color] }, event.nativeEvent ?? event)
  }

  return (
    <div className="piece-palette">
      <div className="piece-palette__grid">
        {PALETTE.map(({ role, color }) => (
          <button
            key={`${color}-${role}`}
            type="button"
            className="piece-swatch"
            onMouseDown={startDrag({ role, color })}
            onTouchStart={startDrag({ role, color })}
            aria-label={`Drag a ${COLOR_NAMES[color]} ${ROLE_NAMES[role]} onto the board`}
            title={`${COLOR_NAMES[color]} ${ROLE_NAMES[role]}`}
          >
            <span aria-hidden="true">{GLYPHS[color][role]}</span>
          </button>
        ))}
      </div>
      <button
        type="button"
        className={`piece-swatch piece-swatch--eraser${eraserActive ? ' is-active' : ''}`}
        onClick={onEraserToggle}
        aria-pressed={eraserActive}
        aria-label="Eraser: click a square on the board to remove its piece"
        title="Eraser — click a piece on the board to remove it"
      >
        <span aria-hidden="true">⌫</span>
      </button>
    </div>
  )
}
