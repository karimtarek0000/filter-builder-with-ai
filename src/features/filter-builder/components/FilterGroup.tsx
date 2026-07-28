import { defaultOperatorForField } from '../fieldConfig'
import type {
  FilterCondition as FilterConditionType,
  FilterFieldConfig,
  FilterGroup as FilterGroupType,
  FilterNode,
} from '../types'
import FilterCondition from './FilterCondition'

interface FilterGroupProps<TRow> {
  group: FilterGroupType
  isRoot: boolean
  fieldConfig: FilterFieldConfig<TRow>
  onChange: (updated: FilterGroupType) => void
  onRemove?: () => void
}

const createCondition = <TRow,>(fieldConfig: FilterFieldConfig<TRow>): FilterConditionType => {
  const field = Object.keys(fieldConfig)[0]
  return {
    id: crypto.randomUUID(),
    kind: 'condition',
    field,
    operator: defaultOperatorForField(fieldConfig, field),
    value: undefined,
  }
}

const createGroup = (): FilterGroupType => ({
  id: crypto.randomUUID(),
  kind: 'group',
  logic: 'AND',
  children: [],
})

const FilterGroup = <TRow,>({ group, isRoot, fieldConfig, onChange, onRemove }: FilterGroupProps<TRow>) => {
  const updateChild = (id: string, updated: FilterNode) => {
    onChange({
      ...group,
      children: group.children.map(child => (child.id === id ? updated : child)),
    })
  }

  const removeChild = (id: string) => {
    onChange({ ...group, children: group.children.filter(child => child.id !== id) })
  }

  const addCondition = () => {
    onChange({ ...group, children: [...group.children, createCondition(fieldConfig)] })
  }

  const addNestedGroup = () => {
    onChange({ ...group, children: [...group.children, createGroup()] })
  }

  const toggleLogic = () => {
    onChange({ ...group, logic: group.logic === 'AND' ? 'OR' : 'AND' })
  }

  return (
    <div
      className={
        isRoot
          ? 'flex flex-col gap-2 border border-gray-300 p-3'
          : 'flex flex-col gap-2 border border-gray-300 border-l-4 border-l-blue-400 bg-blue-50/40 p-3 ml-2'
      }
    >
      <div className="flex items-center gap-2">
        <button
          type="button"
          className="border border-gray-400 px-2 py-1"
          aria-label={`Group logic: ${group.logic}, click to toggle`}
          onClick={toggleLogic}
        >
          {group.logic}
        </button>
        {onRemove && (
          <button
            type="button"
            className="text-red-600"
            aria-label="Remove nested group"
            onClick={onRemove}
          >
            Remove group
          </button>
        )}
      </div>

      {group.children.map(child =>
        child.kind === 'condition' ? (
          <FilterCondition
            key={child.id}
            condition={child}
            fieldConfig={fieldConfig}
            onChange={updated => updateChild(child.id, updated)}
            onRemove={() => removeChild(child.id)}
          />
        ) : (
          <FilterGroup
            key={child.id}
            group={child}
            isRoot={false}
            fieldConfig={fieldConfig}
            onChange={updated => updateChild(child.id, updated)}
            onRemove={() => removeChild(child.id)}
          />
        ),
      )}

      <div className="flex gap-2">
        <button
          type="button"
          className="border border-gray-400 px-2 py-1"
          aria-label="Add condition"
          onClick={addCondition}
        >
          Add condition
        </button>

        {isRoot && (
          <button
            type="button"
            className="border border-gray-400 px-2 py-1"
            aria-label="Add nested group"
            onClick={addNestedGroup}
          >
            Add group
          </button>
        )}
      </div>
    </div>
  )
}

export default FilterGroup
