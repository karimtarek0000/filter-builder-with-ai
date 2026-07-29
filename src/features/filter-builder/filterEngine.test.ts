import { describe, expect, it } from 'vitest'
import { describeFilter, describeMatchCount, evaluateNode, filterRows } from './filterEngine'
import { createEmptyRoot } from './hooks'
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
  field: 'name',
  operator: 'contains',
  value: 'a',
  ...overrides,
})

const group = (overrides: Partial<FilterGroup>): FilterGroup => ({
  id: 'g1',
  kind: 'group',
  logic: 'AND',
  children: [],
  ...overrides,
})

const alice: Row = { name: 'Alice', age: 30 }
const bob: Row = { name: 'Bob', age: 20 }

describe('evaluateNode', () => {
  it('matches a single condition whose operator matches the row', () => {
    const node = condition({ field: 'name', operator: 'contains', value: 'ali' })
    expect(evaluateNode(node, alice, fieldConfig)).toBe(true)
  })

  it('does not match a single condition whose operator does not match the row', () => {
    const node = condition({ field: 'name', operator: 'contains', value: 'zzz' })
    expect(evaluateNode(node, alice, fieldConfig)).toBe(false)
  })

  it('matches an AND group only when every child matches', () => {
    const node = group({
      logic: 'AND',
      children: [
        condition({ id: 'c1', field: 'name', operator: 'contains', value: 'ali' }),
        condition({ id: 'c2', field: 'age', operator: 'gt', value: 20 }),
      ],
    })
    expect(evaluateNode(node, alice, fieldConfig)).toBe(true)
    expect(evaluateNode(node, bob, fieldConfig)).toBe(false)
  })

  it('matches an OR group when any child matches', () => {
    const node = group({
      logic: 'OR',
      children: [
        condition({ id: 'c1', field: 'name', operator: 'contains', value: 'zzz' }),
        condition({ id: 'c2', field: 'age', operator: 'gt', value: 25 }),
      ],
    })
    expect(evaluateNode(node, alice, fieldConfig)).toBe(true)
    expect(evaluateNode(node, bob, fieldConfig)).toBe(false)
  })

  it('evaluates across multiple sibling nested groups', () => {
    const node = group({
      logic: 'AND',
      children: [
        group({
          id: 'g2',
          logic: 'OR',
          children: [condition({ id: 'c1', field: 'name', operator: 'contains', value: 'ali' })],
        }),
        group({
          id: 'g3',
          logic: 'OR',
          children: [condition({ id: 'c2', field: 'age', operator: 'gt', value: 20 })],
        }),
      ],
    })
    expect(evaluateNode(node, alice, fieldConfig)).toBe(true)
    expect(evaluateNode(node, bob, fieldConfig)).toBe(false)
  })

  it('vacuously matches an empty group', () => {
    expect(evaluateNode(group({ children: [] }), alice, fieldConfig)).toBe(true)
  })

  it('vacuously matches a condition with an undefined value', () => {
    const node = condition({ field: 'name', operator: 'contains', value: undefined })
    expect(evaluateNode(node, alice, fieldConfig)).toBe(true)
  })
})

describe('filterRows', () => {
  it('returns only rows matching the filter tree', () => {
    const root = group({
      children: [condition({ field: 'name', operator: 'contains', value: 'a' })],
    })
    expect(filterRows(root, [alice, bob], fieldConfig)).toEqual([alice])
  })
})

describe('describeFilter', () => {
  it('describes a single condition', () => {
    const node = condition({ field: 'name', operator: 'contains', value: 'ali' })
    expect(describeFilter(node, fieldConfig)).toBe('name contains "ali"')
  })

  it('describes a flat group joined by its logic', () => {
    const node = group({
      logic: 'AND',
      children: [
        condition({ id: 'c1', field: 'name', operator: 'contains', value: 'ali' }),
        condition({ id: 'c2', field: 'age', operator: 'gt', value: 20 }),
      ],
    })
    expect(describeFilter(node, fieldConfig)).toBe('name contains "ali" and age > 20')
  })

  it('describes a root with one or more nested groups wrapped in parentheses', () => {
    const node = group({
      logic: 'OR',
      children: [
        condition({ id: 'c1', field: 'name', operator: 'contains', value: 'ali' }),
        group({
          id: 'g2',
          logic: 'AND',
          children: [condition({ id: 'c2', field: 'age', operator: 'gt', value: 20 })],
        }),
      ],
    })
    expect(describeFilter(node, fieldConfig)).toBe('name contains "ali" or (age > 20)')
  })

  it('returns a placeholder sentence for an empty root', () => {
    expect(describeFilter(group({ children: [] }), fieldConfig)).toBe('No filter applied')
  })
})

describe('describeMatchCount', () => {
  it('pluralizes for zero matches', () => {
    expect(describeMatchCount(0)).toBe('0 matches')
  })

  it('does not pluralize for exactly one match', () => {
    expect(describeMatchCount(1)).toBe('1 match')
  })

  it('pluralizes for more than one match', () => {
    expect(describeMatchCount(2)).toBe('2 matches')
  })
})

describe('createEmptyRoot', () => {
  it('creates an empty AND group with a generated id', () => {
    const root = createEmptyRoot()
    expect(root.kind).toBe('group')
    expect(root.logic).toBe('AND')
    expect(root.children).toEqual([])
    expect(typeof root.id).toBe('string')
    expect(root.id.length).toBeGreaterThan(0)
  })
})
