// Pure helpers for reading Stockfish's UCI output and writing UCI move strings.
// Kept free of any Worker/DOM code so it's easy to reason about (and test) on its own.

/**
 * Parse one `info ...` line into the bits the UI cares about. Returns null for
 * info lines that carry no depth/score (e.g. NNUE load messages), so callers can
 * skip them.
 *
 * Example line:
 *   "info depth 12 seldepth 20 multipv 1 score cp 38 nodes 259129 nps 540979
 *    hashfull 88 time 479 pv g1f3 b8c6 d2d4"
 */
export function parseInfoLine(line) {
  const depthMatch = line.match(/(?:^| )depth (\d+)/)
  const cpMatch = line.match(/ score cp (-?\d+)/)
  const mateMatch = line.match(/ score mate (-?\d+)/)
  const pvMatch = line.match(/ pv (.+)$/)
  const nodesMatch = line.match(/ nodes (\d+)/)

  if (!depthMatch && !cpMatch && !mateMatch) return null

  return {
    depth: depthMatch ? Number(depthMatch[1]) : undefined,
    cp: cpMatch ? Number(cpMatch[1]) : undefined,
    mate: mateMatch ? Number(mateMatch[1]) : undefined,
    pv: pvMatch ? pvMatch[1].trim().split(/\s+/) : undefined,
    nodes: nodesMatch ? Number(nodesMatch[1]) : undefined,
  }
}

/** Parse a `bestmove e2e4 ponder e7e5` (or just `bestmove e2e4`, or `bestmove (none)`) line. */
export function parseBestmoveLine(line) {
  const tokens = line.trim().split(/\s+/)
  const bestmove = tokens[1]
  const ponderIndex = tokens.indexOf('ponder')
  return {
    bestmove: !bestmove || bestmove === '(none)' ? null : bestmove,
    ponder: ponderIndex > -1 ? tokens[ponderIndex + 1] : null,
  }
}

/** "e7e8q" -> { from: "e7", to: "e8", promotion: "q" }; "e2e4" -> { from, to }. */
export function uciMoveToObject(uciMove) {
  return {
    from: uciMove.slice(0, 2),
    to: uciMove.slice(2, 4),
    promotion: uciMove.length > 4 ? uciMove.slice(4, 5) : undefined,
  }
}

/**
 * UCI scores are always relative to the side to move. Flip the sign when it's
 * Black's turn so the rest of the app can treat the number as "positive favors
 * White", the usual convention for an evaluation bar.
 */
export function scoreToWhitePerspective(info, turn) {
  if (!info) return null
  const sign = turn === 'b' ? -1 : 1
  if (typeof info.mate === 'number') return { mate: info.mate * sign }
  if (typeof info.cp === 'number') return { cp: info.cp * sign }
  return null
}
