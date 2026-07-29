import { z } from 'zod'
import type { FilterFieldConfig } from '../features/filter-builder'
import type { Country, Employee } from './employees'

const COUNTRY_OPTIONS: readonly Country[] = ['EG', 'SA', 'AE', 'US', 'DE']

const MONTH_LABELS = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
]

const nonEmptyString = z.string().trim().min(1, 'Value is required')

const nonNegativeNumber = z.coerce.number('Must be a number').nonnegative('Must be 0 or greater')

const dayNumber = z.coerce
  .number('Must be a number')
  .int('Must be a whole number')
  .min(1, 'Day must be between 1 and 31')
  .max(31, 'Day must be between 1 and 31')

const monthNumber = z.coerce
  .number('Must be a number')
  .int('Must be a whole number')
  .min(1, 'Month must be between 1 and 12')
  .max(12, 'Month must be between 1 and 12')

const yearNumber = z.coerce
  .number('Must be a number')
  .int('Must be a whole number')
  .min(1000, 'Year must be a 4-digit number')
  .max(9999, 'Year must be a 4-digit number')

const countryEnum = z.enum(COUNTRY_OPTIONS)

export const employeeFieldConfig: FilterFieldConfig<Employee> = {
  name: {
    label: 'name',
    operators: {
      contains: {
        label: 'contains',
        valueKind: 'text',
        schema: nonEmptyString,
        match: (employee, value) =>
          employee.name.toLowerCase().includes(String(value).toLowerCase()),
        describe: value => `name contains "${value ?? ''}"`,
      },
      equals: {
        label: 'equals',
        valueKind: 'text',
        schema: nonEmptyString,
        match: (employee, value) => employee.name.toLowerCase() === String(value).toLowerCase(),
        describe: value => `name equals "${value ?? ''}"`,
      },
    },
  },
  country: {
    label: 'country',
    operators: {
      is: {
        label: 'is',
        valueKind: 'select',
        options: COUNTRY_OPTIONS,
        schema: countryEnum,
        match: (employee, value) => employee.country === value,
        describe: value => `country is ${value ?? ''}`,
      },
      is_not: {
        label: 'is_not',
        valueKind: 'select',
        options: COUNTRY_OPTIONS,
        schema: countryEnum,
        match: (employee, value) => employee.country !== value,
        describe: value => `country is not ${value ?? ''}`,
      },
    },
  },
  salary: {
    label: 'salary',
    operators: {
      gt: {
        label: 'gt',
        valueKind: 'number',
        schema: nonNegativeNumber,
        match: (employee, value) => employee.salary > Number(value),
        describe: value => `salary > ${value ?? ''}`,
      },
      lt: {
        label: 'lt',
        valueKind: 'number',
        schema: nonNegativeNumber,
        match: (employee, value) => employee.salary < Number(value),
        describe: value => `salary < ${value ?? ''}`,
      },
      eq: {
        label: 'eq',
        valueKind: 'number',
        schema: nonNegativeNumber,
        match: (employee, value) => employee.salary === Number(value),
        describe: value => `salary = ${value ?? ''}`,
      },
    },
  },
  isActive: {
    label: 'isActive',
    operators: {
      is_true: {
        label: 'is_true',
        valueKind: 'none',
        match: employee => employee.isActive === true,
        describe: () => 'isActive is true',
      },
      is_false: {
        label: 'is_false',
        valueKind: 'none',
        match: employee => employee.isActive === false,
        describe: () => 'isActive is false',
      },
    },
  },
  hireDate: {
    label: 'hireDate',
    operators: {
      day_is: {
        label: 'day_is',
        valueKind: 'day',
        schema: dayNumber,
        match: (employee, value) => Number(employee.hireDate.slice(8, 10)) === Number(value),
        describe: value => `hire day is ${value ?? ''}`,
      },
      month_is: {
        label: 'month_is',
        valueKind: 'month',
        schema: monthNumber,
        match: (employee, value) => Number(employee.hireDate.slice(5, 7)) === Number(value),
        describe: value => `hire month is ${MONTH_LABELS[Number(value) - 1] ?? ''}`,
      },
      year_is: {
        label: 'year_is',
        valueKind: 'year',
        schema: yearNumber,
        match: (employee, value) => Number(employee.hireDate.slice(0, 4)) === Number(value),
        describe: value => `hire year is ${value ?? ''}`,
      },
    },
  },
}
