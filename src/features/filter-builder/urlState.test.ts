import { describe, expect, it } from 'vitest'
import { z } from 'zod'
import { decodeFilterFromParam, encodeFilterToParam } from './urlState'
import type { FilterCondition, FilterFieldConfig, FilterGroup } from './types'

interface Row {
  name: string
  age: number
}

const fieldConfig: FilterFieldConfig<Row> = {
  name: {
    label: 'name',
    operators: {
      contains: {
        label: 'contains',
        valueKind: 'text',
        schema: z.string().min(1),
        match: (row, value) => row.name.toLowerCase().includes(String(value).toLowerCase()),
        describe: value => `name contains "${value ?? ''}"`,
      },
    },
  },
  age: {
    label: 'age',
    operators: {
      gt: {
        label: 'gt',
        valueKind: 'number',
        match: (row, value) => row.age > Number(value),
        describe: value => `age > ${value ?? ''}`,
      },
    },
  },
}

const condition = (overrides: Partial<FilterCondition>): FilterCondition => ({
  id: 'c1',
  kind: 'condition',
  field: 'age',
  operator: 'gt',
  value: 20,
  ...overrides,
})

const group = (overrides: Partial<FilterGroup>): FilterGroup => ({
  id: 'g1',
  kind: 'group',
  logic: 'AND',
  children: [],
  ...overrides,
})

describe('encodeFilterToParam / decodeFilterFromParam', () => {
  it('round-trips a valid flat tree', () => {
    const root = group({
      children: [
        condition({ id: 'c1', field: 'age', operator: 'gt', value: 20 }),
        condition({ id: 'c2', field: 'name', operator: 'contains', value: 'ali' }),
      ],
    })
    const encoded = encodeFilterToParam(root, fieldConfig)
    const decoded = decodeFilterFromParam(encoded, fieldConfig)
    expect(decoded).toEqual(root)
  })

  it('round-trips a tree with multiple nested groups', () => {
    const root = group({
      children: [
        group({
          id: 'g2',
          logic: 'OR',
          children: [condition({ id: 'c1', field: 'age', operator: 'gt', value: 20 })],
        }),
        group({
          id: 'g3',
          logic: 'AND',
          children: [condition({ id: 'c2', field: 'name', operator: 'contains', value: 'ali' })],
        }),
      ],
    })
    const encoded = encodeFilterToParam(root, fieldConfig)
    const decoded = decodeFilterFromParam(encoded, fieldConfig)
    expect(decoded).toEqual(root)
  })

  it('drops a condition currently failing validation before encoding', () => {
    const root = group({
      children: [
        condition({ id: 'c1', field: 'name', operator: 'contains', value: '' }),
        condition({ id: 'c2', field: 'age', operator: 'gt', value: 20 }),
      ],
    })
    const encoded = encodeFilterToParam(root, fieldConfig)
    const decoded = decodeFilterFromParam(encoded, fieldConfig)
    expect(decoded?.children).toEqual([condition({ id: 'c2', field: 'age', operator: 'gt', value: 20 })])
  })

  it('decodes a malformed base64 value to null', () => {
    expect(decodeFilterFromParam('not-valid-base64-!!!', fieldConfig)).toBeNull()
  })

  it('decodes an undecodable/empty value to null', () => {
    expect(decodeFilterFromParam(null, fieldConfig)).toBeNull()
    expect(decodeFilterFromParam('', fieldConfig)).toBeNull()
  })

  it('decodes a value referencing an unrecognized field to null', () => {
    const root = {
      id: 'g1',
      kind: 'condition',
      field: 'unknownField',
      operator: 'contains',
      value: 'x',
    }
    const bytes = new TextEncoder().encode(JSON.stringify(root))
    let binary = ''
    bytes.forEach(byte => (binary += String.fromCharCode(byte)))
    const encoded = btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
    expect(decodeFilterFromParam(encoded, fieldConfig)).toBeNull()
  })

  it('decodes a value referencing an unrecognized operator to null', () => {
    const root = group({
      children: [condition({ id: 'c1', field: 'age', operator: 'nonexistent' })],
    })
    const bytes = new TextEncoder().encode(JSON.stringify(root))
    let binary = ''
    bytes.forEach(byte => (binary += String.fromCharCode(byte)))
    const encoded = btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
    expect(decodeFilterFromParam(encoded, fieldConfig)).toBeNull()
  })
})
