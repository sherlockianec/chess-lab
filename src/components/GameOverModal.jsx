function describe(result) {
  const winnerName = result.winner === 'w' ? 'White' : result.winner === 'b' ? 'Black' : null
  switch (result.reason) {
    case 'checkmate':
      return { headline: `${winnerName} wins`, detail: 'by checkmate' }
    case 'stalemate':
      return { headline: 'Draw', detail: 'by stalemate' }
    case 'insufficient-material':
      return { headline: 'Draw', detail: 'insufficient material to checkmate' }
    case 'repetition':
      return { headline: 'Draw', detail: 'threefold repetition' }
    case 'fifty-move':
      return { headline: 'Draw', detail: 'fifty-move rule' }
    case 'resignation':
      return { headline: `${winnerName} wins`, detail: `${winnerName === 'White' ? 'Black' : 'White'} resigned` }
    case 'timeout':
      return { headline: `${winnerName} wins`, detail: 'on time' }
    default:
      return { headline: 'Game over', detail: '' }
  }
}

export default function GameOverModal({ open, result, onClose, onNewGame, onAnalyze, onMainMenu }) {
  if (!open || !result?.over) return null
  const { headline, detail } = describe(result)

  return (
    <div className="modal-overlay" role="dialog" aria-modal="true" aria-label="Game result" onClick={onClose}>
      <div className="modal-panel" onClick={(event) => event.stopPropagation()}>
        <button type="button" className="modal-close" onClick={onClose} aria-label="Close">
          ✕
        </button>
        <p className="modal-kicker">Game over</p>
        <h2 className="modal-headline">{headline}</h2>
        {detail && <p className="modal-detail">{detail}</p>}
        <div className="modal-actions">
          <button type="button" className="btn btn--primary" onClick={onNewGame}>
            New game
          </button>
          <button type="button" className="btn btn--ghost" onClick={onAnalyze}>
            Analyze game
          </button>
          <button type="button" className="btn btn--ghost" onClick={onMainMenu}>
            Main menu
          </button>
        </div>
      </div>
    </div>
  )
}
