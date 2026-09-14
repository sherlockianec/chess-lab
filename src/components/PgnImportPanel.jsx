import { useState } from 'react'

export default function PgnImportPanel({ onImport }) {
  const [open, setOpen] = useState(false)
  const [text, setText] = useState('')
  const [error, setError] = useState(null)

  const handleAnalyze = () => {
    const result = onImport(text)
    if (!result.ok) {
      setError(result.error)
    } else {
      setError(null)
      setText('')
      setOpen(false)
    }
  }

  return (
    <section className="panel-section">
      <h2 className="panel-heading">Analyze a PGN game</h2>
      {!open ? (
        <button type="button" className="btn btn--ghost" onClick={() => setOpen(true)}>
          Paste a PGN to review
        </button>
      ) : (
        <>
          <textarea
            className="fen-input"
            rows={5}
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Paste PGN text here…"
            aria-label="PGN text"
          />
          <div className="button-row" style={{ marginTop: 8 }}>
            <button type="button" className="btn btn--primary" onClick={handleAnalyze}>
              Analyze
            </button>
            <button
              type="button"
              className="btn btn--ghost"
              onClick={() => {
                setOpen(false)
                setError(null)
              }}
            >
              Cancel
            </button>
          </div>
          {error && (
            <p className="validation-error" role="alert">
              {error}
            </p>
          )}
        </>
      )}
    </section>
  )
}
