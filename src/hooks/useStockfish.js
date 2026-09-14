import { useCallback, useEffect, useRef, useState } from 'react'
import { StockfishClient } from '../lib/stockfishClient.js'
import { resolveEngineSettings } from '../lib/difficulty.js'
import { scoreToWhitePerspective, uciMoveToObject } from '../lib/uci.js'

// Served straight from public/engine — see public/engine/README.md for exactly
// which upstream build this is and how to swap in a different flavor.
const ENGINE_URL = `${import.meta.env.BASE_URL}engine/stockfish-18-lite-single.js`

/**
 * Owns the Stockfish Web Worker for the lifetime of the component that calls this
 * hook: starts it once, exposes load status/errors, and provides difficulty-aware
 * move requests plus a lightweight analysis mode for the evaluation bar.
 */
export function useStockfish() {
  const clientRef = useRef(null)
  const [status, setStatus] = useState('loading') // 'loading' | 'ready' | 'error'
  const [errorMessage, setErrorMessage] = useState(null)
  const [thinking, setThinking] = useState(false)
  const [evaluation, setEvaluation] = useState(null) // { cp } | { mate } | null — White's perspective

  useEffect(() => {
    let cancelled = false
    const client = new StockfishClient(ENGINE_URL)
    clientRef.current = client
    client.onError = (message) => {
      if (!cancelled) setErrorMessage(message)
    }

    client
      .init()
      .then(() => {
        if (!cancelled) setStatus('ready')
      })
      .catch((err) => {
        if (!cancelled) {
          setStatus('error')
          setErrorMessage(err?.message || 'The chess engine failed to load in this browser.')
        }
      })

    return () => {
      cancelled = true
      client.terminate()
    }
  }, [])

  const stop = useCallback(() => {
    clientRef.current?.stop()
    setThinking(false)
  }, [])

  const newGame = useCallback(() => {
    setEvaluation(null)
    return clientRef.current?.newGame()
  }, [])

  /**
   * Ask the engine to choose a move for `fen` under the given difficulty settings.
   * Resolves with a chess.js-shaped { from, to, promotion } object, or null if the
   * engine reported no legal move (callers should already have checked
   * game-over before requesting one).
   *
   * For the Beginner/Easy tiers (see lib/difficulty.js), there's a chance the
   * engine's own suggestion is swapped for a uniformly random legal move —
   * Stockfish itself won't play weaker than ~1320 Elo, so this is how those two
   * tiers reach further down.
   */
  const requestMove = useCallback(async (fen, turn, { tierId, movetimeMs, custom, legalMoves }) => {
    const client = clientRef.current
    if (!client) return null

    const { uciOptions, go, randomMoveChance } = resolveEngineSettings(tierId, movetimeMs, custom)
    client.setOptions(uciOptions)

    setThinking(true)
    try {
      const { bestmove } = await client.search(fen, go, (info) => {
        setEvaluation(scoreToWhitePerspective(info, turn))
      })
      if (!bestmove) return null

      if (randomMoveChance > 0 && legalMoves?.length && Math.random() < randomMoveChance) {
        const pick = legalMoves[Math.floor(Math.random() * legalMoves.length)]
        return { from: pick.from, to: pick.to, promotion: pick.promotion }
      }

      return uciMoveToObject(bestmove)
    } finally {
      setThinking(false)
    }
  }, [])

  /**
   * Kick off a short, capped-depth search purely to update the evaluation bar
   * while it's the human's turn. Its result is never played — requestMove()
   * silently supersedes it the moment the engine actually needs to move.
   */
  const analyze = useCallback((fen, turn, movetimeMs = 600) => {
    clientRef.current?.search(fen, { movetime: movetimeMs, depth: 16 }, (info) => {
      setEvaluation(scoreToWhitePerspective(info, turn))
    })
  }, [])

  const clearEvaluation = useCallback(() => setEvaluation(null), [])

  /**
   * Analyze one position and resolve with its final { cp } | { mate } | null once
   * the search completes — used by game review to walk through a whole game's
   * worth of positions one at a time. Deliberately doesn't touch `evaluation`/
   * `thinking` (that state describes the *live* game, not a review session), so
   * this can safely run while nothing else is using the engine.
   */
  const evaluatePosition = useCallback((fen, turn, movetimeMs = 400) => {
    const client = clientRef.current
    if (!client) return Promise.resolve(null)
    let lastEval = null
    return client
      .search(fen, { movetime: movetimeMs, depth: 16 }, (info) => {
        const ev = scoreToWhitePerspective(info, turn)
        if (ev) lastEval = ev
      })
      .then(() => lastEval)
  }, [])

  return {
    status,
    errorMessage,
    thinking,
    evaluation,
    requestMove,
    analyze,
    evaluatePosition,
    clearEvaluation,
    stop,
    newGame,
  }
}
