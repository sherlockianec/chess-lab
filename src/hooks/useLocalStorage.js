import { useEffect, useState } from 'react'

/**
 * useState that mirrors its value to localStorage under `key`. Storage access is
 * wrapped in try/catch: private-browsing modes and storage quota errors just mean
 * the app won't remember settings next time, not a crash.
 */
export function useLocalStorage(key, initialValue) {
  const [value, setValue] = useState(() => {
    try {
      const raw = window.localStorage.getItem(key)
      if (raw === null) return initialValue
      const parsed = JSON.parse(raw)
      // Shallow-merge over the default so a settings object gains new top-level
      // fields gracefully instead of losing them for anyone with older data saved.
      const isPlainObject = (v) => typeof v === 'object' && v !== null && !Array.isArray(v)
      return isPlainObject(initialValue) && isPlainObject(parsed) ? { ...initialValue, ...parsed } : parsed
    } catch {
      return initialValue
    }
  })

  useEffect(() => {
    try {
      window.localStorage.setItem(key, JSON.stringify(value))
    } catch {
      // Ignore — see comment above.
    }
  }, [key, value])

  return [value, setValue]
}
