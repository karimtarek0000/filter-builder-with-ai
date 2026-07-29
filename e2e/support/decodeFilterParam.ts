import type { Page } from '@playwright/test'

// Mirrors the decode half of src/features/filter-builder/urlState.ts so specs can assert
// on the *structure* of the `f` query param (ids are random UUIDs, so exact-string
// comparisons across reloads/clicks are not possible).
export interface DecodedFilterNode {
  id: string
  kind: 'condition' | 'group'
  field?: string
  operator?: string
  value?: string | number
  logic?: 'AND' | 'OR'
  children?: DecodedFilterNode[]
}

export const decodeFilterParam = (raw: string): DecodedFilterNode => {
  const base64 = raw.replace(/-/g, '+').replace(/_/g, '/')
  const padded = base64 + '='.repeat((4 - (base64.length % 4)) % 4)
  const json = Buffer.from(padded, 'base64').toString('utf-8')
  return JSON.parse(json) as DecodedFilterNode
}

export const getFParam = (page: Page): string | null => new URL(page.url()).searchParams.get('f')
