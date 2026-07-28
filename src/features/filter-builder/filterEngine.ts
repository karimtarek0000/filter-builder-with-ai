import type { Employee } from '../../data/employees'
import { fieldConfig } from './fieldConfig'
import type { FilterCondition, FilterGroup, FilterNode } from './types'
import { validateConditionValue } from './validation'

const evaluateCondition = (condition: FilterCondition, employee: Employee): boolean => {
  const { field, operator, value } = condition

  if (value === undefined && operator !== 'is_true' && operator !== 'is_false') {
    return true
  }

  if (!validateConditionValue(condition).valid) {
    return true
  }

  const actual = employee[field]

  switch (operator) {
    case 'contains':
      return String(actual).toLowerCase().includes(String(value).toLowerCase())
    case 'equals':
      return String(actual).toLowerCase() === String(value).toLowerCase()
    case 'is':
      return actual === value
    case 'is_not':
      return actual !== value
    case 'gt':
      return Number(actual) > Number(value)
    case 'lt':
      return Number(actual) < Number(value)
    case 'eq':
      return Number(actual) === Number(value)
    case 'is_true':
      return actual === true
    case 'is_false':
      return actual === false
    case 'day_is':
      return Number(String(actual).slice(8, 10)) === Number(value)
    case 'month_is':
      return Number(String(actual).slice(5, 7)) === Number(value)
    case 'year_is':
      return Number(String(actual).slice(0, 4)) === Number(value)
    default:
      return true
  }
}

export const evaluateNode = (node: FilterNode, employee: Employee): boolean => {
  if (node.kind === 'condition') {
    return evaluateCondition(node, employee)
  }

  if (node.children.length === 0) {
    return true
  }

  return node.logic === 'AND'
    ? node.children.every(child => evaluateNode(child, employee))
    : node.children.some(child => evaluateNode(child, employee))
}

export const filterEmployees = (root: FilterGroup, employees: Employee[]): Employee[] =>
  employees.filter(employee => evaluateNode(root, employee))

export const createEmptyFilter = (): FilterGroup => ({
  id: crypto.randomUUID(),
  kind: 'group',
  logic: 'AND',
  children: [],
})

export const describeMatchCount = (count: number): string =>
  `${count} match${count === 1 ? '' : 'es'}`

export const describeFilter = (node: FilterNode): string => {
  if (node.kind === 'condition') {
    return fieldConfig[node.field].describe(node.operator, node.value)
  }

  if (node.children.length === 0) {
    return 'No filter applied'
  }

  const joiner = node.logic === 'AND' ? ' and ' : ' or '

  return node.children
    .map(child => (child.kind === 'group' ? `(${describeFilter(child)})` : describeFilter(child)))
    .join(joiner)
}
