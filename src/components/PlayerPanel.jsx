const OPTIONS = [
  { id: 'white', label: 'Play White' },
  { id: 'black', label: 'Play Black' },
  { id: 'watch', label: 'Watch' },
]

export default function PlayerPanel({ playerColor, onChange, engineMovesFirst, onEngineMovesFirstChange }) {
  return (
    <section className="panel-section" aria-label="Player">
      <h2 className="panel-heading">Player</h2>
      <div className="segmented" role="radiogroup" aria-label="Choose your side">
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
      {playerColor !== 'watch' && (
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
