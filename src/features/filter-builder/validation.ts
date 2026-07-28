import type { FilterCondition, FilterFieldConfig } from './types'

export type ValidationResult = { valid: true } | { valid: false; error: string }

export const validateConditionValue = <TRow>(
  condition: FilterCondition,
  fieldConfig: FilterFieldConfig<TRow>,
): ValidationResult => {
  const schema = fieldConfig[condition.field]?.operators[condition.operator]?.schema
  if (!schema) {
    return { valid: true }
  }

  const result = schema.safeParse(condition.value)

  if (result.success) {
    return { valid: true }
  }

  return { valid: false, error: result.error.issues[0]?.message ?? 'Invalid value' }
}
