import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { act, renderHook } from '@testing-library/react'
import { employeeFieldConfig } from '../../../data/employeeFieldConfig'
import { useFilterUrlSync } from './useFilterUrlSync'
import type { FilterGroup } from '../types'

const setLocationSearch = (search: string) => {
  window.history.replaceState(null, '', `/${search}`)
}

const seededGroup: FilterGroup = {
  id: 'g1',
  kind: 'group',
  logic: 'AND',
  children: [
    {
      id: 'c1',
      kind: 'condition',
      field: 'name',
      operator: 'contains',
      value: 'ali',
    },
  ],
}

const encodeGroup = (group: FilterGroup): string => {
  const bytes = new TextEncoder().encode(JSON.stringify(group))
  let binary = ''
  bytes.forEach(byte => (binary += String.fromCharCode(byte)))
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

describe('useFilterUrlSync', () => {
  beforeEach(() => {
    setLocationSearch('')
  })

  afterEach(() => {
    setLocationSearch('')
  })

  it('decodes the initial root from a seeded URL', () => {
    setLocationSearch(`?f=${encodeGroup(seededGroup)}`)

    const { result } = renderHook(() => useFilterUrlSync(employeeFieldConfig))

    expect(result.current[0]).toEqual(seededGroup)
  })

  it('falls back to an empty filter when the URL is malformed', () => {
    setLocationSearch('?f=not-valid-base64-!!!')

    const { result } = renderHook(() => useFilterUrlSync(employeeFieldConfig))

    expect(result.current[0]).toMatchObject({ kind: 'group', logic: 'AND', children: [] })
    expect(typeof result.current[0].id).toBe('string')
  })

  it('calls history.replaceState (not pushState) after the tree changes', () => {
    const replaceStateSpy = vi.spyOn(window.history, 'replaceState')
    const pushStateSpy = vi.spyOn(window.history, 'pushState')

    const { result } = renderHook(() => useFilterUrlSync(employeeFieldConfig))

    replaceStateSpy.mockClear()

    act(() => {
      result.current[1](seededGroup)
    })

    expect(replaceStateSpy).toHaveBeenCalled()
    expect(pushStateSpy).not.toHaveBeenCalled()

    replaceStateSpy.mockRestore()
    pushStateSpy.mockRestore()
  })
})
