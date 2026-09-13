import { parseBestmoveLine, parseInfoLine } from './uci.js'

const HANDSHAKE_TIMEOUT_MS = 20000

/**
 * A small promise-based wrapper around the Stockfish Web Worker.
 *
 * This talks to the engine purely over the UCI text protocol — every command sent
 * with postMessage() is a line of UCI, every message received is a line (or
 * several newline-joined lines) of UCI output. Nothing here is chess-aware; move
 * legality and game state live in chess.js instead (see hooks/useChessGame.js).
 *
 * search() results are delivered in a FIFO queue rather than a single "current
 * request" slot. That matters because stopping a search doesn't happen instantly:
 * after we send `stop`, Stockfish still finishes and reports one `bestmove` line
 * for the search we just cancelled *before* it starts on the next one we already
 * queued. A queue lets us match every `bestmove` line to the request that
 * produced it, in order, and quietly discard the ones we no longer want.
 */
export class StockfishClient {
  constructor(scriptUrl) {
    this.scriptUrl = scriptUrl
    this.worker = null
    this.queue = [] // FIFO of { onInfo, resolve, discarded }
    this.handshake = null // single-slot resolver used only during setup
    this.onError = null // (message: string) => void, set by the caller
  }

  /**
   * Start the worker and wait for it to complete the `uci` / `isready` handshake.
   *
   * Each step below arms the line-listener with _awaitLine() *before* sending the
   * command that triggers the reply. That ordering matters: it guarantees the
   * listener exists before the (possibly very fast) response can arrive, instead
   * of racing a postMessage against a .then() callback.
   */
  init() {
    return new Promise((resolve, reject) => {
      let settled = false
      const finish = (err) => {
        if (settled) return
        settled = true
        clearTimeout(timer)
        if (err) reject(err)
        else resolve()
      }

      try {
        this.worker = new Worker(this.scriptUrl)
      } catch (err) {
        reject(err)
        return
      }

      const timer = setTimeout(
        () => finish(new Error('Timed out waiting for the chess engine to start.')),
        HANDSHAKE_TIMEOUT_MS,
      )

      this.worker.onerror = () => {
        if (!settled) finish(new Error('The chess engine failed to load in this browser.'))
        else if (this.onError) this.onError('The chess engine reported an unexpected error.')
      }

      this.worker.onmessage = (event) => this._onMessage(event.data)

      const uciAcked = this._awaitLine((line) => line === 'uciok')
      this.worker.postMessage('uci')

      uciAcked
        .then(() => {
          const isReady = this._awaitLine((line) => line === 'readyok')
          this.worker.postMessage('isready')
          return isReady
        })
        .then(() => finish())
        .catch((err) => finish(err))
    })
  }

  /** Apply UCI setoption commands, e.g. { UCI_Elo: 1500, 'Skill Level': 10 }. */
  setOptions(options) {
    for (const [name, value] of Object.entries(options)) {
      if (value === undefined || value === null) continue
      this.worker.postMessage(`setoption name ${name} value ${value}`)
    }
  }

  /** Tell the engine a new game is starting (clears history heuristics/hash). */
  newGame() {
    this.stop()
    this.worker.postMessage('ucinewgame')
    const isReady = this._awaitLine((line) => line === 'readyok')
    this.worker.postMessage('isready')
    return isReady
  }

  /**
   * Search a position and resolve with { bestmove, ponder } once the engine
   * replies. `onInfo(info)` is called for each parsed `info` line while this
   * search is the most recent one requested (superseded searches' info lines are
   * ignored). `limits` is `{ movetime?, depth? }`; at least one should be set.
   */
  search(fen, limits, onInfo) {
    // Supersede whatever was queued/running: its eventual bestmove will still
    // arrive (UCI replies are strictly in order) but we mark it to be ignored.
    this.queue.forEach((entry) => {
      entry.discarded = true
    })
    if (this.queue.length) this.worker.postMessage('stop')

    return new Promise((resolve) => {
      this.queue.push({ onInfo, resolve, discarded: false })
      this.worker.postMessage(`position fen ${fen}`)
      const parts = ['go']
      if (typeof limits.depth === 'number') parts.push('depth', String(limits.depth))
      if (typeof limits.movetime === 'number') parts.push('movetime', String(Math.round(limits.movetime)))
      this.worker.postMessage(parts.join(' '))
    })
  }

  /** Cancel whatever search is queued/running. Safe to call when nothing is running. */
  stop() {
    if (this.queue.length) {
      this.queue.forEach((entry) => {
        entry.discarded = true
      })
      this.worker.postMessage('stop')
    }
  }

  terminate() {
    this.worker?.terminate()
    this.worker = null
    this.queue = []
  }

  // --- internals -----------------------------------------------------------

  _onMessage(raw) {
    String(raw)
      .split('\n')
      .forEach((line) => this._dispatch(line))
  }

  _dispatch(line) {
    if (!line) return

    if (this.handshake && this.handshake.test(line)) {
      const { resolve } = this.handshake
      this.handshake = null
      resolve()
      return
    }

    if (line.startsWith('info')) {
      const top = this.queue[0]
      if (top && !top.discarded && top.onInfo) {
        const info = parseInfoLine(line)
        if (info) top.onInfo(info)
      }
      return
    }

    if (line.startsWith('bestmove')) {
      const entry = this.queue.shift()
      if (!entry || entry.discarded) return
      entry.resolve(parseBestmoveLine(line))
    }
  }

  _awaitLine(test) {
    return new Promise((resolve) => {
      this.handshake = { test, resolve }
    })
  }
}
