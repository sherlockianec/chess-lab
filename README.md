# Chess Lab

A small, personal, static chess web app: edit any position (like a Lichess-style
board editor), then play it out against a real Stockfish engine running entirely
in your browser. No backend, no accounts, no build-time secrets — it's just static
files, deployable to GitHub Pages for free.

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

## How the pieces fit together

```
src/
  lib/                   Framework-free logic: FEN handling, position validation,
                          difficulty -> UCI-option mapping, time control math,
                          UCI line parsing, and the raw Stockfish Worker client.
  hooks/                  useChessGame   - move history, undo/redo, game-over detection
                          useStockfish   - engine lifecycle, move requests, eval
                          useClock       - the two-sided chess clock
                          useLocalStorage
  components/             Presentational React components (the board itself,
                          piece palette, editor/player/difficulty/timer panels,
                          move list, eval bar, clocks, promotion picker, ...)
  App.jsx                 Wires the above together: owns the setup/playing phase,
                          and decides when it's the engine's turn to move.
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

### The position editor

Works like Lichess's board editor: drag pieces from the palette onto the board,
drag existing pieces around or off the board to remove them, or use the eraser
tool. Side to move, castling rights, and the en passant square are edited
directly, and the whole thing round-trips through a plain FEN string you can
copy or paste. Before a game starts, the position is validated with chess.js
(which already rejects most illegal setups — missing/duplicate kings, pawns on
the back rank, malformed FEN, ...); this app adds one more check chess.js
doesn't do itself, that the side *not* to move isn't already in check.

## Known scope decisions

A few deliberate simplifications, in the interest of shipping something solid
rather than half-finishing more:

- **Settings and the last edited position** are saved to `localStorage`, but a
  game *in progress* is not resumed across a page reload — reloading mid-game
  returns you to the setup screen with your last settings intact, not to the
  live board. Resuming a live game safely (including engine and clock state)
  is a meaningfully bigger feature than persisting settings.
- **Keyboard input for making moves isn't implemented.** All non-board controls
  (every button, slider, checkbox, and the FEN field) are fully keyboard
  operable, but moving pieces on the board itself is drag/tap-based, as it is on
  most chess sites.
- Stockfish "resigning" isn't modeled — only the human player can resign.
- A flagged clock always loses, even in the (rare) case the opponent has no
  possible way to checkmate — most casual chess clocks work this way too.

## License

This project's own code has no license header attached — add one if you plan to
share it further. Its dependencies carry their own licenses: Stockfish and
Chessground are GPL-3.0-or-later; chess.js is BSD-2-Clause. See
`public/engine/README.md` for specifics on the bundled engine binary and piece
artwork.
