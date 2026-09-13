export default function MoveHistory({ history, visible }) {
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
        <ol className="move-history__list">
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
