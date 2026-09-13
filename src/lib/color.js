// chess.js uses single-letter color codes ('w' | 'b'); Chessground uses full
// words ('white' | 'black'). Small helpers to convert between the two so the
// rest of the app can pick whichever is more natural at each call site.

export const toFullColor = (letter) => (letter === 'b' ? 'black' : 'white')
export const toLetterColor = (full) => (full === 'black' ? 'b' : 'w')
export const opponentOf = (letter) => (letter === 'w' ? 'b' : 'w')
