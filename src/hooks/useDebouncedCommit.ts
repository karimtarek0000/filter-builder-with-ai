import { useEffect, useState } from 'react'

export const useDebouncedCommit = <T>(value: T, onCommit: (value: T) => void, delayMs: number) => {
  const [localValue, setLocalValue] = useState(value)
  const [previousValue, setPreviousValue] = useState(value)

  if (value !== previousValue) {
    setPreviousValue(value)
    setLocalValue(value)
  }

  useEffect(() => {
    const timer = setTimeout(() => {
      onCommit(localValue)
    }, delayMs)

    return () => clearTimeout(timer)
  }, [delayMs, localValue, onCommit])

  return [localValue, setLocalValue] as const
}
