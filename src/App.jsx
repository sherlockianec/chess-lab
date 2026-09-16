import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Chess } from 'chess.js'
import Board from './components/Board.jsx'
import PromotionPicker from './components/PromotionPicker.jsx'
import PiecePalette from './components/PiecePalette.jsx'
import PositionEditor from './components/PositionEditor.jsx'
import PlayerPanel from './components/PlayerPanel.jsx'
import DifficultyPanel from './components/DifficultyPanel.jsx'
import TimerPanel from './components/TimerPanel.jsx'
import GameControls from './components/GameControls.jsx'
import GameStatusBanner from './components/GameStatusBanner.jsx'
import GameOverModal from './components/GameOverModal.jsx'
import MoveHistory from './components/MoveHistory.jsx'
import EvalBar from './components/EvalBar.jsx'
import ClockDisplay from './components/ClockDisplay.jsx'
import ReviewPanel from './components/ReviewPanel.jsx'
import PgnImportPanel from './components/PgnImportPanel.jsx'
import CopyButton from './components/CopyButton.jsx'
import { useChessGame } from './hooks/useChessGame.js'
import { useStockfish } from './hooks/useStockfish.js'
import { useClock } from './hooks/useClock.js'
import { useGameReview } from './hooks/useGameReview.js'
import { useLocalStorage } from './hooks/useLocalStorage.js'
import { START_FEN, buildFen, deriveCastlingRights, parseFen } from './lib/fen.js'
import { validatePosition } from './lib/positionValidation.js'
import { resolveTimeControl } from './lib/timeControl.js'
import { getTier } from './lib/difficulty.js'
import { buildPgn, parsePgn } from './lib/pgn.js'
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
  theme: 'dark', // 'dark' | 'light'
  pieceSet: 'classic', // 'classic' | 'uzbek'
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

function pgnResultTag(result) {
  if (!result.over) return '*'
  if (result.winner === 'w') return '1-0'
  if (result.winner === 'b') return '0-1'
  return '1/2-1/2'
}

export default function App() {
  const [settings, setSettings] = useLocalStorage('chess-lab:settings:v1', DEFAULT_SETTINGS)
  const [phase, setPhase] = useState('setup') // 'setup' | 'playing' | 'review'
  const [initialEditorFen, setInitialEditorFen] = useState(settings.editorFen)
  const [validationError, setValidationError] = useState(null)
  const [activeTool, setActiveTool] = useState(null) // null | 'eraser' | { role, color }
  const [pendingPromotion, setPendingPromotion] = useState(null) // { from, to, color }
  const [resignedBy, setResignedBy] = useState(null) // 'w' | 'b' | null
  const [gameSessionId, setGameSessionId] = useState(0)
  const [modalDismissed, setModalDismissed] = useState(false)

  const boardRef = useRef(null)
  const engine = useStockfish()
  const game = useChessGame(settings.editorFen)
  const review = useGameReview()

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

  // Match the document's native form-control rendering (scrollbars, checkboxes,
  // ...) to whichever theme is active.
  useEffect(() => {
    document.documentElement.style.colorScheme = settings.theme
  }, [settings.theme])

  // Start the clock for whoever is to move exactly once per new game. gameSessionId
  // (bumped by Start/Restart) is the real trigger; game.turn is read fresh here
  // rather than listed as a dependency, since we only ever want this on session change.
  useEffect(() => {
    if (phase === 'playing' && resolvedTimeControl) clock.startTurn(game.turn)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gameSessionId, phase])

  useEffect(() => {
    setModalDismissed(false)
  }, [gameSessionId])

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

  // Game review: walk every position in the loaded game once, sequentially, and
  // record each one's evaluation as it comes back. Re-running this effect is
  // gated on the *array itself* changing (only true when review.load() is
  // called), so it runs exactly once per loaded game, not once per navigation.
  useEffect(() => {
    if (phase !== 'review' || !review.active || engine.status !== 'ready') return undefined
    let cancelled = false
    ;(async () => {
      for (let i = 0; i < review.positions.length; i++) {
        if (cancelled) return
        const posFen = review.positions[i].fen
        const turn = posFen.split(' ')[1] === 'b' ? 'b' : 'w'
        const ev = await engine.evaluatePosition(posFen, turn, 400)
        if (cancelled) return
        review.recordEval(i, ev)
      }
    })()
    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, review.active, review.positions, engine.status])

  const reviewAnalyzing = review.active && Object.keys(review.evals).length < (review.positions?.length ?? 0)

  // --- Position editor handlers ---------------------------------------------

  const handleEditorFenChange = (fen) => {
    setSettings((s) => ({ ...s, editorFen: fen }))
    setValidationError(null)
  }

  const handleEditorBoardChange = (placement) => {
    const parsed = parseFen(settings.editorFen)
    handleEditorFenChange(buildFen({ ...parsed, placement, castling: deriveCastlingRights(placement) }))
  }

  const handleEraserToggle = () => setActiveTool((t) => (t === 'eraser' ? null : 'eraser'))

  const handleEditorSquareSelect = (key) => {
    if (!boardRef.current || !activeTool) return
    if (activeTool === 'eraser') {
      boardRef.current.setPieces(new Map([[key, undefined]]))
    } else {
      boardRef.current.setPieces(new Map([[key, { role: activeTool.role, color: activeTool.color }]]))
    }
    const placement = boardRef.current.getFen()
    if (placement) handleEditorBoardChange(placement)
  }

  const handlePaletteDragStart = (piece, event) => boardRef.current?.dragNewPiece(piece, event)

  const handleResetEditor = () => handleEditorFenChange(initialEditorFen)

  const handleFlipBoard = () => setSettings((s) => ({ ...s, orientation: s.orientation === 'white' ? 'black' : 'white' }))

  const handleImportPgn = (text) => {
    const parsed = parsePgn(text)
    if (parsed.ok) {
      review.load(parsed.positions, parsed.headers)
      setPhase('review')
    }
    return parsed
  }

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
    setActiveTool(null)
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
    setActiveTool(null)
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
    review.clear()
    setPendingPromotion(null)
    setActiveTool(null)
    setResignedBy(null)
    setInitialEditorFen(game.fen)
    setSettings((s) => ({ ...s, editorFen: game.fen }))
    setPhase('setup')
  }

  const handleAnalyzeCurrentGame = () => {
    review.load(game.moveRecords, null)
    setPhase('review')
  }

  const handleExitReview = () => {
    review.clear()
    setPhase('setup')
  }

  const pgnHeadersForCurrentGame = () => {
    const humanLabel = 'Human'
    const engineLabel = 'Stockfish'
    return {
      Event: 'Chess Lab game',
      White: settings.playerColor === 'black' ? engineLabel : settings.playerColor === 'watch' ? engineLabel : humanLabel,
      Black: settings.playerColor === 'white' ? engineLabel : settings.playerColor === 'watch' ? engineLabel : humanLabel,
      Result: pgnResultTag(result),
    }
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

  const reviewPosition = phase === 'review' && review.active ? review.positions[review.index] : null
  const reviewChess = useMemo(() => (reviewPosition ? new Chess(reviewPosition.fen) : null), [reviewPosition])

  const boardFen = phase === 'setup' ? settings.editorFen : phase === 'review' ? reviewPosition?.fen ?? START_FEN : game.fen
  const boardTurnLetter =
    phase === 'setup' ? parseFen(settings.editorFen).turn : phase === 'review' ? reviewChess?.turn() ?? 'w' : game.turn
  const inCheck =
    phase === 'playing' ? !result.over && game.chess.isCheck() : phase === 'review' ? !!reviewChess?.isCheck() : false

  const boardLastMove =
    phase === 'playing'
      ? game.lastMove
        ? [game.lastMove.from, game.lastMove.to]
        : undefined
      : phase === 'review' && reviewPosition?.from
        ? [reviewPosition.from, reviewPosition.to]
        : undefined

  const evalBarValue = phase === 'review' ? review.evals[review.index] : engine.evaluation

  const bannerInfo = result.over
    ? { message: describeResult(result), tone: 'result' }
    : inCheck
      ? { message: 'Check!', tone: 'warning' }
      : engine.thinking
        ? { message: 'Stockfish is thinking…', tone: 'info' }
        : { message: null, tone: 'info' }

  return (
    <div className={`app-shell piece-set-${settings.pieceSet}`} data-theme={settings.theme}>
      <header className="app-header">
        <div className="app-header__spacer" aria-hidden="true" />
        <h1 className="wordmark">Chess Lab</h1>
        <button
          type="button"
          className="theme-toggle"
          onClick={() => setSettings((s) => ({ ...s, theme: s.theme === 'dark' ? 'light' : 'dark' }))}
          aria-label={`Switch to ${settings.theme === 'dark' ? 'light' : 'dark'} theme`}
          title={`Switch to ${settings.theme === 'dark' ? 'light' : 'dark'} theme`}
        >
          {settings.theme === 'dark' ? '☀' : '🌙'}
        </button>
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
            <EvalBar evaluation={evalBarValue} visible={(phase === 'playing' && settings.showEval) || phase === 'review'} />
            <div className="board-frame">
              <Board
                ref={boardRef}
                fen={boardFen}
                orientation={settings.orientation}
                turnColor={toFullColor(boardTurnLetter)}
                check={inCheck ? toFullColor(phase === 'review' ? reviewChess.turn() : game.turn) : false}
                lastMove={boardLastMove}
                free={phase === 'setup'}
                movableColor={movableColor}
                dests={phase === 'playing' ? dests : undefined}
                viewOnly={phase === 'review' || (phase === 'playing' && (settings.playerColor === 'watch' || result.over))}
                showDests={settings.showDests}
                deleteOnDropOff={phase === 'setup'}
                onMove={phase === 'playing' ? handleBoardMove : undefined}
                onSelect={phase === 'setup' ? handleEditorSquareSelect : undefined}
                onChange={phase === 'setup' ? handleEditorBoardChange : undefined}
              />
              {pendingPromotion && (
                <PromotionPicker
                  color={pendingPromotion.color}
                  pieceSet={settings.pieceSet}
                  onPick={handlePromotionPick}
                  onCancel={handlePromotionCancel}
                />
              )}
            </div>
          </div>

          {phase === 'setup' && (
            <>
              <PiecePalette
                pieceSet={settings.pieceSet}
                activeTool={activeTool}
                onSelectTool={setActiveTool}
                onEraserToggle={handleEraserToggle}
                onDragStart={handlePaletteDragStart}
              />
              <p className="hint-text">Drag a piece onto the board, or tap a piece then tap a square to place it.</p>
            </>
          )}

          <div className="button-row board-actions">
            <button type="button" className="btn btn--ghost" onClick={handleFlipBoard}>
              Flip board
            </button>
          </div>

          {phase !== 'review' && <GameStatusBanner message={bannerInfo.message} tone={bannerInfo.tone} thinking={engine.thinking} />}

          {engine.status === 'error' && (
            <p className="engine-error" role="alert">
              {engine.errorMessage || 'The chess engine failed to load.'} Try reloading the page — if it keeps
              happening, your browser may not support WebAssembly.
            </p>
          )}
        </div>

        <aside className="side-panel">
          {phase === 'setup' && (
            <>
              <PositionEditor
                fen={settings.editorFen}
                onChange={handleEditorFenChange}
                onResetToInitial={handleResetEditor}
                validationError={validationError}
              />
              <div className="panel-columns">
                <PlayerPanel
                  playerColor={settings.playerColor}
                  onChange={(playerColor) => setSettings((s) => ({ ...s, playerColor }))}
                  engineMovesFirst={settings.engineMovesFirst}
                  onEngineMovesFirstChange={(v) => setSettings((s) => ({ ...s, engineMovesFirst: v }))}
                />
                <TimerPanel
                  timeControl={settings.timeControl}
                  onChange={(timeControl) => setSettings((s) => ({ ...s, timeControl }))}
                />
              </div>
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
              <PgnImportPanel onImport={handleImportPgn} />
              <section className="panel-section" aria-label="Appearance">
                <h2 className="panel-heading">Appearance</h2>
                <fieldset className="field-group">
                  <legend>Piece set</legend>
                  <div className="segmented" role="radiogroup" aria-label="Piece set">
                    <button
                      type="button"
                      role="radio"
                      aria-checked={settings.pieceSet === 'classic'}
                      className={`segmented__option${settings.pieceSet === 'classic' ? ' is-selected' : ''}`}
                      onClick={() => setSettings((s) => ({ ...s, pieceSet: 'classic' }))}
                    >
                      Classic
                    </button>
                    <button
                      type="button"
                      role="radio"
                      aria-checked={settings.pieceSet === 'uzbek'}
                      className={`segmented__option${settings.pieceSet === 'uzbek' ? ' is-selected' : ''}`}
                      onClick={() => setSettings((s) => ({ ...s, pieceSet: 'uzbek' }))}
                    >
                      Uzbek Lab
                    </button>
                  </div>
                  <p className="hint-text hint-text--muted">Central Asian-inspired minimalist set — domed king, star finials, a fortress-tower rook.</p>
                </fieldset>
              </section>
              <button type="button" className="btn btn--primary btn--large" onClick={handleStartGame}>
                Start game
              </button>
            </>
          )}

          {phase === 'playing' && (
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
                <div className="button-row" style={{ marginTop: 8 }}>
                  <CopyButton
                    label="Copy PGN"
                    getText={() => buildPgn(game.startFen, game.history, pgnHeadersForCurrentGame())}
                  />
                  {result.over && (
                    <button type="button" className="btn btn--ghost" onClick={handleAnalyzeCurrentGame}>
                      Analyze game
                    </button>
                  )}
                </div>
              </section>
            </>
          )}

          {phase === 'review' && review.active && (
            <ReviewPanel
              positions={review.positions}
              index={review.index}
              evals={review.evals}
              headers={review.headers}
              analyzing={reviewAnalyzing}
              onGoTo={review.goTo}
              onPrev={review.prev}
              onNext={review.next}
              onExit={handleExitReview}
              onExportPgn={() =>
                buildPgn(
                  review.positions[0].fen,
                  review.positions.slice(1).map((p) => p.san),
                  review.headers || {},
                )
              }
            />
          )}
        </aside>
      </main>

      <GameOverModal
        open={phase === 'playing' && result.over && !modalDismissed}
        result={result}
        onClose={() => setModalDismissed(true)}
        onNewGame={handleRestart}
        onAnalyze={handleAnalyzeCurrentGame}
        onMainMenu={handleReturnToEditor}
      />
    </div>
  )
}
