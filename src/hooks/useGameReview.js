import { useCallback, useState } from 'react'

/**
 * Owns "look back through a finished game" state, independent of the live
 * useChessGame hook — reviewing never mutates a game in progress, it just walks
 * through an immutable list of positions (from a game just played, or a pasted
 * PGN) and collects an engine evaluation for each one as they come in.
 */
export function useGameReview() {
  const [positions, setPositions] = useState(null) // [{ fen, san, from, to }] | null
  const [index, setIndex] = useState(0)
  const [evals, setEvals] = useState({}) // ply index -> { cp } | { mate }
  const [headers, setHeaders] = useState(null)

  const load = useCallback((positionsArray, loadedHeaders = null) => {
    setPositions(positionsArray)
    setIndex(positionsArray.length - 1)
    setEvals({})
    setHeaders(loadedHeaders)
  }, [])

  const clear = useCallback(() => {
    setPositions(null)
    setIndex(0)
    setEvals({})
    setHeaders(null)
  }, [])

  const goTo = useCallback(
    (i) => setIndex(Math.max(0, Math.min(i, (positions?.length ?? 1) - 1))),
    [positions],
  )

  const recordEval = useCallback((i, ev) => {
    setEvals((prev) => (ev ? { ...prev, [i]: ev } : prev))
  }, [])

  return {
    active: !!positions,
    positions,
    index,
    evals,
    headers,
    load,
    clear,
    goTo,
    next: () => goTo(index + 1),
    prev: () => goTo(index - 1),
    recordEval,
  }
}
