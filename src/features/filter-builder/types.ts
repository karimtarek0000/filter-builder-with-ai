import type { ZodType } from 'zod'

export type ValueKind = 'text' | 'number' | 'select' | 'day' | 'month' | 'year' | 'none'

export interface OperatorConfig<TRow> {
  label: string
  valueKind: ValueKind
  options?: readonly string[]
  schema?: ZodType
  match: (row: TRow, value: unknown) => boolean
  describe: (value: unknown) => string
}

export interface FieldDef<TRow> {
  label: string
  operators: Record<string, OperatorConfig<TRow>>
}

export type FilterFieldConfig<TRow> = Record<string, FieldDef<TRow>>

export interface FilterCondition {
  id: string
  kind: 'condition'
  field: string
  operator: string
  value: string | number | undefined
}

export interface FilterGroup {
  id: string
  kind: 'group'
  logic: 'AND' | 'OR'
  children: FilterNode[]
}

export type FilterNode = FilterCondition | FilterGroup
