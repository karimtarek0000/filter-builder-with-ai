import type { FilterCondition as FilterConditionType, FilterFieldConfig } from '../types'
import { useConditionRow } from '../hooks'
import { ValueInput } from './ValueInput'

interface FilterConditionProps<TRow> {
  condition: FilterConditionType
  fieldConfig: FilterFieldConfig<TRow>
  onChange: (updated: FilterConditionType) => void
  onRemove: () => void
}

const FilterCondition = <TRow,>({ condition, fieldConfig, onChange, onRemove }: FilterConditionProps<TRow>) => {
  const {
    fieldDef,
    operatorConfig,
    valueKind,
    displayValue,
    validation,
    handleFieldChange,
    handleOperatorChange,
    handleValueChange,
  } = useConditionRow(condition, fieldConfig, onChange)

  return (
    <div className="flex flex-col gap-1">
      <div className="grid grid-cols-1 gap-2 md:grid-cols-[10rem_8rem_12rem_5rem] md:items-center">
        <select
          className="border border-gray-300 p-1"
          aria-label="Field"
          value={condition.field}
          onChange={e => handleFieldChange(e.target.value)}
        >
          {Object.entries(fieldConfig).map(([field, def]) => (
            <option key={field} value={field}>
              {def.label}
            </option>
          ))}
        </select>

        <select
          className="border border-gray-300 p-1"
          aria-label="Operator"
          value={condition.operator}
          onChange={e => handleOperatorChange(e.target.value)}
        >
          {Object.entries(fieldDef.operators).map(([operator, def]) => (
            <option key={operator} value={operator}>
              {def.label}
            </option>
          ))}
        </select>

        <div>
          <ValueInput
            valueKind={valueKind}
            value={displayValue}
            onChange={handleValueChange}
            options={operatorConfig.options}
          />
        </div>

        <button
          type="button"
          className="text-red-600 justify-self-start"
          aria-label="Remove condition"
          onClick={onRemove}
        >
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
