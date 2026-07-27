import {
  MONTH_OPTIONS,
  defaultOperatorForField,
  fieldConfig,
  isDebouncedValueKind,
  valueKindForOperator,
} from './fieldConfig'
import type { Field, FilterCondition as FilterConditionType, Operator } from './types'
import { useDebouncedValue } from './useDebouncedValue'
import { validateConditionValue } from './validation'

const DEBOUNCE_MS = 700

interface FilterConditionProps {
  condition: FilterConditionType
  onChange: (updated: FilterConditionType) => void
  onRemove: () => void
}

const FilterCondition = ({ condition, onChange, onRemove }: FilterConditionProps) => {
  const config = fieldConfig[condition.field]
  const valueKind = valueKindForOperator(condition.field, condition.operator)
  const debounced = isDebouncedValueKind(valueKind)

  const [localValue, setLocalValue] = useDebouncedValue(
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
    onChange({ ...condition, operator })
  }

  const handleValueChange = (value: string | number | undefined) => {
    if (debounced) {
      setLocalValue(value)
    } else {
      onChange({ ...condition, value })
    }
  }

  return (
    <div className="flex flex-col gap-1">
      <div className="grid grid-cols-1 gap-2 md:grid-cols-[10rem_8rem_12rem_5rem] md:items-center">
        <select
          className="border border-gray-300 p-1"
          value={condition.field}
          onChange={e => handleFieldChange(e.target.value as Field)}
        >
          {(Object.keys(fieldConfig) as Field[]).map(field => (
            <option key={field} value={field}>
              {fieldConfig[field].label}
            </option>
          ))}
        </select>

        <select
          className="border border-gray-300 p-1"
          value={condition.operator}
          onChange={e => handleOperatorChange(e.target.value as Operator)}
        >
          {config.operators.map(operator => (
            <option key={operator} value={operator}>
              {operator}
            </option>
          ))}
        </select>

        <div>
          {valueKind === 'text' && (
            <input
              className="border border-gray-300 p-1 w-full"
              type="text"
              value={typeof displayValue === 'string' ? displayValue : ''}
              onChange={e => handleValueChange(e.target.value)}
            />
          )}

          {valueKind === 'number' && (
            <input
              className="border border-gray-300 p-1 w-full"
              type="text"
              inputMode="decimal"
              value={displayValue ?? ''}
              onChange={e => handleValueChange(e.target.value === '' ? undefined : e.target.value)}
            />
          )}

          {valueKind === 'select' && (
            <select
              className="border border-gray-300 p-1 w-full"
              value={typeof condition.value === 'string' ? condition.value : ''}
              onChange={e => handleValueChange(e.target.value === '' ? undefined : e.target.value)}
            >
              <option value="">Select...</option>
              {config.options?.map(option => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          )}

          {valueKind === 'day' && (
            <input
              className="border border-gray-300 p-1 w-full"
              type="text"
              inputMode="numeric"
              value={displayValue ?? ''}
              onChange={e => handleValueChange(e.target.value === '' ? undefined : e.target.value)}
            />
          )}

          {valueKind === 'month' && (
            <select
              className="border border-gray-300 p-1 w-full"
              value={typeof condition.value === 'number' ? condition.value : ''}
              onChange={e =>
                handleValueChange(e.target.value === '' ? undefined : Number(e.target.value))
              }
            >
              <option value="">Select...</option>
              {MONTH_OPTIONS.map(month => (
                <option key={month.value} value={month.value}>
                  {month.label}
                </option>
              ))}
            </select>
          )}

          {valueKind === 'year' && (
            <input
              className="border border-gray-300 p-1 w-full"
              type="text"
              inputMode="numeric"
              value={displayValue ?? ''}
              onChange={e => handleValueChange(e.target.value === '' ? undefined : e.target.value)}
            />
          )}
        </div>

        <button type="button" className="text-red-600 justify-self-start" onClick={onRemove}>
          Remove
        </button>
      </div>

      {displayValue && !validation.valid && (
        <span className="text-red-600 text-sm">{validation.error}</span>
      )}
    </div>
  )
}

export default FilterCondition
