import { useEffect, useState } from 'react'

export const useDebouncedValue = <T>(value: T, onCommit: (value: T) => void, delayMs: number) => {
  const [localValue, setLocalValue] = useState(value)

  useEffect(() => {
    const timer = setTimeout(() => {
      onCommit(localValue)
    }, delayMs)

    return () => clearTimeout(timer)
  }, [delayMs, localValue, onCommit])

  return [localValue, setLocalValue] as const
}
