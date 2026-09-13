# The engine files in this folder

`stockfish-18-lite-single.js` + `stockfish-18-lite-single.wasm` are the **lite,
single-threaded** WebAssembly build of Stockfish 18, taken from the `bin/` folder
of the [`stockfish`](https://www.npmjs.com/package/stockfish) npm package
(the actively-maintained WASM build of Stockfish for JS, by nmrugg —
https://github.com/nmrugg/stockfish.js), GPL-3.0-or-later.

## Why this particular build

That npm package ships five flavors. This app uses the one its own README
recommends for "most people": **lite, single-threaded**.

| Flavor | Needs special HTTP headers? | Notes |
|---|---|---|
| full, multi-threaded | Yes (COOP/COEP, for `SharedArrayBuffer`) | Strongest, ~100MB+ |
| full, single-threaded | No | Strong, but a large download |
| **lite, single-threaded (used here)** | **No** | ~7MB, still far stronger than any human |
| lite, multi-threaded | Yes | |
| asm.js fallback | No | Last resort for very old browsers |

**GitHub Pages cannot set custom response headers**, so any "multi-threaded"
flavor (which needs `Cross-Origin-Opener-Policy` / `Cross-Origin-Embedder-Policy`
to unlock `SharedArrayBuffer`) won't run there without extra tricks. The
single-threaded builds need no special headers at all, so they just work on a
plain static host — at the cost of using only one CPU core.

## Upgrading to a stronger build

If you're hosting this somewhere that *can* set those headers (or you add a
[`coi-serviceworker`](https://github.com/gzuidhof/coi-serviceworker)-style shim to
fake cross-origin isolation on GitHub Pages), you can drop in the **full,
single-threaded** build for more strength at the same simplicity, or a
multi-threaded one for more speed:

```bash
npm install stockfish       # pulls in all five flavors under node_modules/stockfish/bin
cp node_modules/stockfish/bin/stockfish-18-single.js   public/engine/
cp node_modules/stockfish/bin/stockfish-18-single.wasm public/engine/
npm uninstall stockfish     # optional — the package is large and only needed to fetch these two files
```

Then update the filename in `src/hooks/useStockfish.js` (`ENGINE_URL`) to match,
and, for a multi-threaded build, set `Threads` higher via `setOptions()` in that
same file.

## License

Stockfish is GPL-3.0-or-later. If you distribute this app, the same terms that
already apply to Stockfish itself apply to the combined project — see
https://github.com/official-stockfish/Stockfish/blob/master/Copying.txt.

The `@lichess-org/chessground` board library (also GPL-3.0-or-later) is the
source of the piece artwork in `src/styles/chessground-pieces.css` — the
classic, widely-used "cburnett" set.
