import EmployeeTable from "./data/EmployeeTable"
import { employeeFieldConfig } from "./data/employeeFieldConfig"
import { employees } from "./data/employees"
import { FilterBuilder } from "./features/filter-builder"

const App = () => {
  return (
    <main>
      <FilterBuilder fieldConfig={employeeFieldConfig} data={employees}>
        {matchingRows => <EmployeeTable employees={matchingRows} />}
      </FilterBuilder>
    </main>
  )
}

export default App
