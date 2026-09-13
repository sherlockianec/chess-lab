import { forwardRef, useEffect, useImperativeHandle, useRef } from 'react'
import { Chessground } from '@lichess-org/chessground'

/**
 * Thin React wrapper around Chessground (a vanilla-JS library, not a React
 * component). It owns the Chessground instance for its whole lifetime and keeps
 * it in sync with props via `.set()` — Chessground does its own diffing/animation
 * internally, so this just forwards whatever changed.
 *
 * Imperative methods (dragNewPiece, setPieces, forceSync, getFen) are exposed via
 * a ref for the few things that genuinely need to reach into the live instance:
 * the piece palette starting a drag, and the editor/promotion flows correcting the
 * board after a change React's prop diff wouldn't otherwise catch.
 */
const Board = forwardRef(function Board(
  {
    fen,
    orientation = 'white',
    turnColor = 'white',
    check = false,
    lastMove,
    viewOnly = false,
    free = false,
    movableColor,
    dests,
    showDests = true,
    deleteOnDropOff = false,
    onMove,
    onSelect,
    onChange,
  },
  ref,
) {
  const hostRef = useRef(null)
  const cgRef = useRef(null)

  // Mount once. Callbacks are read from refs inside so this effect never needs to
  // re-run just because a parent re-created a handler function.
  const callbacksRef = useRef({})
  callbacksRef.current = { onMove, onSelect, onChange }

  useEffect(() => {
    if (!hostRef.current) return undefined
    const cg = Chessground(hostRef.current, {
      fen,
      orientation,
      turnColor,
      check,
      lastMove,
      viewOnly,
      animation: { enabled: true, duration: 180 },
      highlight: { lastMove: true, check: true },
      movable: {
        free,
        color: viewOnly ? undefined : movableColor,
        dests,
        showDests,
        events: {
          after: (orig, dest) => callbacksRef.current.onMove?.(orig, dest),
        },
      },
      draggable: { enabled: !viewOnly, showGhost: true, deleteOnDropOff },
      events: {
        select: (key) => callbacksRef.current.onSelect?.(key),
        change: () => callbacksRef.current.onChange?.(cg.getFen()),
      },
    })
    cgRef.current = cg
    return () => cg.destroy()
    // Intentionally mount-only: every prop that can change afterwards is applied
    // through the sync effect below via cg.set(), matching how Chessground itself
    // is meant to be driven.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Keep the live instance in sync with whatever React thinks the position/config
  // should be. Chessground compares against its own internal state, so passing
  // the same fen twice in a row is a harmless no-op.
  useEffect(() => {
    cgRef.current?.set({
      fen,
      orientation,
      turnColor,
      check,
      lastMove,
      viewOnly,
      movable: {
        free,
        color: viewOnly ? undefined : movableColor,
        dests,
        showDests,
      },
      draggable: { enabled: !viewOnly, deleteOnDropOff },
    })
  }, [fen, orientation, turnColor, check, lastMove, viewOnly, free, movableColor, dests, showDests, deleteOnDropOff])

  useImperativeHandle(ref, () => ({
    dragNewPiece(piece, event, force) {
      cgRef.current?.dragNewPiece(piece, event, force)
    },
    setPieces(piecesMap) {
      cgRef.current?.setPieces(piecesMap)
    },
    getFen() {
      return cgRef.current?.getFen()
    },
    /** Force a full re-sync even when the `fen` prop hasn't changed (e.g. a cancelled promotion). */
    forceSync(nextFen) {
      cgRef.current?.set({ fen: nextFen ?? fen })
    },
  }))

  return <div className="board-host" ref={hostRef} />
})

export default Board
