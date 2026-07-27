import type { Country } from '../../data/employees'
import type { Field, Operator } from './types'

export type ValueKind = 'text' | 'number' | 'select' | 'day' | 'month' | 'year' | 'none'

export interface FieldConfig {
  label: string
  operators: Operator[]
  valueKindByOperator: Partial<Record<Operator, ValueKind>>
  options?: readonly Country[]
  describe: (operator: Operator, value: string | number | undefined) => string
}

export const COUNTRY_OPTIONS: readonly Country[] = ['EG', 'SA', 'AE', 'US', 'DE']

export const MONTH_OPTIONS: readonly { label: string; value: number }[] = [
  { label: 'January', value: 1 },
  { label: 'February', value: 2 },
  { label: 'March', value: 3 },
  { label: 'April', value: 4 },
  { label: 'May', value: 5 },
  { label: 'June', value: 6 },
  { label: 'July', value: 7 },
  { label: 'August', value: 8 },
  { label: 'September', value: 9 },
  { label: 'October', value: 10 },
  { label: 'November', value: 11 },
  { label: 'December', value: 12 },
]

export const fieldConfig: Record<Field, FieldConfig> = {
  name: {
    label: 'name',
    operators: ['contains', 'equals'],
    valueKindByOperator: { contains: 'text', equals: 'text' },
    describe: (operator, value) =>
      operator === 'equals' ? `name equals "${value ?? ''}"` : `name contains "${value ?? ''}"`,
  },
  country: {
    label: 'country',
    operators: ['is', 'is_not'],
    valueKindByOperator: { is: 'select', is_not: 'select' },
    options: COUNTRY_OPTIONS,
    describe: (operator, value) =>
      operator === 'is_not' ? `country is not ${value ?? ''}` : `country is ${value ?? ''}`,
  },
  salary: {
    label: 'salary',
    operators: ['gt', 'lt', 'eq'],
    valueKindByOperator: { gt: 'number', lt: 'number', eq: 'number' },
    describe: (operator, value) => {
      const symbol = operator === 'gt' ? '>' : operator === 'lt' ? '<' : '='
      return `salary ${symbol} ${value ?? ''}`
    },
  },
  isActive: {
    label: 'isActive',
    operators: ['is_true', 'is_false'],
    valueKindByOperator: { is_true: 'none', is_false: 'none' },
    describe: operator => (operator === 'is_true' ? 'isActive is true' : 'isActive is false'),
  },
  hireDate: {
    label: 'hireDate',
    operators: ['day_is', 'month_is', 'year_is'],
    valueKindByOperator: { day_is: 'day', month_is: 'month', year_is: 'year' },
    describe: (operator, value) => {
      if (operator === 'month_is') {
        const month = MONTH_OPTIONS.find(option => option.value === value)
        return `hire month is ${month?.label ?? ''}`
      }
      if (operator === 'year_is') {
        return `hire year is ${value ?? ''}`
      }
      return `hire day is ${value ?? ''}`
    },
  },
}

export const defaultOperatorForField = (field: Field): Operator => fieldConfig[field].operators[0]

export const valueKindForOperator = (field: Field, operator: Operator): ValueKind =>
  fieldConfig[field].valueKindByOperator[operator] ?? 'none'

const DEBOUNCE_BY_VALUE_KIND: Record<ValueKind, boolean> = {
  text: true,
  number: true,
  day: true,
  year: true,
  select: false,
  month: false,
  none: false,
}

export const isDebouncedValueKind = (kind: ValueKind): boolean => DEBOUNCE_BY_VALUE_KIND[kind]
