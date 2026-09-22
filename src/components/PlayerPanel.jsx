const OPTIONS = [
  { id: 'white', label: 'White' },
  { id: 'black', label: 'Black' },
  { id: 'human', label: '2 Players' },
  { id: 'watch', label: 'Watch' },
]

export default function PlayerPanel({ playerColor, onChange, engineMovesFirst, onEngineMovesFirstChange }) {
  return (
    <section className="panel-section" aria-label="Player">
      <h2 className="panel-heading">Player</h2>
      <div className="segmented" role="radiogroup" aria-label="Choose game mode">
        {OPTIONS.map((opt) => (
          <button
            key={opt.id}
            type="button"
            role="radio"
            aria-checked={playerColor === opt.id}
            className={`segmented__option${playerColor === opt.id ? ' is-selected' : ''}`}
            onClick={() => onChange(opt.id)}
          >
            {opt.label}
          </button>
        ))}
      </div>
      {playerColor === 'human' && (
        <p className="hint-text">
          Two people, one device — no engine involved. The board flips to face whoever's turn it is.
        </p>
      )}
      {playerColor !== 'watch' && playerColor !== 'human' && (
        <label className="checkbox-label">
          <input
            type="checkbox"
            checked={engineMovesFirst}
            onChange={(e) => onEngineMovesFirstChange(e.target.checked)}
          />
          Let Stockfish play the first move
        </label>
      )}
    </section>
  )
}
