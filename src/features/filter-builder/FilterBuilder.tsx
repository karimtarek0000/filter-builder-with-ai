import { employees } from '../../data/employees'
import EmployeeTable from './EmployeeTable'
import { filterEmployees } from './filterEngine'
import FilterGroup from './FilterGroup'
import { useFilterUrlSync } from './useFilterUrlSync'

const FilterBuilder = () => {
  const [root, setRoot] = useFilterUrlSync()

  const visibleEmployees = filterEmployees(root, employees)

  return (
    <div className="flex flex-col gap-4 p-4">
      <h4 className="font-bold">Filter</h4>

      <FilterGroup group={root} isRoot={true} onChange={setRoot} />

      <p className="text-gray-700 text-center">
        Showing all employees ({visibleEmployees.length} match
        {visibleEmployees.length === 1 ? '' : 'es'})
      </p>

      <EmployeeTable employees={visibleEmployees} />
    </div>
  )
}

export default FilterBuilder
