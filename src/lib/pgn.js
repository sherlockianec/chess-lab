import { Chess } from 'chess.js'
import { START_FEN } from './fen.js'

/**
 * Build a PGN string from a starting FEN and the SAN moves played from there.
 * chess.js automatically adds [SetUp "1"] / [FEN "..."] headers when the game
 * didn't start from the standard position, so callers don't need to think about
 * that themselves.
 */
export function buildPgn(startFen, sanMoves, headers = {}) {
  const chess = new Chess(startFen || START_FEN)
  for (const [key, value] of Object.entries(headers)) {
    if (value) chess.header(key, String(value))
  }
  for (const san of sanMoves) chess.move(san)
  return chess.pgn()
}

/**
 * Parse a pasted PGN into the same { fen, san, from, to }[] shape the app's move
 * history uses elsewhere (index 0 is the starting position, san/from/to null).
 * chess.js's own loadPgn() gives the final position and a flat move list, but not
 * the FEN after every individual ply, so this replays the moves itself to
 * capture one.
 */
export function parsePgn(pgnText) {
  try {
    const loaded = new Chess()
    loaded.loadPgn(pgnText)
    const headers = loaded.header()
    const startingFen = headers.FEN || START_FEN
    const verboseHistory = loaded.history({ verbose: true })

    const replay = new Chess(startingFen)
    const positions = [{ fen: replay.fen(), san: null, from: null, to: null }]
    for (const move of verboseHistory) {
      replay.move(move.san)
      positions.push({ fen: replay.fen(), san: move.san, from: move.from, to: move.to })
    }
    return { ok: true, positions, headers }
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : 'Could not read that PGN.' }
  }
}
