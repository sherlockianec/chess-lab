import { TIME_CONTROL_PRESETS } from '../lib/timeControl.js'

const MODES = [
  { id: 'none', label: 'No timer' },
  { id: 'preset', label: 'Standard' },
  { id: 'custom', label: 'Custom' },
]

export default function TimerPanel({ timeControl, onChange }) {
  const { mode } = timeControl

  return (
    <section className="panel-section" aria-label="Timer">
      <h2 className="panel-heading">Timer</h2>
      <div className="segmented" role="radiogroup" aria-label="Timer mode">
        {MODES.map((opt) => (
          <button
            key={opt.id}
            type="button"
            role="radio"
            aria-checked={mode === opt.id}
            className={`segmented__option${mode === opt.id ? ' is-selected' : ''}`}
            onClick={() => onChange({ ...timeControl, mode: opt.id })}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {mode === 'preset' && (
        <label className="slider-label">
          Time control
          <select value={timeControl.presetId} onChange={(e) => onChange({ ...timeControl, presetId: e.target.value })}>
            {TIME_CONTROL_PRESETS.map((p) => (
              <option key={p.id} value={p.id}>
                {p.label}
              </option>
            ))}
          </select>
        </label>
      )}

      {mode === 'custom' && (
        <>
          <label className="slider-label">
            Minutes per side: {timeControl.minutes}
            <input
              type="range"
              min={1}
              max={60}
              step={1}
              value={timeControl.minutes}
              onChange={(e) => onChange({ ...timeControl, minutes: Number(e.target.value) })}
            />
          </label>
          <label className="slider-label">
            Increment: {timeControl.incrementSec}s
            <input
              type="range"
              min={0}
              max={60}
              step={1}
              value={timeControl.incrementSec}
              onChange={(e) => onChange({ ...timeControl, incrementSec: Number(e.target.value) })}
            />
          </label>
        </>
      )}
    </section>
  )
}
