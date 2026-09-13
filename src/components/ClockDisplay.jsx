import { formatClock } from '../lib/timeControl.js'

export default function ClockDisplay({ remaining, activeColor, flagged, orientation, visible }) {
  if (!visible) return null

  const topColor = orientation === 'white' ? 'b' : 'w'
  const bottomColor = orientation === 'white' ? 'w' : 'b'

  const renderClock = (color) => (
    <div
      key={color}
      className={`clock${activeColor === color ? ' is-active' : ''}${flagged === color ? ' is-flagged' : ''}`}
    >
      <span className="clock__label">{color === 'w' ? 'White' : 'Black'}</span>
      <span className="clock__time">{formatClock(remaining[color])}</span>
    </div>
  )

  return (
    <div className="clock-pair">
      {renderClock(topColor)}
      {renderClock(bottomColor)}
    </div>
  )
}
