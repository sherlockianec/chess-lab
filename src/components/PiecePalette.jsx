import { useRef } from 'react'

const PALETTE = [
  { role: 'k', color: 'w' }, { role: 'q', color: 'w' }, { role: 'r', color: 'w' },
  { role: 'b', color: 'w' }, { role: 'n', color: 'w' }, { role: 'p', color: 'w' },
  { role: 'k', color: 'b' }, { role: 'q', color: 'b' }, { role: 'r', color: 'b' },
  { role: 'b', color: 'b' }, { role: 'n', color: 'b' }, { role: 'p', color: 'b' },
]

// Deliberately the SOLID glyph shapes for both colors (never the hollow "white"
// code points). Hollow chess glyphs render wildly inconsistently across fonts —
// on some systems the hollow interior fills in with `color` anyway, making the
// white and black swatches nearly indistinguishable or even swapped-looking.
// Solid shapes plus our own fill color behave predictably everywhere.
const GLYPHS = { k: '♚', q: '♛', r: '♜', b: '♝', n: '♞', p: '♟' }
const ROLE_NAMES = { k: 'king', q: 'queen', r: 'rook', b: 'bishop', n: 'knight', p: 'pawn' }
const COLOR_NAMES = { w: 'white', b: 'black' }

const toolKey = (tool) => (tool && tool !== 'eraser' ? `${tool.color}-${tool.role}` : null)
const DRAG_THRESHOLD_PX = 6

/**
 * A grid of piece swatches plus an eraser tool, supporting two ways to place a
 * piece: drag it onto the board (Chessground's dragNewPiece, anchored to the
 * mousemove/touchmove event that first crosses the drag threshold), or tap it
 * once to "arm" it, then tap a board square to drop it there without dragging.
 *
 * activeTool is one of: null, 'eraser', or a piece object { role: 'king', color:
 * 'white' }, owned by the parent so the board's square-tap handler can react to
 * it the same way regardless of how it got armed.
 *
 * Each press starts its own short-lived gesture with its own move/up handlers
 * (rather than shared component-level callbacks), so there's no risk of a stale
 * closure from a previous render mismatching the listener that gets removed.
 */
export default function PiecePalette({ activeTool, onSelectTool, onEraserToggle, onDragStart }) {
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
        onDragStart({ role: ROLE_NAMES[piece.role], color: COLOR_NAMES[piece.color] }, e)
      }
    }

    function onUp() {
      cleanup()
      if (!dragging) {
        const armed = { role: ROLE_NAMES[piece.role], color: COLOR_NAMES[piece.color] }
        onSelectTool(toolKey(activeToolRef.current) === toolKey(armed) ? null : armed)
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
        {PALETTE.map(({ role, color }) => {
          const thisKey = `${COLOR_NAMES[color]}-${ROLE_NAMES[role]}`
          return (
            <button
              key={thisKey}
              type="button"
              className={`piece-swatch piece-swatch--${color === 'w' ? 'white' : 'black'}${activeKey === thisKey ? ' is-active' : ''}`}
              onMouseDown={startGesture({ role, color })}
              onTouchStart={startGesture({ role, color })}
              aria-pressed={activeKey === thisKey}
              aria-label={`${COLOR_NAMES[color]} ${ROLE_NAMES[role]}: drag onto the board, or tap then tap a square`}
              title={`${COLOR_NAMES[color]} ${ROLE_NAMES[role]} — drag, or tap then tap a square`}
            >
              <span aria-hidden="true">{GLYPHS[role]}</span>
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
