/**
 * Top-left corner of `square` as a percentage of the board, accounting for
 * orientation. Each square is 12.5% (100/8) of the board's width/height, so
 * this stays correct at any rendered size.
 */
export function squareToPercent(square, orientation) {
  const file = square.charCodeAt(0) - 97 // 'a' -> 0
  const rank = Number(square[1]) - 1 // '1' -> 0
  const col = orientation === 'black' ? 7 - file : file
  const row = orientation === 'black' ? rank : 7 - rank
  return { left: (col / 8) * 100, top: (row / 8) * 100 }
}
