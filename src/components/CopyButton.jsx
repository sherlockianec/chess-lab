import { useState } from 'react'

/** `getText` may be a string or a function returning one, evaluated at click time. */
export default function CopyButton({ getText, label = 'Copy', className = 'btn btn--ghost' }) {
  const [text, setText] = useState(label)

  const handleClick = async () => {
    try {
      const value = typeof getText === 'function' ? getText() : getText
      await navigator.clipboard.writeText(value)
      setText('Copied!')
    } catch {
      setText('Copy failed')
    }
    setTimeout(() => setText(label), 1500)
  }

  return (
    <button type="button" className={className} onClick={handleClick}>
      {text}
    </button>
  )
}
