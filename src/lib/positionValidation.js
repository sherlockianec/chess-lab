import { Chess } from 'chess.js'

/**
 * Validate a FEN before letting the user start a game from it.
 *
 * chess.js's own loader already rejects most of what makes a position illegal —
 * malformed ranks, a missing king, two kings of the same color, pawns on the back
 * rank, a bad move counter — and throws a specific, readable message for each one,
 * so we surface that message directly rather than re-deriving it.
 *
 * The one common real-chess rule chess.js does not check at load time is that the
 * side who just moved must not have left their own king in check; we add that
 * check here since it's cheap and easy to get wrong by hand in the editor.
 */
export function validatePosition(fen) {
  let chess
  try {
    chess = new Chess(fen)
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : 'Invalid position.' }
  }

  const sideToMove = chess.turn()
  const opponent = sideToMove === 'w' ? 'b' : 'w'
  const opponentKingSquares = chess.findPiece({ type: 'k', color: opponent })

  if (opponentKingSquares[0] && chess.isAttacked(opponentKingSquares[0], sideToMove)) {
    const opponentName = opponent === 'w' ? 'White' : 'Black'
    const moverName = sideToMove === 'w' ? 'White' : 'Black'
    return {
      ok: false,
      error: `${opponentName}'s king is already in check, but it's ${moverName} to move. Whoever just moved would have had to leave their own king in check — fix the position or whose turn it is.`,
    }
  }

  return { ok: true, fen: chess.fen() }
}
