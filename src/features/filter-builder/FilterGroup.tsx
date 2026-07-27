import { defaultOperatorForField } from './fieldConfig'
import FilterCondition from './FilterCondition'
import type {
  FilterCondition as FilterConditionType,
  FilterGroup as FilterGroupType,
  FilterNode,
} from './types'

interface FilterGroupProps {
  group: FilterGroupType
  isRoot: boolean
  onChange: (updated: FilterGroupType) => void
  onRemove?: () => void
}

const createCondition = (): FilterConditionType => ({
  id: crypto.randomUUID(),
  kind: 'condition',
  field: 'name',
  operator: defaultOperatorForField('name'),
  value: undefined,
})

const createGroup = (): FilterGroupType => ({
  id: crypto.randomUUID(),
  kind: 'group',
  logic: 'AND',
  children: [],
})

const FilterGroup = ({ group, isRoot, onChange, onRemove }: FilterGroupProps) => {
  const hasNestedGroup = group.children.some(child => child.kind === 'group')

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
    onChange({ ...group, children: [...group.children, createCondition()] })
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
        <button type="button" className="border border-gray-400 px-2 py-1" onClick={toggleLogic}>
          {group.logic}
        </button>
        {onRemove && (
          <button type="button" className="text-red-600" onClick={onRemove}>
            Remove group
          </button>
        )}
      </div>

      {group.children.map(child =>
        child.kind === 'condition' ? (
          <FilterCondition
            key={child.id}
            condition={child}
            onChange={updated => updateChild(child.id, updated)}
            onRemove={() => removeChild(child.id)}
          />
        ) : (
          <FilterGroup
            key={child.id}
            group={child}
            isRoot={false}
            onChange={updated => updateChild(child.id, updated)}
            onRemove={() => removeChild(child.id)}
          />
        ),
      )}

      <div className="flex gap-2">
        <button type="button" className="border border-gray-400 px-2 py-1" onClick={addCondition}>
          Add condition
        </button>

        {isRoot && !hasNestedGroup && (
          <button
            type="button"
            className="border border-gray-400 px-2 py-1"
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
