<<<<<<< HEAD
=======
import EmployeeTable from "./data/EmployeeTable"
import { employeeFieldConfig } from "./data/employeeFieldConfig"
import { employees } from "./data/employees"
>>>>>>> Advanced-Filter-Builder
import { FilterBuilder } from "./features/filter-builder"

const App = () => {
  return (
    <main>
<<<<<<< HEAD
      <FilterBuilder />
=======
      <FilterBuilder fieldConfig={employeeFieldConfig} data={employees}>
        {matchingRows => <EmployeeTable employees={matchingRows} />}
      </FilterBuilder>
>>>>>>> Advanced-Filter-Builder
    </main>
  )
}

export default App
