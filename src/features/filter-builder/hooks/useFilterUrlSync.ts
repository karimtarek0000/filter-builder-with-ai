import { useEffect, useState } from 'react'
import type { FilterFieldConfig, FilterGroup } from '../types'
import { decodeFilterFromParam, encodeFilterToParam } from '../urlState'

export const createEmptyRoot = (): FilterGroup => ({
  id: crypto.randomUUID(),
  kind: 'group',
  logic: 'AND',
  children: [],
})

const readInitialRoot = <TRow>(fieldConfig: FilterFieldConfig<TRow>): FilterGroup => {
  const params = new URLSearchParams(window.location.search)
  return decodeFilterFromParam(params.get('f'), fieldConfig) ?? createEmptyRoot()
}

export const useFilterUrlSync = <TRow>(fieldConfig: FilterFieldConfig<TRow>) => {
  const [root, setRoot] = useState<FilterGroup>(() => readInitialRoot(fieldConfig))

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    params.set('f', encodeFilterToParam(root, fieldConfig))
    const newUrl = `${window.location.pathname}?${params.toString()}`
    window.history.replaceState(null, '', newUrl)
  }, [root, fieldConfig])

  return [root, setRoot] as const
}
