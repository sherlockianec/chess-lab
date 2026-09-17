import { useEffect, useRef } from 'react'

export default function MoveHistory({ history, visible }) {
  const listRef = useRef(null)

  // Keep the latest moves in view by default -- scroll to the bottom whenever a
  // move is added, the same way a chat or log view behaves. The person can still
  // scroll up freely to review earlier moves; the next move just resets to the
  // bottom again, which is the expected "log" behavior rather than fighting it.
  useEffect(() => {
    const el = listRef.current
    if (el) el.scrollTop = el.scrollHeight
  }, [history.length])

  if (!visible) return null

  const pairs = []
  for (let i = 0; i < history.length; i += 2) {
    pairs.push({ number: i / 2 + 1, white: history[i], black: history[i + 1] })
  }

  return (
    <section className="panel-section move-history" aria-label="Move history">
      <h2 className="panel-heading">Moves</h2>
      {pairs.length === 0 ? (
        <p className="hint-text">No moves yet.</p>
      ) : (
        <ol className="move-history__list" ref={listRef}>
          {pairs.map((p) => (
            <li key={p.number}>
              <span className="move-history__num">{p.number}.</span>
              <span className="move-history__san">{p.white}</span>
              <span className="move-history__san">{p.black ?? ''}</span>
            </li>
          ))}
        </ol>
      )}
    </section>
  )
}
