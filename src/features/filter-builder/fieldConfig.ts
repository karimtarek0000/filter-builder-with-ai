import type { FilterFieldConfig, ValueKind } from './types'

export const defaultOperatorForField = <TRow>(fieldConfig: FilterFieldConfig<TRow>, field: string): string =>
  Object.keys(fieldConfig[field].operators)[0]

export const valueKindForOperator = <TRow>(
  fieldConfig: FilterFieldConfig<TRow>,
  field: string,
  operator: string,
): ValueKind => fieldConfig[field]?.operators[operator]?.valueKind ?? 'none'

const DEBOUNCE_MS_BY_VALUE_KIND: Record<ValueKind, number> = {
  text: 700,
  number: 700,
  day: 700,
  year: 700,
  select: 0,
  month: 0,
  none: 0,
}

export const debounceMsForValueKind = (kind: ValueKind): number => DEBOUNCE_MS_BY_VALUE_KIND[kind]
