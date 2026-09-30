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
- **Two players, one device** — a local pass-and-play mode with no engine
  involved at all. The board stays put; the pieces turn 180° to face whoever
  is about to move.
- **Game review** — after a game ends (or by pasting in any PGN), step through
  every move with a live evaluation graph, click any point on the graph or any
  move in the list to jump there.
- **PGN import/export** — copy a finished (or in-progress) game as PGN to share
  it elsewhere, or paste one in to review it.
- **Light and dark themes**, plus a choice of three piece sets: the standard
  Lichess/cburnett set, "New Figures" (an original redrawn set), or "Uzbek
  Lab" (classic shapes woven from adras/atlas silk patterns) — see below.
- **Built mobile-first, not as an afterthought** — see the dedicated section
  below.

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
  assets/newfigures-pieces/  Source SVGs for the "New Figures" piece set.
  assets/uzbek-pieces/    Source SVGs for the "Uzbek Lab" (adras/atlas) piece set.
  styles/                 Chessground's structural CSS, both piece-set stylesheets,
                          and the custom board theme.
scripts/
  build-newfigures-pieces.mjs  Regenerates the New Figures SVGs + CSS.
  build-uzbek-pieces.mjs  Regenerates the Uzbek Lab SVGs + CSS from the classic
                          shapes. Edit the fabric patterns in the script, then
                          run `node scripts/build-uzbek-pieces.mjs`.
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

### Two players, one device

Picking "2 Players" under Player turns off the engine entirely — both sides
are human, taking turns on the same screen. The intended setup is the device
lying flat between two people, so the board never turns: White stays at the
bottom, Black at the top. Instead, every piece makes a half-turn in place —
upright for White on White's move, rotated 180° on Black's move so Black sees
them the right way up (this follows every move, undo, and redo; the promotion
picker turns too). "Flip board" is still there if you want it.
Clocks, captured pieces, undo/redo, and PGN export all work exactly the same
as playing against the engine — the only thing that's off is Difficulty, which
the setup screen hides for this mode since there's no engine for it to apply
to.

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

### Piece sets

- **Classic** — the standard Lichess/cburnett pieces.
- **New Figures** — an original, minimalist redraw (domed king with a star
  finial, pointed-crown queen, crenellated tower rook, horse-head knight, a
  bishop with tusk-curls nodding to the historical *alfil*). Generated by
  `scripts/build-newfigures-pieces.mjs`.
- **Uzbek Lab** — the same familiar piece shapes as Classic, but each side is
  "woven" from a traditional Uzbek silk pattern: White in warm *adras*
  (red, orange, gold and cream stripes with feathered *abrabandi* edges and
  green *bodom* almond motifs), Black in cool *atlas* (indigo, emerald and
  turquoise stripes with rose bodom and diamond accents). Warm-light versus
  cool-dark keeps the two sides easy to tell apart. Generated by
  `scripts/build-uzbek-pieces.mjs` — tweak the pattern tile there to change the
  fabric.

### Mobile

The layout, not just the board, is designed for a phone browser:

- The setup and review panels stop being `position: sticky` once they're
  stacked below the board (sticky made sense beside a fixed board; it just
  yanks content around once the panel is a normal part of the scroll).
- The primary action of a long panel (Start game / Back to setup) pins to the
  bottom of the screen so it's reachable without hunting for it after
  scrolling through settings.
- Every control was re-checked against a thumb rather than a mouse pointer:
  buttons, checkboxes, slider thumbs, and modal close buttons are all sized up
  on touch-width screens, and text inputs are kept at 16px there specifically
  — under that, iOS Safari zooms the whole page in when you focus a field.
- Tap targets get `touch-action: manipulation` and no tap-highlight flash, and
  the page can't accidentally pull-to-refresh mid-game.
- Dragging a piece — from the board or from the palette — can't also scroll
  the page out from under your finger. Chessground already handles this
  correctly for the board itself (it registers its touch listener as
  non-passive specifically to block scroll during a drag); the palette's own
  drag-vs-tap detection in `PiecePalette.jsx` does the same for the brief
  window before a drag is confirmed.
- A short, wide viewport (a phone in landscape) caps the board's size to the
  available height instead of letting a full-width board push the controls
  off-screen.

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
