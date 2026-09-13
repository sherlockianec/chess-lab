import { useCallback, useMemo, useState } from 'react'
import { Chess } from 'chess.js'

/**
 * Owns the state of a game in progress: the position history (for undo/redo and
 * the move list), whose turn it is, and game-over detection.
 *
 * A fresh Chess instance is derived from the *current* FEN rather than mutated
 * move-by-move, so undo/redo can never leave chess.js's internal state out of
 * sync with what's on screen — "the position at step N" is always just "load this
 * FEN", nothing more stateful than that.
 *
 * Undo removes one *group* of plies at a time (see undo() below) and pushes that
 * whole group onto a redo stack, so redo() always restores exactly what the most
 * recent undo took back — even when undo and redo are called with different ply
 * counts (used by App.jsx to take back a full human+engine exchange in one step).
 */
export function useChessGame(initialFen) {
  const [past, setPast] = useState(() => [{ fen: initialFen, san: null, from: null, to: null }])
  const [redoStack, setRedoStack] = useState([]) // array of groups; redoStack[0] is next to redo

  const current = past[past.length - 1]

  const chess = useMemo(() => {
    try {
      return new Chess(current.fen)
    } catch {
      return new Chess()
    }
  }, [current.fen])

  const status = useMemo(() => {
    if (chess.isCheckmate()) {
      return { over: true, reason: 'checkmate', winner: chess.turn() === 'w' ? 'b' : 'w' }
    }
    if (chess.isStalemate()) return { over: true, reason: 'stalemate', winner: null }
    if (chess.isInsufficientMaterial()) return { over: true, reason: 'insufficient-material', winner: null }
    if (chess.isThreefoldRepetition()) return { over: true, reason: 'repetition', winner: null }
    if (chess.isDrawByFiftyMoves()) return { over: true, reason: 'fifty-move', winner: null }
    return { over: false, reason: null, winner: null }
  }, [chess])

  const resetTo = useCallback((fen) => {
    setPast([{ fen, san: null, from: null, to: null }])
    setRedoStack([])
  }, [])

  /** Plays a move ({ from, to, promotion } or SAN). Returns the chess.js Move on success, null if illegal. */
  const makeMove = useCallback((move) => {
    let result = null
    setPast((prev) => {
      const next = new Chess(prev[prev.length - 1].fen)
      try {
        result = next.move(move)
      } catch {
        result = null
      }
      return result ? [...prev, { fen: next.fen(), san: result.san, from: result.from, to: result.to }] : prev
    })
    if (result) setRedoStack([])
    return result
  }, [])

  const undo = useCallback((plies = 1) => {
    setPast((prev) => {
      if (prev.length <= 1) return prev
      const count = Math.min(plies, prev.length - 1)
      const group = prev.slice(prev.length - count) // oldest-first within the group
      setRedoStack((stack) => [group, ...stack])
      return prev.slice(0, prev.length - count)
    })
  }, [])

  const redo = useCallback(() => {
    setRedoStack((stack) => {
      if (!stack.length) return stack
      const [group, ...rest] = stack
      setPast((prev) => [...prev, ...group])
      return rest
    })
  }, [])

  const history = useMemo(() => past.slice(1).map((p) => p.san), [past])

  return {
    fen: current.fen,
    startFen: past[0].fen,
    chess,
    turn: chess.turn(),
    status,
    history,
    lastMove: current.from && current.to ? { from: current.from, to: current.to } : null,
    canUndo: past.length > 1,
    canRedo: redoStack.length > 0,
    plyCount: past.length - 1,
    makeMove,
    undo,
    redo,
    resetTo,
  }
}
