// Resolves an actual piece image (the same artwork shown on the board) for the
// palette and promotion picker, keyed by the active piece set.
//
// This deliberately reuses real SVG artwork rather than Unicode chess glyphs.
// Unicode's "hollow" white-piece glyphs render very inconsistently across fonts
// -- on many systems the hollow interior fills in anyway, making white and
// black pieces hard to tell apart or even look swapped. Real artwork with an
// explicit fill color has no such ambiguity.
const classicModules = import.meta.glob('../assets/classic-pieces/*.svg', { eager: true, import: 'default' })
const uzbekModules = import.meta.glob('../assets/uzbek-pieces/*.svg', { eager: true, import: 'default' })

function byFileName(modules) {
  const map = {}
  for (const [path, url] of Object.entries(modules)) {
    map[path.split('/').pop()] = url
  }
  return map
}

const SETS = {
  classic: byFileName(classicModules),
  uzbek: byFileName(uzbekModules),
}

/** color: 'white' | 'black', role: 'king' | 'queen' | 'rook' | 'bishop' | 'knight' | 'pawn'. */
export function getPieceIconUrl(pieceSet, color, role) {
  const set = SETS[pieceSet] || SETS.classic
  return set[`${color}-${role}.svg`]
}
