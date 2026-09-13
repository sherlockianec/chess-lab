import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import Board from './components/Board.jsx'
import PromotionPicker from './components/PromotionPicker.jsx'
import PositionEditor from './components/PositionEditor.jsx'
import PlayerPanel from './components/PlayerPanel.jsx'
import DifficultyPanel from './components/DifficultyPanel.jsx'
import TimerPanel from './components/TimerPanel.jsx'
import GameControls from './components/GameControls.jsx'
import GameStatusBanner from './components/GameStatusBanner.jsx'
import MoveHistory from './components/MoveHistory.jsx'
import EvalBar from './components/EvalBar.jsx'
import ClockDisplay from './components/ClockDisplay.jsx'
import { useChessGame } from './hooks/useChessGame.js'
import { useStockfish } from './hooks/useStockfish.js'
import { useClock } from './hooks/useClock.js'
import { useLocalStorage } from './hooks/useLocalStorage.js'
import { START_FEN, buildFen, parseFen } from './lib/fen.js'
import { validatePosition } from './lib/positionValidation.js'
import { resolveTimeControl } from './lib/timeControl.js'
import { getTier } from './lib/difficulty.js'
import { opponentOf, toFullColor } from './lib/color.js'
import './App.css'

const DEFAULT_SETTINGS = {
  editorFen: START_FEN,
  orientation: 'white',
  playerColor: 'white', // 'white' | 'black' | 'watch'
  engineMovesFirst: false,
  difficultyTierId: 'medium',
  movetimeMs: getTier('medium').defaultMovetimeMs,
  customDifficulty: { limitStrength: true, elo: 1500, skillLevel: 10, useDepth: false, movetimeMs: 1000, depth: 15 },
  timeControl: { mode: 'none', presetId: 'blitz5', minutes: 10, incrementSec: 0 },
  showDests: true,
  showEval: true,
  showHistory: true,
}

function describeResult(result) {
  if (!result.over) return null
  const winnerName = result.winner === 'w' ? 'White' : result.winner === 'b' ? 'Black' : null
  switch (result.reason) {
    case 'checkmate':
      return `Checkmate — ${winnerName} wins.`
    case 'stalemate':
      return 'Stalemate — draw.'
    case 'insufficient-material':
      return 'Draw — insufficient material to checkmate.'
    case 'repetition':
      return 'Draw — threefold repetition.'
    case 'fifty-move':
      return 'Draw — fifty-move rule.'
    case 'resignation':
      return `${winnerName === 'White' ? 'Black' : 'White'} resigned — ${winnerName} wins.`
    case 'timeout':
      return `Time forfeit — ${winnerName} wins.`
    default:
      return 'Game over.'
  }
}

export default function App() {
  const [settings, setSettings] = useLocalStorage('chess-lab:settings:v1', DEFAULT_SETTINGS)
  const [phase, setPhase] = useState('setup') // 'setup' | 'playing'
  const [initialEditorFen, setInitialEditorFen] = useState(settings.editorFen)
  const [validationError, setValidationError] = useState(null)
  const [eraserActive, setEraserActive] = useState(false)
  const [pendingPromotion, setPendingPromotion] = useState(null) // { from, to, color }
  const [resignedBy, setResignedBy] = useState(null) // 'w' | 'b' | null
  const [gameSessionId, setGameSessionId] = useState(0)

  const boardRef = useRef(null)
  const engine = useStockfish()
  const game = useChessGame(settings.editorFen)

  const humanColorLetter = settings.playerColor === 'white' ? 'w' : settings.playerColor === 'black' ? 'b' : null

  const resolvedTimeControl = useMemo(() => resolveTimeControl(settings.timeControl), [settings.timeControl])
  const clock = useClock({
    startMs: resolvedTimeControl?.startMs ?? 0,
    incrementMs: resolvedTimeControl?.incrementMs ?? 0,
    enabled: phase === 'playing' && !!resolvedTimeControl,
  })

  const result = useMemo(() => {
    if (resignedBy) return { over: true, reason: 'resignation', winner: opponentOf(resignedBy) }
    if (clock.flagged) return { over: true, reason: 'timeout', winner: opponentOf(clock.flagged) }
    return game.status
  }, [resignedBy, clock.flagged, game.status])

  // Start the clock for whoever is to move exactly once per new game. gameSessionId
  // (bumped by Start/Restart) is the real trigger; game.turn is read fresh here
  // rather than listed as a dependency, since we only ever want this on session change.
  useEffect(() => {
    if (phase === 'playing' && resolvedTimeControl) clock.startTurn(game.turn)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gameSessionId, phase])

  // The moment the game ends (checkmate, draw, resignation, or flag), stop the
  // clock and cancel any engine search still running.
  useEffect(() => {
    if (result.over) {
      clock.stop()
      engine.stop()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [result.over])

  const applyMove = useCallback(
    (move, moverLetter) => {
      const played = game.makeMove(move)
      if (played && resolvedTimeControl) clock.onMoveMade(moverLetter)
      return played
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [game, resolvedTimeControl],
  )

  // Drive the engine: whenever it's the engine's move, ask for one; whenever it's
  // the human's move and the eval toggle is on, run a background analysis instead.
  useEffect(() => {
    if (phase !== 'playing' || result.over || pendingPromotion || engine.status !== 'ready') return undefined

    const isFirstMoveOverride =
      game.plyCount === 0 &&
      settings.engineMovesFirst &&
      settings.playerColor !== 'watch' &&
      game.turn === humanColorLetter
    const isEngineTurn = settings.playerColor === 'watch' || game.turn !== humanColorLetter || isFirstMoveOverride

    if (!isEngineTurn) {
      if (settings.showEval) engine.analyze(game.fen, game.turn)
      return undefined
    }

    let cancelled = false
    const mover = game.turn
    ;(async () => {
      const legalMoves = game.chess.moves({ verbose: true })
      const move = await engine.requestMove(game.fen, game.turn, {
        tierId: settings.difficultyTierId,
        movetimeMs: settings.movetimeMs,
        custom: settings.customDifficulty,
        legalMoves,
      })
      if (cancelled || !move) return
      applyMove(move, mover)
    })()

    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    phase,
    game.fen,
    result.over,
    pendingPromotion,
    engine.status,
    settings.playerColor,
    settings.engineMovesFirst,
    settings.showEval,
  ])

  // --- Position editor handlers ---------------------------------------------

  const handleEditorFenChange = (fen) => {
    setSettings((s) => ({ ...s, editorFen: fen }))
    setValidationError(null)
  }

  const handleEditorBoardChange = (placement) => {
    const parsed = parseFen(settings.editorFen)
    handleEditorFenChange(buildFen({ ...parsed, placement }))
  }

  const handleEraserToggle = () => setEraserActive((v) => !v)

  const handleEditorSquareSelect = (key) => {
    if (!eraserActive || !boardRef.current) return
    boardRef.current.setPieces(new Map([[key, undefined]]))
    const placement = boardRef.current.getFen()
    if (placement) handleEditorBoardChange(placement)
  }

  const handlePaletteDragStart = (piece, event) => boardRef.current?.dragNewPiece(piece, event)

  const handleResetEditor = () => handleEditorFenChange(initialEditorFen)

  const handleFlipBoard = () => setSettings((s) => ({ ...s, orientation: s.orientation === 'white' ? 'black' : 'white' }))

  // --- Play handlers ----------------------------------------------------------

  const needsPromotion = (from, to) =>
    game.chess.moves({ square: from, verbose: true }).some((m) => m.to === to && m.promotion)

  const handleBoardMove = (orig, dest) => {
    if (needsPromotion(orig, dest)) {
      setPendingPromotion({ from: orig, to: dest, color: game.turn })
      return
    }
    applyMove({ from: orig, to: dest }, game.turn)
  }

  const handlePromotionPick = (role) => {
    if (!pendingPromotion) return
    applyMove({ from: pendingPromotion.from, to: pendingPromotion.to, promotion: role }, pendingPromotion.color)
    setPendingPromotion(null)
  }

  const handlePromotionCancel = () => {
    setPendingPromotion(null)
    boardRef.current?.forceSync(game.fen)
  }

  const handleStartGame = () => {
    const validation = validatePosition(settings.editorFen)
    if (!validation.ok) {
      setValidationError(validation.error)
      return
    }
    setValidationError(null)
    setEraserActive(false)
    setPendingPromotion(null)
    setResignedBy(null)

    game.resetTo(validation.fen)
    engine.newGame()
    setSettings((s) => ({ ...s, orientation: s.playerColor === 'black' ? 'black' : 'white' }))
    setPhase('playing')
    setGameSessionId((n) => n + 1)
  }

  const handleUndo = () => {
    engine.stop()
    const takingBackOwnReply = settings.playerColor !== 'watch' && game.turn === humanColorLetter
    game.undo(takingBackOwnReply ? 2 : 1)
  }

  const handleRedo = () => game.redo()

  const handleRestart = () => {
    setEraserActive(false)
    setPendingPromotion(null)
    setResignedBy(null)
    game.resetTo(game.startFen)
    engine.newGame()
    setGameSessionId((n) => n + 1)
  }

  const handleResign = () => {
    if (settings.playerColor === 'watch' || result.over) return
    setResignedBy(humanColorLetter ?? game.turn)
  }

  const handleReturnToEditor = () => {
    engine.stop()
    setPendingPromotion(null)
    setEraserActive(false)
    setResignedBy(null)
    setInitialEditorFen(game.fen)
    setSettings((s) => ({ ...s, editorFen: game.fen }))
    setPhase('setup')
  }

  // --- Board props --------------------------------------------------------

  const isHumanTurnNow =
    phase === 'playing' &&
    !result.over &&
    !pendingPromotion &&
    settings.playerColor !== 'watch' &&
    game.turn === humanColorLetter &&
    !engine.thinking

  const dests = useMemo(() => {
    const map = new Map()
    if (!isHumanTurnNow) return map
    game.chess.moves({ verbose: true }).forEach((m) => {
      const list = map.get(m.from) ?? []
      list.push(m.to)
      map.set(m.from, list)
    })
    return map
  }, [isHumanTurnNow, game.chess])

  const movableColor =
    phase === 'setup' ? 'both' : settings.playerColor === 'watch' ? undefined : toFullColor(humanColorLetter)

  const boardFen = phase === 'setup' ? settings.editorFen : game.fen
  const boardTurnLetter = phase === 'setup' ? parseFen(settings.editorFen).turn : game.turn
  const inCheck = phase === 'playing' && !result.over && game.chess.isCheck()

  const bannerInfo = result.over
    ? { message: describeResult(result), tone: 'result' }
    : inCheck
      ? { message: 'Check!', tone: 'warning' }
      : engine.thinking
        ? { message: 'Stockfish is thinking…', tone: 'info' }
        : { message: null, tone: 'info' }

  return (
    <div className="app-shell">
      <header className="app-header">
        <h1 className="wordmark">Chess Lab</h1>
      </header>

      <main className="app-main">
        <div className="board-column">
          <ClockDisplay
            remaining={clock.remaining}
            activeColor={clock.activeColor}
            flagged={clock.flagged}
            orientation={settings.orientation}
            visible={phase === 'playing' && !!resolvedTimeControl}
          />

          <div className="board-area">
            <EvalBar evaluation={engine.evaluation} visible={phase === 'playing' && settings.showEval} />
            <div className="board-frame">
              <Board
                ref={boardRef}
                fen={boardFen}
                orientation={settings.orientation}
                turnColor={toFullColor(boardTurnLetter)}
                check={inCheck ? toFullColor(game.turn) : false}
                lastMove={phase === 'playing' && game.lastMove ? [game.lastMove.from, game.lastMove.to] : undefined}
                free={phase === 'setup'}
                movableColor={movableColor}
                dests={phase === 'playing' ? dests : undefined}
                viewOnly={phase === 'playing' && (settings.playerColor === 'watch' || result.over)}
                showDests={settings.showDests}
                deleteOnDropOff={phase === 'setup'}
                onMove={phase === 'playing' ? handleBoardMove : undefined}
                onSelect={phase === 'setup' ? handleEditorSquareSelect : undefined}
                onChange={phase === 'setup' ? handleEditorBoardChange : undefined}
              />
              {pendingPromotion && (
                <PromotionPicker color={pendingPromotion.color} onPick={handlePromotionPick} onCancel={handlePromotionCancel} />
              )}
            </div>
          </div>

          <div className="button-row board-actions">
            <button type="button" className="btn btn--ghost" onClick={handleFlipBoard}>
              Flip board
            </button>
          </div>

          <GameStatusBanner message={bannerInfo.message} tone={bannerInfo.tone} thinking={engine.thinking} />

          {engine.status === 'error' && (
            <p className="engine-error" role="alert">
              {engine.errorMessage || 'The chess engine failed to load.'} Try reloading the page — if it keeps
              happening, your browser may not support WebAssembly.
            </p>
          )}
        </div>

        <aside className="side-panel">
          {phase === 'setup' ? (
            <>
              <PositionEditor
                fen={settings.editorFen}
                onChange={handleEditorFenChange}
                onResetToInitial={handleResetEditor}
                validationError={validationError}
                eraserActive={eraserActive}
                onEraserToggle={handleEraserToggle}
                onPaletteDragStart={handlePaletteDragStart}
              />
              <PlayerPanel
                playerColor={settings.playerColor}
                onChange={(playerColor) => setSettings((s) => ({ ...s, playerColor }))}
                engineMovesFirst={settings.engineMovesFirst}
                onEngineMovesFirstChange={(v) => setSettings((s) => ({ ...s, engineMovesFirst: v }))}
              />
              <DifficultyPanel
                tierId={settings.difficultyTierId}
                onTierChange={(id) =>
                  setSettings((s) => ({
                    ...s,
                    difficultyTierId: id,
                    movetimeMs: id === 'custom' ? s.movetimeMs : getTier(id).defaultMovetimeMs,
                  }))
                }
                movetimeMs={settings.movetimeMs}
                onMovetimeChange={(ms) => setSettings((s) => ({ ...s, movetimeMs: ms }))}
                custom={settings.customDifficulty}
                onCustomChange={(custom) => setSettings((s) => ({ ...s, customDifficulty: custom }))}
              />
              <TimerPanel
                timeControl={settings.timeControl}
                onChange={(timeControl) => setSettings((s) => ({ ...s, timeControl }))}
              />
              <button type="button" className="btn btn--primary btn--large" onClick={handleStartGame}>
                Start game
              </button>
            </>
          ) : (
            <>
              <GameControls
                canUndo={game.canUndo}
                onUndo={handleUndo}
                canRedo={game.canRedo}
                onRedo={handleRedo}
                onRestart={handleRestart}
                onResign={handleResign}
                onReturnToEditor={handleReturnToEditor}
                gameOver={result.over}
                showDests={settings.showDests}
                onToggleShowDests={(v) => setSettings((s) => ({ ...s, showDests: v }))}
                showEval={settings.showEval}
                onToggleShowEval={(v) => setSettings((s) => ({ ...s, showEval: v }))}
                showHistory={settings.showHistory}
                onToggleShowHistory={(v) => setSettings((s) => ({ ...s, showHistory: v }))}
              />
              <MoveHistory history={game.history} visible={settings.showHistory} />
              <section className="panel-section">
                <h2 className="panel-heading">Current FEN</h2>
                <textarea
                  readOnly
                  rows={2}
                  value={game.fen}
                  className="fen-input"
                  onFocus={(e) => e.target.select()}
                  aria-label="Current position FEN"
                />
              </section>
            </>
          )}
        </aside>
      </main>
    </div>
  )
}
