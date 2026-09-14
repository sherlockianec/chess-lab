// Small FEN helpers used by the position editor.
//
// The editor's single source of truth for an in-progress position is one full FEN
// string. These helpers let the UI read or change a single field (side to move,
// castling rights, en passant square) without disturbing the others. Board *piece
// placement* itself is owned by Chessground, not here — see PositionEditor.jsx.

export const START_FEN = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1'
export const EMPTY_FEN = '8/8/8/8/8/8/8/8 w - - 0 1'
export const EMPTY_PLACEMENT = '8/8/8/8/8/8/8/8'

const FILES = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h']
const CASTLING_ORDER = ['K', 'Q', 'k', 'q']

/** Split a FEN into its six named fields, filling in sane defaults for missing ones. */
export function parseFen(fen) {
  const parts = String(fen || '').trim().split(/\s+/)
  return {
    placement: parts[0] || EMPTY_PLACEMENT,
    turn: parts[1] === 'b' ? 'b' : 'w',
    castling: parts[2] || '-',
    ep: parts[3] || '-',
    halfmove: parts[4] || '0',
    fullmove: parts[5] || '1',
  }
}

/** Re-join the six FEN fields into one string. */
export function buildFen({ placement, turn, castling, ep, halfmove, fullmove }) {
  return [
    placement || EMPTY_PLACEMENT,
    turn === 'b' ? 'b' : 'w',
    castling || '-',
    ep || '-',
    halfmove ?? '0',
    fullmove ?? '1',
  ].join(' ')
}

/**
 * En passant is only legal on the rank behind a pawn that just double-stepped: rank
 * 6 if it's White to move (Black just played ...p5), rank 3 if Black is to move.
 * The editor offers these as candidate squares without trying to reconstruct real
 * move history — the position validator has the final say on legality.
 */
export function possibleEpSquares(turn) {
  const rank = turn === 'b' ? '3' : '6'
  return FILES.map((f) => `${f}${rank}`)
}

/** Add or remove one castling letter (K/Q/k/q), preserving the conventional order. */
export function withCastlingRight(castling, letter, enabled) {
  const set = new Set((castling === '-' ? '' : castling).split('').filter(Boolean))
  if (enabled) set.add(letter)
  else set.delete(letter)
  const next = CASTLING_ORDER.filter((l) => set.has(l)).join('')
  return next || '-'
}

export function hasCastlingRight(castling, letter) {
  return castling !== '-' && castling.includes(letter)
}

/** Map a placement-only FEN field to { a1: 'K', e8: 'k', ... } (letter case = color). */
function pieceMapFromPlacement(placement) {
  const board = {}
  const ranks = placement.split('/')
  for (let r = 0; r < ranks.length && r < 8; r++) {
    const rank = 8 - r
    let file = 0
    for (const ch of ranks[r]) {
      if (/\d/.test(ch)) {
        file += Number(ch)
      } else {
        const fileLetter = FILES[file]
        if (fileLetter) board[`${fileLetter}${rank}`] = ch
        file += 1
      }
    }
  }
  return board
}

/**
 * Recompute which castling rights are actually possible from where the kings and
 * rooks currently sit: a right requires its king AND its rook to both still be on
 * their home squares. Used to keep the editor's castling checkboxes truthful as
 * the position is edited, rather than leaving stale rights checked after a king
 * or rook is moved or removed.
 */
export function deriveCastlingRights(placement) {
  const board = pieceMapFromPlacement(placement)
  const whiteKingHome = board.e1 === 'K'
  const blackKingHome = board.e8 === 'k'
  let rights = ''
  if (whiteKingHome && board.h1 === 'R') rights += 'K'
  if (whiteKingHome && board.a1 === 'R') rights += 'Q'
  if (blackKingHome && board.h8 === 'r') rights += 'k'
  if (blackKingHome && board.a8 === 'r') rights += 'q'
  return rights || '-'
}
