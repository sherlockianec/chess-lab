import { useRef } from 'react'
import { getPieceIconUrl } from '../lib/pieceIcons.js'

const PALETTE = [
  { role: 'king', color: 'white' }, { role: 'queen', color: 'white' }, { role: 'rook', color: 'white' },
  { role: 'bishop', color: 'white' }, { role: 'knight', color: 'white' }, { role: 'pawn', color: 'white' },
  { role: 'king', color: 'black' }, { role: 'queen', color: 'black' }, { role: 'rook', color: 'black' },
  { role: 'bishop', color: 'black' }, { role: 'knight', color: 'black' }, { role: 'pawn', color: 'black' },
]

const toolKey = (tool) => (tool && tool !== 'eraser' ? `${tool.color}-${tool.role}` : null)
const DRAG_THRESHOLD_PX = 6

/**
 * A grid of piece swatches plus an eraser tool, supporting two ways to place a
 * piece: drag it onto the board (Chessground's dragNewPiece, anchored to the
 * mousemove/touchmove event that first crosses the drag threshold), or tap it
 * once to "arm" it, then tap a board square to drop it there without dragging.
 *
 * Swatches show the same artwork as the active piece set (see lib/pieceIcons.js)
 * rather than Unicode glyphs, so color is never ambiguous and the palette always
 * matches whichever theme is selected.
 *
 * Each press starts its own short-lived gesture with its own move/up handlers
 * (rather than shared component-level callbacks), so there's no risk of a stale
 * closure from a previous render mismatching the listener that gets removed.
 */
export default function PiecePalette({ pieceSet, activeTool, onSelectTool, onEraserToggle, onDragStart }) {
  const activeToolRef = useRef(activeTool)
  activeToolRef.current = activeTool

  const point = (e) => (e.touches && e.touches.length ? e.touches[0] : e)

  const startGesture = (piece) => (event) => {
    event.preventDefault()
    const start = point(event.nativeEvent ?? event)
    const startX = start.clientX
    const startY = start.clientY
    let dragging = false

    function cleanup() {
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('mouseup', onUp)
      window.removeEventListener('touchmove', onMove)
      window.removeEventListener('touchend', onUp)
    }

    function onMove(e) {
      if (dragging) return
      const p = point(e)
      if (Math.hypot(p.clientX - startX, p.clientY - startY) > DRAG_THRESHOLD_PX) {
        dragging = true
        cleanup()
        onDragStart(piece, e)
      }
    }

    function onUp() {
      cleanup()
      if (!dragging) {
        onSelectTool(toolKey(activeToolRef.current) === toolKey(piece) ? null : piece)
      }
    }

    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup', onUp)
    window.addEventListener('touchmove', onMove, { passive: false })
    window.addEventListener('touchend', onUp)
  }

  const activeKey = toolKey(activeTool)

  return (
    <div className="piece-palette">
      <div className="piece-palette__grid">
        {PALETTE.map((piece) => {
          const thisKey = `${piece.color}-${piece.role}`
          return (
            <button
              key={thisKey}
              type="button"
              className={`piece-swatch${activeKey === thisKey ? ' is-active' : ''}`}
              onMouseDown={startGesture(piece)}
              onTouchStart={startGesture(piece)}
              aria-pressed={activeKey === thisKey}
              aria-label={`${piece.color} ${piece.role}: drag onto the board, or tap then tap a square`}
              title={`${piece.color} ${piece.role} — drag, or tap then tap a square`}
            >
              <img src={getPieceIconUrl(pieceSet, piece.color, piece.role)} alt="" draggable={false} />
            </button>
          )
        })}
      </div>
      <button
        type="button"
        className={`piece-swatch piece-swatch--eraser${activeTool === 'eraser' ? ' is-active' : ''}`}
        onClick={onEraserToggle}
        aria-pressed={activeTool === 'eraser'}
        aria-label="Eraser: tap a square on the board to remove its piece"
        title="Eraser — tap a piece on the board to remove it"
      >
        <span aria-hidden="true">⌫</span>
      </button>
    </div>
  )
}
