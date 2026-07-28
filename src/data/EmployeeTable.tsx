import type { Employee } from './employees'
import { formatHireDate, formatSalary } from './format'

interface EmployeeTableProps {
  employees: Employee[]
}

const EmployeeTable = ({ employees }: EmployeeTableProps) => {
  return (
    <table className="w-full border-collapse text-left">
      <thead className="relative sticky top-0 bg-white">
        <tr className="border-b border-gray-300">
          <th className="p-2">Name</th>
          <th className="p-2">Country</th>
          <th className="p-2">Salary</th>
          <th className="p-2">Active</th>
          <th className="p-2">Hire Date</th>
        </tr>
      </thead>
      <tbody>
        {employees.length === 0 ? (
          <tr>
            <td className="p-4 text-center text-gray-500" colSpan={5}>
              No data matching the filter
            </td>
          </tr>
        ) : (
          employees.map(employee => (
            <tr key={employee.id} className="border-b border-gray-100">
              <td className="p-2">{employee.name}</td>
              <td className="p-2">{employee.country}</td>
              <td className="p-2">{formatSalary(employee.salary)}</td>
              <td className="p-2">{employee.isActive ? 'Yes' : 'No'}</td>
              <td className="p-2">{formatHireDate(employee.hireDate)}</td>
            </tr>
          ))
        )}
      </tbody>
    </table>
  )
}

export default EmployeeTable
