# Chess Lab

A small, personal, static chess web app: edit any position (like a Lichess-style
board editor), then play it out against a real Stockfish engine running entirely
in your browser — plus game review with an evaluation graph, PGN import/export,
light/dark themes, and an original Central-Asian-inspired piece set. No backend,
no accounts, deployable to GitHub Pages for free.

- **Board & rules:** [Chessground](https://github.com/lichess-org/chessground) +
  [chess.js](https://github.com/jhlywa/chess.js)
- **Engine:** [Stockfish 18](https://stockfishchess.org/), compiled to
  WebAssembly, running in a Web Worker over the real UCI protocol
- **Framework:** React + Vite, plain CSS, no UI kit

## Running it locally

```bash
npm install
npm run dev
```

Then open the printed `localhost` URL. `npm run build` produces a production
build in `dist/`; `npm run preview` serves that build locally so you can sanity
check it before deploying.

## Deploying to GitHub Pages

This repo already includes a GitHub Actions workflow
(`.github/workflows/deploy.yml`) that builds and deploys automatically.

1. Push this project to a new GitHub repository.
2. In the repo, go to **Settings → Pages** and set **Source** to **GitHub
   Actions**.
3. Push to `main` (or run the workflow manually from the **Actions** tab). The
   workflow figures out the correct base path from your repository's name by
   itself — you don't need to edit anything.
4. After the workflow finishes, your site is live at
   `https://<your-username>.github.io/<repo-name>/` (or
   `https://<your-username>.github.io/` if the repo is literally named
   `<your-username>.github.io`).

No manual `gh-pages` branch or `npm run deploy` step needed — every push to
`main` redeploys automatically.

> **First deploy failing with "Failed to create deployment... Ensure GitHub
> Pages has been enabled"?** This happens if the workflow's first run started
> *before* you flipped Pages' source to "GitHub Actions" in step 2. It's a
> one-time hiccup — go to the **Actions** tab and re-run the failed workflow
> (or just push again); it'll succeed now that Pages is actually enabled.

## Features

- **Position editor** — drag pieces from the palette onto the board, or tap a
  piece then tap a square to place it without dragging; drag pieces off the
  board (or use the eraser) to remove them. Side to move, castling rights, and
  the en passant square are all editable, with castling rights automatically
  recalculated from where the kings and rooks actually are as you edit.
- **Play against Stockfish** — choose White, Black, or watch it play both
  sides; six named difficulty tiers plus a fully manual Custom mode; adjustable
  thinking time; standard or custom clocks, or no clock at all.
- **Game review** — after a game ends (or by pasting in any PGN), step through
  every move with a live evaluation graph, click any point on the graph or any
  move in the list to jump there.
- **PGN import/export** — copy a finished (or in-progress) game as PGN to share
  it elsewhere, or paste one in to review it.
- **Light and dark themes**, plus a choice of two piece sets: the standard
  Lichess/cburnett set, or an original "Uzbek Lab" set (see below).

## How the pieces fit together

```
src/
  lib/                   Framework-free logic: FEN handling, position validation,
                          castling-rights derivation, difficulty -> UCI-option
                          mapping, time control math, PGN build/parse, UCI line
                          parsing, and the raw Stockfish Worker client.
  hooks/                  useChessGame   - move history, undo/redo, game-over detection
                          useStockfish   - engine lifecycle, move requests, eval
                          useClock       - the two-sided chess clock
                          useGameReview  - game-review navigation + per-move evals
                          useLocalStorage
  components/             Presentational React components (the board itself,
                          piece palette, editor/player/difficulty/timer panels,
                          move list, eval bar/graph, clocks, promotion picker,
                          game-over modal, game review panel, PGN import, ...)
  App.jsx                 Wires the above together: owns the setup/playing/review
                          phases, and decides when it's the engine's turn to move.
  assets/uzbek-pieces/    Source SVGs for the "Uzbek Lab" piece set.
  styles/                 Chessground's structural CSS, both piece-set stylesheets,
                          and the custom board theme.
scripts/
  build-uzbek-pieces.mjs  Regenerates the Uzbek piece SVGs + their CSS. Edit the
                          shape functions in this script (or hand-edit the SVGs
                          in src/assets/uzbek-pieces/ directly), then run
                          `node scripts/build-uzbek-pieces.mjs`.
public/engine/            The Stockfish WASM binary - see the README.md in that
                          folder for exactly which build this is and how to swap it.
```

### The engine

Stockfish runs in a **Web Worker** (`public/engine/stockfish-18-lite-single.js`),
talking to the app purely over UCI text commands (`position fen ...`,
`go movetime ...`, `bestmove ...`) — see `src/lib/stockfishClient.js`. Nothing
about chess rules or move legality lives in the engine layer; chess.js is always
the source of truth for what's legal, what's checkmate, etc.

It's the **single-threaded** WASM build specifically because GitHub Pages can't
send the `Cross-Origin-Opener-Policy` / `Cross-Origin-Embedder-Policy` headers a
multi-threaded build needs — see `public/engine/README.md` for the full
reasoning and how to upgrade if you host this somewhere that can set those
headers.

### Difficulty levels

Stockfish's own strength-limiting options (`UCI_Elo`, `Skill Level`) don't go
below roughly **1320 Elo**, by design (see the
[Stockfish UCI docs](https://github.com/official-stockfish/Stockfish/wiki/UCI-&-Commands)).
For the two tiers below that (**Beginner**, **Easy**), this app additionally
caps the search to a very shallow depth and has a chance to substitute a
uniformly random legal move instead of Stockfish's own choice — see
`src/lib/difficulty.js`. This is a deliberate approximation, not a calibrated
rating, and the UI says so.

**Maximum** difficulty turns strength-limiting off entirely and just gives the
engine more time/depth — it is not artificially held back.

### Game review

Reviewing a game — reached from the game-over dialog's "Analyze game" button, or
by pasting a PGN in on the setup screen — loads every position in that game and
asks Stockfish for a quick (capped-depth, ~400ms) evaluation of each one in the
background, filling in the graph progressively as they come back. The graph
itself is styled like a territory map: White's share fills from the bottom,
Black's from the top, split by a smoothed line at the current evaluation, with a
dashed line marking equality. Clicking anywhere on the graph, or any move in the
list, jumps the board to that point. This reuses the same engine Worker as live
play; nothing extra to load.

Each move is also labeled — Brilliant, Great, Best, Excellent, Good, Book,
Inaccuracy, Mistake, Miss, or Blunder — based on how much evaluation it cost
compared to the position's best continuation, with a distinct symbol per
category (`!!`, `!`, `✓`, `?!`, `??`, ...) shown both in the move list and as a
small marker on the board square the move landed on, plus per-side totals above
the move list. This is an original, documented approximation
(`src/lib/moveClassification.js`) inspired by the kind of annotations
lichess/chess.com-style tools use, not a reproduction of any specific product's
algorithm — there's no real opening book behind "Book", for instance.

### Captured pieces and material balance

Above and below the board, each side's captured trophies are shown — the
opposing-color pieces that side has taken off the board — along with that
side's own signed point differential using the standard 1/3/3/5/9 point values
(`src/lib/material.js`). This is derived purely by comparing the current
position's piece counts to a full starting army, so it works identically for
live play, review, and any pasted PGN.

### The "Uzbek Lab" piece set

An original, minimalist piece set (not a reskin of an existing one) drawing on
Central Asian / Timurid visual motifs rather than the usual Staunton silhouette:
a domed king with a cross-and-star finial, a sharply-pointed crown for the
queen, a crenellated fortress tower for the rook, a horse-head knight, a bishop
with the classic mitre slit plus small tusk-curls — a nod to the historical
elephant (*alfil*) that occupied this square in the Persian/Central Asian chess
tradition — and a simple domed pawn. It's a first pass at a hard, subjective
design brief; the shape-generating code is in `scripts/build-uzbek-pieces.mjs`
if you'd like to push the style further — run `node scripts/build-uzbek-pieces.mjs`
after editing it (or the SVGs directly) to regenerate the actual piece files and
stylesheet.

### The position editor

Works like Lichess's board editor. Before a game starts, the position is
validated with chess.js (which already rejects most illegal setups —
missing/duplicate kings, pawns on the back rank, malformed FEN, ...); this app
adds one more check chess.js doesn't do itself, that the side *not* to move
isn't already in check.

## Known scope decisions

A few deliberate simplifications, in the interest of shipping something solid
rather than half-finishing more:

- **Settings and the last edited position** are saved to `localStorage`, but a
  game *in progress* is not resumed across a page reload — reloading mid-game
  returns you to the setup screen with your last settings intact, not to the
  live board.
- **Keyboard input for making moves isn't implemented.** All non-board controls
  are fully keyboard operable, but moving pieces on the board itself is
  drag/tap-based, as on most chess sites.
- Stockfish "resigning" isn't modeled — only the human player can resign.
- A flagged clock always loses, even in the (rare) case the opponent has no
  possible way to checkmate — most casual chess clocks work this way too.

## License

This project's own code has no license header attached — add one if you plan to
share it further. Its dependencies carry their own licenses: Stockfish and
Chessground are GPL-3.0-or-later; chess.js is BSD-2-Clause. See
`public/engine/README.md` for specifics on the bundled engine binary and the
classic piece artwork's origin.
