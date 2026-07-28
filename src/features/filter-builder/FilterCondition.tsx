import { fieldConfig } from './fieldConfig'
import type { Field, FilterCondition as FilterConditionType, Operator } from './types'
import { useConditionRow } from './useConditionRow'
import { ValueInput } from './ValueInput'

interface FilterConditionProps {
  condition: FilterConditionType
  onChange: (updated: FilterConditionType) => void
  onRemove: () => void
}

const FilterCondition = ({ condition, onChange, onRemove }: FilterConditionProps) => {
  const {
    config,
    valueKind,
    displayValue,
    validation,
    handleFieldChange,
    handleOperatorChange,
    handleValueChange,
  } = useConditionRow(condition, onChange)

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
          <ValueInput
            valueKind={valueKind}
            value={displayValue}
            onChange={handleValueChange}
            options={config.options}
          />
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
