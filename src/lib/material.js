// Captured-piece tracking: derived entirely from the current placement (how
// many of each piece type are missing compared to a full starting army), not
// from replaying capture events -- so it works identically for live play,
// review, and a pasted PGN's arbitrary starting position.

const STARTING_COUNTS = { p: 8, n: 2, b: 2, r: 2, q: 1 }
const PIECE_VALUES = { p: 1, n: 3, b: 3, r: 5, q: 9 }
const VALUE_ORDER = ['p', 'n', 'b', 'r', 'q']

export const ROLE_NAME = { p: 'pawn', n: 'knight', b: 'bishop', r: 'rook', q: 'queen' }

function countsFromPlacement(placement) {
  const counts = { w: { p: 0, n: 0, b: 0, r: 0, q: 0 }, b: { p: 0, n: 0, b: 0, r: 0, q: 0 } }
  for (const ch of placement) {
    const lower = ch.toLowerCase()
    if (lower === 'k' || !(lower in counts.w)) continue
    const color = ch === lower ? 'b' : 'w'
    counts[color][lower]++
  }
  return counts
}

const formatSigned = (value) => (value > 0 ? `+${value}` : value < 0 ? `${value}` : '')

/**
 * capturedByWhite: black pieces missing from the board (i.e. White took them),
 * shown as trophies next to White. capturedByBlack is the mirror image.
 * whiteLabel/blackLabel are each side's own signed point differential, e.g.
 * "+1" for White and "-1" for Black when White is a pawn-for-nothing up... or
 * more precisely, whatever the net point swing actually is.
 */
export function materialSummary(placement) {
  const counts = countsFromPlacement(placement)
  const capturedByWhite = []
  const capturedByBlack = []
  let whiteValue = 0
  let blackValue = 0

  for (const role of VALUE_ORDER) {
    const takenFromBlack = STARTING_COUNTS[role] - counts.b[role]
    const takenFromWhite = STARTING_COUNTS[role] - counts.w[role]
    if (takenFromBlack > 0) {
      capturedByWhite.push({ role, count: takenFromBlack })
      whiteValue += takenFromBlack * PIECE_VALUES[role]
    }
    if (takenFromWhite > 0) {
      capturedByBlack.push({ role, count: takenFromWhite })
      blackValue += takenFromWhite * PIECE_VALUES[role]
    }
  }

  const net = whiteValue - blackValue
  return {
    capturedByWhite,
    capturedByBlack,
    whiteLabel: formatSigned(net),
    blackLabel: formatSigned(-net),
  }
}
