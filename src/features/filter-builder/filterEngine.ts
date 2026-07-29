import type { FilterCondition, FilterFieldConfig, FilterGroup, FilterNode } from './types'
import { validateConditionValue } from './validation'

const evaluateCondition = <TRow>(
  condition: FilterCondition,
  row: TRow,
  fieldConfig: FilterFieldConfig<TRow>,
): boolean => {
  const operatorConfig = fieldConfig[condition.field]?.operators[condition.operator]

  if (!operatorConfig) {
    return true
  }

  if (condition.value === undefined && operatorConfig.valueKind !== 'none') {
    return true
  }

  if (!validateConditionValue(condition, fieldConfig).valid) {
    return true
  }

  return operatorConfig.match(row, condition.value)
}

export const evaluateNode = <TRow>(
  node: FilterNode,
  row: TRow,
  fieldConfig: FilterFieldConfig<TRow>,
): boolean => {
  if (node.kind === 'condition') {
    return evaluateCondition(node, row, fieldConfig)
  }

  if (node.children.length === 0) {
    return true
  }

  return node.logic === 'AND'
    ? node.children.every(child => evaluateNode(child, row, fieldConfig))
    : node.children.some(child => evaluateNode(child, row, fieldConfig))
}

export const filterRows = <TRow>(
  root: FilterGroup,
  data: TRow[],
  fieldConfig: FilterFieldConfig<TRow>,
): TRow[] => data.filter(row => evaluateNode(root, row, fieldConfig))

export const describeMatchCount = (count: number): string =>
  `${count} match${count === 1 ? '' : 'es'}`

export const describeFilter = <TRow>(
  node: FilterNode,
  fieldConfig: FilterFieldConfig<TRow>,
): string => {
  if (node.kind === 'condition') {
    const operatorConfig = fieldConfig[node.field]?.operators[node.operator]
    return operatorConfig ? operatorConfig.describe(node.value) : ''
  }

  if (node.children.length === 0) {
    return 'No filter applied'
  }

  const joiner = node.logic === 'AND' ? ' and ' : ' or '

  return node.children
    .map(child =>
      child.kind === 'group'
        ? `(${describeFilter(child, fieldConfig)})`
        : describeFilter(child, fieldConfig),
    )
    .join(joiner)
}
