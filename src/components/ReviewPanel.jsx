import { useState } from 'react'
import EvalGraph from './EvalGraph.jsx'

export default function ReviewPanel({ positions, index, evals, headers, analyzing, onGoTo, onPrev, onNext, onExit, onExportPgn }) {
  const [copyLabel, setCopyLabel] = useState('Copy PGN')
  const sanList = positions.slice(1).map((p) => p.san)

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
        <div className="button-row" style={{ marginTop: 10 }}>
          <button type="button" className="btn btn--ghost" onClick={onPrev} disabled={index === 0}>
            ◂ Prev
          </button>
          <button type="button" className="btn btn--ghost" onClick={onNext} disabled={index === positions.length - 1}>
            Next ▸
          </button>
        </div>
      </section>

      <section className="panel-section move-history">
        <h2 className="panel-heading">Moves</h2>
        {pairs.length === 0 ? (
          <p className="hint-text">No moves in this game.</p>
        ) : (
          <ol className="move-history__list">
            {pairs.map((p) => (
              <li key={p.number}>
                <span className="move-history__num">{p.number}.</span>
                <button
                  type="button"
                  className={`move-history__move${index === p.white.ply ? ' is-current' : ''}`}
                  onClick={() => onGoTo(p.white.ply)}
                >
                  {p.white.san}
                </button>
                {p.black && (
                  <button
                    type="button"
                    className={`move-history__move${index === p.black.ply ? ' is-current' : ''}`}
                    onClick={() => onGoTo(p.black.ply)}
                  >
                    {p.black.san}
                  </button>
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
