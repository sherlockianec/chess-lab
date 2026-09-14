export default function GameControls({
  canUndo,
  onUndo,
  canRedo,
  onRedo,
  onRestart,
  onResign,
  onReturnToEditor,
  gameOver,
  showDests,
  onToggleShowDests,
  showEval,
  onToggleShowEval,
  showHistory,
  onToggleShowHistory,
}) {
  return (
    <section className="panel-section" aria-label="Game controls">
      <h2 className="panel-heading">Game</h2>

      <div className="button-row">
        <button type="button" className="btn btn--ghost btn--icon btn--icon--undo" onClick={onUndo} disabled={!canUndo}>
          <span className="btn-icon" aria-hidden="true">↶</span> Undo
        </button>
        <button type="button" className="btn btn--ghost btn--icon btn--icon--redo" onClick={onRedo} disabled={!canRedo}>
          <span className="btn-icon" aria-hidden="true">↷</span> Redo
        </button>
        <button type="button" className="btn btn--ghost btn--icon btn--icon--restart" onClick={onRestart}>
          <span className="btn-icon" aria-hidden="true">⟳</span> Restart
        </button>
      </div>

      <div className="button-row">
        {!gameOver && (
          <button type="button" className="btn btn--danger" onClick={onResign}>
            Resign
          </button>
        )}
        <button type="button" className="btn btn--primary" onClick={onReturnToEditor}>
          {gameOver ? 'New setup' : 'Return to editor'}
        </button>
      </div>

      <div className="toggle-list">
        <label className="checkbox-label">
          <input type="checkbox" checked={showDests} onChange={(e) => onToggleShowDests(e.target.checked)} />
          Show legal moves
        </label>
        <label className="checkbox-label">
          <input type="checkbox" checked={showEval} onChange={(e) => onToggleShowEval(e.target.checked)} />
          Show engine evaluation
        </label>
        <label className="checkbox-label">
          <input type="checkbox" checked={showHistory} onChange={(e) => onToggleShowHistory(e.target.checked)} />
          Show move history
        </label>
      </div>
    </section>
  )
}
