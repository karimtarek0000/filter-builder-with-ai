import { useEffect, useState } from 'react'
import type { FilterGroup } from './types'
import { decodeFilterFromParam, encodeFilterToParam } from './urlState'

export const createEmptyRoot = (): FilterGroup => ({
  id: crypto.randomUUID(),
  kind: 'group',
  logic: 'AND',
  children: [],
})

const readInitialRoot = (): FilterGroup => {
  const params = new URLSearchParams(window.location.search)
  return decodeFilterFromParam(params.get('f')) ?? createEmptyRoot()
}

export const useFilterUrlSync = () => {
  const [root, setRoot] = useState<FilterGroup>(readInitialRoot)

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    params.set('f', encodeFilterToParam(root))
    const newUrl = `${window.location.pathname}?${params.toString()}`
    window.history.replaceState(null, '', newUrl)
  }, [root])

  return [root, setRoot] as const
}
