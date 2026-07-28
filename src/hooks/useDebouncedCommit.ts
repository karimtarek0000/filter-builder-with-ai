import { useEffect, useRef, useState } from 'react'

export const useDebouncedCommit = <T>(value: T, onCommit: (value: T) => void, delayMs: number) => {
  const [localValue, setLocalValue] = useState(value)
  const [lastSyncedValue, setLastSyncedValue] = useState(value)

  if (value !== lastSyncedValue) {
    setLastSyncedValue(value)
    setLocalValue(value)
  }

  const onCommitRef = useRef(onCommit)
  useEffect(() => {
    onCommitRef.current = onCommit
  })

  useEffect(() => {
    if (localValue === value) return

    const timer = setTimeout(() => onCommitRef.current(localValue), delayMs)
    return () => clearTimeout(timer)
  }, [localValue, value, delayMs])

  return [localValue, setLocalValue] as const
}
