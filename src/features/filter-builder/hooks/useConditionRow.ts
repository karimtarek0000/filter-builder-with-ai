import { useDebouncedCommit } from '../../../hooks'
import { debounceMsForValueKind, defaultOperatorForField, valueKindForOperator } from '../fieldConfig'
import type { FilterCondition, FilterFieldConfig } from '../types'
import { validateConditionValue } from '../validation'

export const useConditionRow = <TRow>(
  condition: FilterCondition,
  fieldConfig: FilterFieldConfig<TRow>,
  onChange: (updated: FilterCondition) => void,
) => {
  const fieldDef = fieldConfig[condition.field]
  const operatorConfig = fieldDef.operators[condition.operator]
  const valueKind = valueKindForOperator(fieldConfig, condition.field, condition.operator)

  const [localValue, setLocalValue] = useDebouncedCommit(
    condition.value,
    value => onChange({ ...condition, value }),
    debounceMsForValueKind(valueKind),
  )

  const displayValue = localValue
  const validation = validateConditionValue({ ...condition, value: displayValue }, fieldConfig)

  const handleFieldChange = (field: string) => {
    onChange({
      ...condition,
      field,
      operator: defaultOperatorForField(fieldConfig, field),
      value: undefined,
    })
  }

  const handleOperatorChange = (operator: string) => {
    const kindChanged = valueKindForOperator(fieldConfig, condition.field, operator) !== valueKind
    onChange({ ...condition, operator, value: kindChanged ? undefined : condition.value })
  }

  const handleValueChange = setLocalValue

  return {
    fieldDef,
    operatorConfig,
    valueKind,
    displayValue,
    validation,
    handleFieldChange,
    handleOperatorChange,
    handleValueChange,
  }
}
