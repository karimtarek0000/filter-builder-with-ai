import { employees } from '../../data/employees'
import EmployeeTable from './EmployeeTable'
import { describeFilter, describeMatchCount, filterEmployees } from './filterEngine'
import FilterGroup from './FilterGroup'
import { createEmptyRoot, useFilterUrlSync } from './useFilterUrlSync'

const FilterBuilder = () => {
  const [root, setRoot] = useFilterUrlSync()

  const visibleEmployees = filterEmployees(root, employees)

  return (
    <div className="flex flex-col gap-4 p-4">
      <div className="flex items-center justify-between">
        <h4 className="font-bold">Filter</h4>
        <button
          type="button"
          className="border border-gray-400 px-2 py-1"
          aria-label="Clear all filters"
          onClick={() => setRoot(createEmptyRoot())}
        >
          Clear All
        </button>
      </div>

      <FilterGroup group={root} isRoot={true} onChange={setRoot} />

      <p className="text-gray-700 text-center">
        {describeFilter(root)} ({describeMatchCount(visibleEmployees.length)})
      </p>

      <EmployeeTable employees={visibleEmployees} />
    </div>
  )
}

export default FilterBuilder
