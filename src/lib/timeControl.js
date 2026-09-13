// Time control presets, plus the pure math for a chess clock. The ticking itself
// (setInterval, wall-clock deltas) lives in hooks/useClock.js — this file only
// knows how to go from a chosen time control to starting milliseconds.

export const TIME_CONTROL_PRESETS = [
  { id: 'bullet1', label: 'Bullet · 1+0', minutes: 1, incrementSec: 0 },
  { id: 'bullet2_1', label: 'Bullet · 2+1', minutes: 2, incrementSec: 1 },
  { id: 'blitz3', label: 'Blitz · 3+0', minutes: 3, incrementSec: 0 },
  { id: 'blitz3_2', label: 'Blitz · 3+2', minutes: 3, incrementSec: 2 },
  { id: 'blitz5', label: 'Blitz · 5+0', minutes: 5, incrementSec: 0 },
  { id: 'rapid10', label: 'Rapid · 10+0', minutes: 10, incrementSec: 0 },
  { id: 'rapid15_10', label: 'Rapid · 15+10', minutes: 15, incrementSec: 10 },
  { id: 'classical30', label: 'Classical · 30+0', minutes: 30, incrementSec: 0 },
]

export function getPreset(id) {
  return TIME_CONTROL_PRESETS.find((p) => p.id === id) || TIME_CONTROL_PRESETS[4]
}

/**
 * Resolve a { mode, presetId, minutes, incrementSec } selection into starting
 * clock values. mode 'none' returns null (no clock at all).
 */
export function resolveTimeControl(timeControl) {
  if (!timeControl || timeControl.mode === 'none') return null

  const { minutes, incrementSec } =
    timeControl.mode === 'preset' ? getPreset(timeControl.presetId) : timeControl

  const startMs = Math.max(1, Math.round(minutes * 60000))
  return {
    startMs,
    incrementMs: Math.max(0, Math.round((incrementSec || 0) * 1000)),
  }
}

export function formatClock(ms) {
  if (ms == null) return ''
  const clamped = Math.max(0, ms)
  const totalSeconds = Math.floor(clamped / 1000)
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60
  // Under 20 seconds, show tenths so a near-flag clock feels alive rather than frozen.
  if (clamped < 20000) {
    const tenths = Math.floor((clamped % 1000) / 100)
    return `${minutes}:${String(seconds).padStart(2, '0')}.${tenths}`
  }
  return `${minutes}:${String(seconds).padStart(2, '0')}`
}
