import { useEffect, useState } from 'react'
import {
  EMPTY_FEN,
  EMPTY_PLACEMENT,
  START_FEN,
  buildFen,
  hasCastlingRight,
  parseFen,
  possibleEpSquares,
  withCastlingRight,
} from '../lib/fen.js'
import PiecePalette from './PiecePalette.jsx'

export default function PositionEditor({
  fen,
  onChange,
  onResetToInitial,
  validationError,
  eraserActive,
  onEraserToggle,
  onPaletteDragStart,
}) {
  const parsed = parseFen(fen)
  const [fenDraft, setFenDraft] = useState(fen)
  const [copyLabel, setCopyLabel] = useState('Copy FEN')

  // Keep the editable FEN textbox following the real position, but only while the
  // user isn't actively mid-edit of it (avoided by only syncing on mount / explicit resets).
  useEffect(() => setFenDraft(fen), [fen])

  const setField = (patch) => onChange(buildFen({ ...parsed, ...patch }))

  const handleTurnChange = (turn) => {
    // A stale en-passant square for the wrong side to move is almost always
    // meaningless, so clear it whenever the side to move changes.
    setField({ turn, ep: '-' })
  }

  const handleLoadFen = () => onChange(fenDraft.trim())

  const handleCopyFen = async () => {
    try {
      await navigator.clipboard.writeText(fen)
      setCopyLabel('Copied!')
    } catch {
      setCopyLabel('Copy failed')
    }
    setTimeout(() => setCopyLabel('Copy FEN'), 1500)
  }

  return (
    <section className="panel-section" aria-label="Position editor">
      <h2 className="panel-heading">Position</h2>

      <PiecePalette eraserActive={eraserActive} onEraserToggle={onEraserToggle} onDragStart={onPaletteDragStart} />
      <p className="hint-text">Drag a piece onto the board to place it, or drag a board piece off it to remove it.</p>

      <div className="button-row">
        <button type="button" className="btn btn--ghost" onClick={() => onChange(START_FEN)}>
          Standard position
        </button>
        <button type="button" className="btn btn--ghost" onClick={() => onChange(EMPTY_FEN)}>
          Empty board
        </button>
        <button type="button" className="btn btn--ghost" onClick={() => setField({ placement: EMPTY_PLACEMENT })}>
          Clear pieces
        </button>
        <button type="button" className="btn btn--ghost" onClick={onResetToInitial}>
          Reset
        </button>
      </div>

      <fieldset className="field-group">
        <legend>Side to move</legend>
        <label className="radio-label">
          <input type="radio" name="turn" checked={parsed.turn === 'w'} onChange={() => handleTurnChange('w')} />
          White to move
        </label>
        <label className="radio-label">
          <input type="radio" name="turn" checked={parsed.turn === 'b'} onChange={() => handleTurnChange('b')} />
          Black to move
        </label>
      </fieldset>

      <fieldset className="field-group">
        <legend>Castling rights</legend>
        <div className="checkbox-grid">
          <label className="checkbox-label">
            <input
              type="checkbox"
              checked={hasCastlingRight(parsed.castling, 'K')}
              onChange={(e) => setField({ castling: withCastlingRight(parsed.castling, 'K', e.target.checked) })}
            />
            White O-O
          </label>
          <label className="checkbox-label">
            <input
              type="checkbox"
              checked={hasCastlingRight(parsed.castling, 'Q')}
              onChange={(e) => setField({ castling: withCastlingRight(parsed.castling, 'Q', e.target.checked) })}
            />
            White O-O-O
          </label>
          <label className="checkbox-label">
            <input
              type="checkbox"
              checked={hasCastlingRight(parsed.castling, 'k')}
              onChange={(e) => setField({ castling: withCastlingRight(parsed.castling, 'k', e.target.checked) })}
            />
            Black O-O
          </label>
          <label className="checkbox-label">
            <input
              type="checkbox"
              checked={hasCastlingRight(parsed.castling, 'q')}
              onChange={(e) => setField({ castling: withCastlingRight(parsed.castling, 'q', e.target.checked) })}
            />
            Black O-O-O
          </label>
        </div>
      </fieldset>

      <fieldset className="field-group">
        <legend>En passant target</legend>
        <label className="sr-only" htmlFor="ep-square">
          En passant target square
        </label>
        <select id="ep-square" value={parsed.ep} onChange={(e) => setField({ ep: e.target.value })}>
          <option value="-">None</option>
          {possibleEpSquares(parsed.turn).map((sq) => (
            <option key={sq} value={sq}>
              {sq}
            </option>
          ))}
        </select>
      </fieldset>

      <fieldset className="field-group">
        <legend>FEN</legend>
        <label className="sr-only" htmlFor="fen-input">
          FEN string
        </label>
        <textarea
          id="fen-input"
          className="fen-input"
          rows={2}
          value={fenDraft}
          onChange={(e) => setFenDraft(e.target.value)}
          spellCheck={false}
        />
        <div className="button-row">
          <button type="button" className="btn btn--ghost" onClick={handleLoadFen}>
            Load FEN
          </button>
          <button type="button" className="btn btn--ghost" onClick={handleCopyFen}>
            {copyLabel}
          </button>
        </div>
      </fieldset>

      {validationError && (
        <p className="validation-error" role="alert">
          {validationError}
        </p>
      )}
    </section>
  )
}
