// Classifies each played move by how much evaluation it cost compared to the
// position's best available continuation (the same per-ply evals already
// computed for the review graph), plus a few well-defined special cases.
//
// This is an original, documented approximation inspired by the kind of move
// annotations used by lichess/chess.com-style analysis tools, not a
// reproduction of any specific product's proprietary algorithm -- there's no
// real opening book behind "Book", and "Brilliant"/"Great" use simple, checkable
// heuristics (a real sacrifice that still wins; finding the only good move in a
// tense position) rather than a full second engine line. Treat the exact
// thresholds as a reasonable default, not a calibrated standard.

const LABELS = {
  brilliant: 'Brilliant',
  great: 'Great',
  best: 'Best',
  excellent: 'Excellent',
  good: 'Good',
  book: 'Book',
  inaccuracy: 'Inaccuracy',
  mistake: 'Mistake',
  miss: 'Miss',
  blunder: 'Blunder',
}

// A distinct mark per category for the on-board annotation, loosely following
// classical chess-notation punctuation (!!, !, ?!, ?, ??) where it already fits,
// with a few new ones invented for categories that don't have a traditional
// symbol (this is Chess Lab's own scheme, not a standard notation).
const SYMBOLS = {
  brilliant: '!!',
  great: '!',
  best: '✓',
  excellent: '✔',
  good: '○',
  book: '≡',
  inaccuracy: '?!',
  mistake: '?',
  miss: '⊘',
  blunder: '??',
}

export const MOVE_QUALITY_ORDER = Object.keys(LABELS)

const MATE_SCORE_BASE = 100000
const BOOK_PLIES = 10 // first 5 full moves
const PIECE_VALUES = { p: 1, n: 3, b: 3, r: 5, q: 9, k: 0 }

function toComparableCp(ev) {
  if (!ev) return null
  if (typeof ev.mate === 'number') {
    const magnitude = MATE_SCORE_BASE - Math.min(Math.abs(ev.mate), 100) * 10
    return ev.mate > 0 ? magnitude : -magnitude
  }
  if (typeof ev.cp === 'number') return ev.cp
  return null
}

function materialFor(placement, color) {
  let total = 0
  for (const ch of placement) {
    const isWhite = ch === ch.toUpperCase()
    if (!/[a-zA-Z]/.test(ch)) continue
    if ((color === 'w') === isWhite) total += PIECE_VALUES[ch.toLowerCase()] || 0
  }
  return total
}

/**
 * Classify every ply that has evaluations on both sides of it. Returns a map
 * keyed by ply index (1-based, matching `positions` indices) to
 * { label, key, lossCp }. Plies without both evals yet are simply omitted, so
 * this naturally fills in progressively as review analysis completes.
 */
export function classifyMoves(positions, evals) {
  const results = {}

  for (let i = 1; i < positions.length; i++) {
    const beforeEv = evals[i - 1]
    const afterEv = evals[i]
    const beforeCp = toComparableCp(beforeEv)
    const afterCp = toComparableCp(afterEv)
    if (beforeCp === null || afterCp === null) continue

    // The side to move *before* this ply is the one who played it.
    const mover = positions[i - 1].fen.split(' ')[1] === 'b' ? 'b' : 'w'
    const sign = mover === 'w' ? 1 : -1
    const beforeForMover = beforeCp * sign
    const afterForMover = afterCp * sign
    const loss = Math.max(0, beforeForMover - afterForMover)

    let key
    if (loss <= 4) {
      const beforePlacement = positions[i - 1].fen.split(' ')[0]
      const afterPlacement = positions[i].fen.split(' ')[0]
      const materialDrop = materialFor(beforePlacement, mover) - materialFor(afterPlacement, mover)
      const stillWinning = afterForMover > 150
      if (materialDrop >= 3 && stillWinning) {
        key = 'brilliant'
      } else if (Math.abs(beforeForMover) < 150) {
        key = 'great'
      } else {
        key = 'best'
      }
    } else if (i <= BOOK_PLIES && loss <= 50) {
      key = 'book'
    } else if (loss <= 15) {
      key = 'excellent'
    } else if (loss <= 50) {
      key = 'good'
    } else if (loss <= 100) {
      key = 'inaccuracy'
    } else if (loss <= 250) {
      key = 'mistake'
    } else {
      key = beforeForMover > 150 ? 'miss' : 'blunder'
    }

    results[i] = { key, label: LABELS[key], symbol: SYMBOLS[key], lossCp: Math.round(loss) }
  }

  return results
}

export function qualityInfo(key) {
  return key ? { key, label: LABELS[key], symbol: SYMBOLS[key] } : null
}

/** { w: { brilliant: 2, best: 5, ... }, b: { ... } }, only counting classified plies. */
export function summarizeByColor(positions, classifications) {
  const summary = { w: {}, b: {} }
  for (const [ply, info] of Object.entries(classifications)) {
    const mover = positions[Number(ply) - 1].fen.split(' ')[1] === 'b' ? 'b' : 'w'
    summary[mover][info.key] = (summary[mover][info.key] || 0) + 1
  }
  return summary
}
