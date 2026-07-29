import type { FilterCondition, FilterFieldConfig, FilterGroup, FilterNode } from './types'
import { validateConditionValue } from './validation'

const bytesToBase64 = (bytes: Uint8Array): string => {
  let binary = ''
  bytes.forEach(byte => (binary += String.fromCharCode(byte)))
  return btoa(binary)
}

const base64ToBytes = (base64: string): Uint8Array => {
  const binary = atob(base64)
  return Uint8Array.from(binary, char => char.charCodeAt(0))
}

const dropInvalidConditions = <TRow>(
  node: FilterNode,
  fieldConfig: FilterFieldConfig<TRow>,
): FilterNode | null => {
  if (node.kind === 'condition') {
    return validateConditionValue(node, fieldConfig).valid ? node : null
  }

  const children = node.children
    .map(child => dropInvalidConditions(child, fieldConfig))
    .filter((child): child is FilterNode => child !== null)

  return { ...node, children }
}

export const encodeFilterToParam = <TRow>(
  root: FilterGroup,
  fieldConfig: FilterFieldConfig<TRow>,
): string => {
  const cleaned = dropInvalidConditions(root, fieldConfig) as FilterGroup
  const bytes = new TextEncoder().encode(JSON.stringify(cleaned))
  return bytesToBase64(bytes).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

const isField = <TRow>(value: unknown, fieldConfig: FilterFieldConfig<TRow>): value is string =>
  typeof value === 'string' && value in fieldConfig

const parseCondition = <TRow>(
  record: Record<string, unknown>,
  fieldConfig: FilterFieldConfig<TRow>,
): FilterCondition | null => {
  const { id, field, operator, value } = record

  if (typeof id !== 'string' || !isField(field, fieldConfig)) {
    return null
  }
  if (typeof operator !== 'string' || !(operator in fieldConfig[field].operators)) {
    return null
  }
  if (value !== undefined && typeof value !== 'string' && typeof value !== 'number') {
    return null
  }

  return { id, kind: 'condition', field, operator, value }
}

const parseGroup = <TRow>(
  record: Record<string, unknown>,
  depth: number,
  fieldConfig: FilterFieldConfig<TRow>,
): FilterGroup | null => {
  const { id, logic, children } = record

  if (typeof id !== 'string' || (logic !== 'AND' && logic !== 'OR') || !Array.isArray(children)) {
    return null
  }

  const parsedChildren: FilterNode[] = []

  for (const child of children) {
    const parsedChild = parseNode(child, depth + 1, fieldConfig)
    if (parsedChild === null) {
      return null
    }
    if (parsedChild.kind === 'group' && depth !== 1) {
      return null
    }
    parsedChildren.push(parsedChild)
  }

  return { id, kind: 'group', logic, children: parsedChildren }
}

const parseNode = <TRow>(
  value: unknown,
  depth: number,
  fieldConfig: FilterFieldConfig<TRow>,
): FilterNode | null => {
  if (typeof value !== 'object' || value === null) {
    return null
  }
  const record = value as Record<string, unknown>
  if (record.kind === 'condition') {
    return parseCondition(record, fieldConfig)
  }
  if (record.kind === 'group') {
    return parseGroup(record, depth, fieldConfig)
  }
  return null
}

export const decodeFilterFromParam = <TRow>(
  raw: string | null,
  fieldConfig: FilterFieldConfig<TRow>,
): FilterGroup | null => {
  if (!raw) {
    return null
  }

  try {
    const base64 = raw.replace(/-/g, '+').replace(/_/g, '/')
    const padded = base64 + '='.repeat((4 - (base64.length % 4)) % 4)
    const json = new TextDecoder().decode(base64ToBytes(padded))
    const parsed: unknown = JSON.parse(json)
    const result = parseNode(parsed, 1, fieldConfig)
    return result !== null && result.kind === 'group' ? result : null
  } catch {
    return null
  }
}
