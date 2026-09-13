import { DIFFICULTY_TIERS } from '../lib/difficulty.js'

export default function DifficultyPanel({ tierId, onTierChange, movetimeMs, onMovetimeChange, custom, onCustomChange }) {
  const isCustom = tierId === 'custom'
  const tierIndex = DIFFICULTY_TIERS.findIndex((t) => t.id === tierId)
  const tier = tierIndex >= 0 ? DIFFICULTY_TIERS[tierIndex] : null
  const sliderValue = tierIndex >= 0 ? tierIndex : DIFFICULTY_TIERS.length - 1

  return (
    <section className="panel-section" aria-label="Difficulty">
      <h2 className="panel-heading">Difficulty</h2>

      <input
        type="range"
        min={0}
        max={DIFFICULTY_TIERS.length - 1}
        step={1}
        value={sliderValue}
        onChange={(e) => onTierChange(DIFFICULTY_TIERS[Number(e.target.value)].id)}
        aria-label="Difficulty level"
        className="difficulty-slider"
      />
      <div className="difficulty-slider__ticks" aria-hidden="true">
        {DIFFICULTY_TIERS.map((t) => (
          <span key={t.id}>{t.label}</span>
        ))}
      </div>

      {tier && (
        <p className="hint-text">
          <strong>{tier.label}</strong> · {tier.eloHint} Elo (approximate) — {tier.description}
        </p>
      )}

      {tier && (
        <label className="slider-label">
          {tier.id === 'maximum' ? 'Thinking time per move' : 'Move time'}: {(movetimeMs / 1000).toFixed(1)}s
          <input
            type="range"
            min={tier.minMovetimeMs}
            max={tier.maxMovetimeMs}
            step={tier.id === 'maximum' ? 100 : 50}
            value={movetimeMs}
            onChange={(e) => onMovetimeChange(Number(e.target.value))}
          />
        </label>
      )}

      <label className="checkbox-label">
        <input
          type="checkbox"
          checked={isCustom}
          onChange={(e) => onTierChange(e.target.checked ? 'custom' : 'medium')}
        />
        Custom (manual Elo / skill / depth)
      </label>

      {isCustom && (
        <div className="custom-difficulty">
          <label className="checkbox-label">
            <input
              type="checkbox"
              checked={custom.limitStrength}
              onChange={(e) => onCustomChange({ ...custom, limitStrength: e.target.checked })}
            />
            Limit strength (UCI_LimitStrength)
          </label>

          {custom.limitStrength && (
            <label className="slider-label">
              Target Elo: {custom.elo}
              <input
                type="range"
                min={1320}
                max={3190}
                step={10}
                value={custom.elo}
                onChange={(e) => onCustomChange({ ...custom, elo: Number(e.target.value) })}
              />
            </label>
          )}

          <label className="slider-label">
            Skill Level: {custom.skillLevel}
            <input
              type="range"
              min={0}
              max={20}
              step={1}
              value={custom.skillLevel}
              onChange={(e) => onCustomChange({ ...custom, skillLevel: Number(e.target.value) })}
            />
          </label>

          <div className="segmented" role="radiogroup" aria-label="Search limit type">
            <button
              type="button"
              role="radio"
              aria-checked={!custom.useDepth}
              className={`segmented__option${!custom.useDepth ? ' is-selected' : ''}`}
              onClick={() => onCustomChange({ ...custom, useDepth: false })}
            >
              By time
            </button>
            <button
              type="button"
              role="radio"
              aria-checked={custom.useDepth}
              className={`segmented__option${custom.useDepth ? ' is-selected' : ''}`}
              onClick={() => onCustomChange({ ...custom, useDepth: true })}
            >
              By depth
            </button>
          </div>

          {custom.useDepth ? (
            <label className="slider-label">
              Depth: {custom.depth}
              <input
                type="range"
                min={1}
                max={40}
                step={1}
                value={custom.depth}
                onChange={(e) => onCustomChange({ ...custom, depth: Number(e.target.value) })}
              />
            </label>
          ) : (
            <label className="slider-label">
              Move time: {(custom.movetimeMs / 1000).toFixed(1)}s
              <input
                type="range"
                min={50}
                max={30000}
                step={50}
                value={custom.movetimeMs}
                onChange={(e) => onCustomChange({ ...custom, movetimeMs: Number(e.target.value) })}
              />
            </label>
          )}
        </div>
      )}

      <p className="hint-text hint-text--muted">
        Engine strength also depends on your device — these levels are a guide, not a guaranteed rating.
      </p>
    </section>
  )
}
