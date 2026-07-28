const MONTH_ABBREVIATIONS = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec',
]

const salaryFormatter = new Intl.NumberFormat(undefined, { maximumFractionDigits: 0 })

export const formatSalary = (salary: number): string => salaryFormatter.format(salary)

export const formatHireDate = (hireDate: string): string => {
  const year = hireDate.slice(0, 4)
  const month = Number(hireDate.slice(5, 7))
  const day = Number(hireDate.slice(8, 10))
  return `${day} ${MONTH_ABBREVIATIONS[month - 1]} ${year}`
}
