import { useDebouncedCommit } from '../../hooks'
import {
  defaultOperatorForField,
  fieldConfig,
  isDebouncedValueKind,
  valueKindForOperator,
} from './fieldConfig'
import type { Field, FilterCondition, Operator } from './types'
import { validateConditionValue } from './validation'

const DEBOUNCE_MS = 700

export const useConditionRow = (
  condition: FilterCondition,
  onChange: (updated: FilterCondition) => void,
) => {
  const config = fieldConfig[condition.field]
  const valueKind = valueKindForOperator(condition.field, condition.operator)
  const debounced = isDebouncedValueKind(valueKind)

  const [localValue, setLocalValue] = useDebouncedCommit(
    condition.value,
    value => onChange({ ...condition, value }),
    DEBOUNCE_MS,
  )

  const displayValue = debounced ? localValue : condition.value
  const validation = validateConditionValue({ ...condition, value: displayValue })

  const handleFieldChange = (field: Field) => {
    onChange({ ...condition, field, operator: defaultOperatorForField(field), value: undefined })
  }

  const handleOperatorChange = (operator: Operator) => {
    const kindChanged = valueKindForOperator(condition.field, operator) !== valueKind
    onChange({ ...condition, operator, value: kindChanged ? undefined : condition.value })
  }

  const handleValueChange = (value: string | number | undefined) => {
    if (debounced) {
      setLocalValue(value)
    } else {
      onChange({ ...condition, value })
    }
  }

  return {
    config,
    valueKind,
    displayValue,
    validation,
    handleFieldChange,
    handleOperatorChange,
    handleValueChange,
  }
}
