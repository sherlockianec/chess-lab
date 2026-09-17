import { useEffect, useMemo, useRef, useState } from 'react'
import EvalGraph from './EvalGraph.jsx'
import MoveQualityBadge from './MoveQualityBadge.jsx'
import { MOVE_QUALITY_ORDER, qualityInfo, summarizeByColor } from '../lib/moveClassification.js'

export default function ReviewPanel({
  positions,
  index,
  evals,
  classifications,
  headers,
  analyzing,
  onGoTo,
  onPrev,
  onNext,
  onExit,
  onExportPgn,
}) {
  const [copyLabel, setCopyLabel] = useState('Copy PGN')
  const currentMoveRef = useRef(null)
  const sanList = positions.slice(1).map((p) => p.san)

  const summary = useMemo(() => summarizeByColor(positions, classifications), [positions, classifications])
  const currentMoveQuality = classifications[index]

  useEffect(() => {
    currentMoveRef.current?.scrollIntoView({ block: 'nearest' })
  }, [index])

  const pairs = []
  for (let i = 0; i < sanList.length; i += 2) {
    pairs.push({
      number: i / 2 + 1,
      white: { ply: i + 1, san: sanList[i] },
      black: sanList[i + 1] ? { ply: i + 2, san: sanList[i + 1] } : null,
    })
  }

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(onExportPgn())
      setCopyLabel('Copied!')
    } catch {
      setCopyLabel('Copy failed')
    }
    setTimeout(() => setCopyLabel('Copy PGN'), 1500)
  }

  const summaryRows = MOVE_QUALITY_ORDER.filter((key) => summary.w[key] || summary.b[key])

  return (
    <>
      <section className="panel-section">
        <h2 className="panel-heading">Game review</h2>
        {headers && (headers.White || headers.Black) && (
          <p className="hint-text">
            {headers.White || 'White'} vs {headers.Black || 'Black'}
            {headers.Result && headers.Result !== '*' ? ` · ${headers.Result}` : ''}
          </p>
        )}
        <EvalGraph
          evals={evals}
          positionCount={positions.length}
          currentIndex={index}
          onSelect={onGoTo}
          analyzing={analyzing}
        />
        <div className="current-move-quality">
          {index === 0 ? (
            <span className="hint-text hint-text--muted">Starting position</span>
          ) : currentMoveQuality ? (
            <>
              <MoveQualityBadge classification={currentMoveQuality} />
              <span className="hint-text hint-text--muted">
                {positions[index].san} ·{' '}
                {currentMoveQuality.lossCp === 0 ? 'no loss' : `${(currentMoveQuality.lossCp / 100).toFixed(2)} lost`}
              </span>
            </>
          ) : (
            <span className="hint-text hint-text--muted">Analyzing this move…</span>
          )}
        </div>
        <div className="button-row" style={{ marginTop: 10 }}>
          <button type="button" className="btn btn--ghost" onClick={onPrev} disabled={index === 0}>
            ◂ Prev
          </button>
          <button type="button" className="btn btn--ghost" onClick={onNext} disabled={index === positions.length - 1}>
            Next ▸
          </button>
        </div>
      </section>

      {summaryRows.length > 0 && (
        <section className="panel-section">
          <h2 className="panel-heading">Move quality</h2>
          <table className="quality-summary">
            <thead>
              <tr>
                <th scope="col"></th>
                <th scope="col">White</th>
                <th scope="col">Black</th>
              </tr>
            </thead>
            <tbody>
              {summaryRows.map((key) => (
                <tr key={key}>
                  <th scope="row">
                    <MoveQualityBadge classification={qualityInfo(key)} size="sm" />
                  </th>
                  <td>{summary.w[key] || 0}</td>
                  <td>{summary.b[key] || 0}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      )}

      <section className="panel-section move-history">
        <h2 className="panel-heading">Moves</h2>
        {pairs.length === 0 ? (
          <p className="hint-text">No moves in this game.</p>
        ) : (
          <ol className="move-history__list move-history__list--review">
            {pairs.map((p) => (
              <li key={p.number} ref={index === p.white.ply || index === p.black?.ply ? currentMoveRef : null}>
                <span className="move-history__num">{p.number}.</span>
                <button
                  type="button"
                  className={`move-history__move${index === p.white.ply ? ' is-current' : ''}`}
                  onClick={() => onGoTo(p.white.ply)}
                >
                  {p.white.san}
                </button>
                <MoveQualityBadge classification={classifications[p.white.ply]} size="sm" />
                {p.black && (
                  <>
                    <button
                      type="button"
                      className={`move-history__move${index === p.black.ply ? ' is-current' : ''}`}
                      onClick={() => onGoTo(p.black.ply)}
                    >
                      {p.black.san}
                    </button>
                    <MoveQualityBadge classification={classifications[p.black.ply]} size="sm" />
                  </>
                )}
              </li>
            ))}
          </ol>
        )}
      </section>

      <section className="panel-section">
        <div className="button-row">
          <button type="button" className="btn btn--ghost" onClick={handleCopy}>
            {copyLabel}
          </button>
        </div>
        <button type="button" className="btn btn--primary btn--large" onClick={onExit}>
          Back to setup
        </button>
      </section>
    </>
  )
}
