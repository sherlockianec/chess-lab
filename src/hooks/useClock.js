import { useCallback, useEffect, useRef, useState } from 'react'

/**
 * A two-sided chess clock. Ticks against Date.now() deltas rather than assuming
 * each interval tick is exactly 100ms, so it stays accurate even if the tab is
 * throttled in the background for a moment.
 *
 * The caller drives it explicitly: startTurn(color) when a side's clock should
 * start counting down, onMoveMade(color) right after that side completes a move
 * (adds increment, hands the clock to the other side), and stop()/reset() around
 * game start/end. `enabled` fully disables ticking for "no timer" games.
 */
export function useClock({ startMs, incrementMs, enabled }) {
  const [remaining, setRemaining] = useState({ w: startMs, b: startMs })
  const [activeColor, setActiveColor] = useState(null)
  const [flagged, setFlagged] = useState(null)
  const lastTickRef = useRef(null)

  useEffect(() => {
    setRemaining({ w: startMs, b: startMs })
    setActiveColor(null)
    setFlagged(null)
  }, [startMs, incrementMs, enabled])

  useEffect(() => {
    if (!enabled || !activeColor || flagged) return undefined
    lastTickRef.current = Date.now()
    const id = setInterval(() => {
      const now = Date.now()
      const elapsed = now - lastTickRef.current
      lastTickRef.current = now
      setRemaining((prev) => {
        const left = Math.max(0, prev[activeColor] - elapsed)
        if (left <= 0) setFlagged(activeColor)
        return { ...prev, [activeColor]: left }
      })
    }, 100)
    return () => clearInterval(id)
  }, [enabled, activeColor, flagged])

  const startTurn = useCallback((color) => setActiveColor(color), [])
  const stop = useCallback(() => setActiveColor(null), [])

  const onMoveMade = useCallback(
    (mover) => {
      setRemaining((prev) => ({ ...prev, [mover]: prev[mover] + (incrementMs || 0) }))
      setActiveColor(mover === 'w' ? 'b' : 'w')
    },
    [incrementMs],
  )

  const reset = useCallback(() => {
    setRemaining({ w: startMs, b: startMs })
    setActiveColor(null)
    setFlagged(null)
  }, [startMs])

  return { remaining, activeColor, flagged, startTurn, stop, onMoveMade, reset }
}
