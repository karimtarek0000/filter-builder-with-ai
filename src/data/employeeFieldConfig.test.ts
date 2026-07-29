import { describe, expect, it } from 'vitest'
import { employeeFieldConfig } from './employeeFieldConfig'
import type { Employee } from './employees'

const baseEmployee: Employee = {
  id: '1',
  name: 'Amir Hassan',
  country: 'EG',
  salary: 5000,
  isActive: true,
  hireDate: '2020-06-15',
}

describe('employeeFieldConfig field/operator shape', () => {
  it('exposes contains and equals for name', () => {
    expect(Object.keys(employeeFieldConfig.name.operators)).toEqual(['contains', 'equals'])
  })

  it('exposes is and is_not for country', () => {
    expect(Object.keys(employeeFieldConfig.country.operators)).toEqual(['is', 'is_not'])
  })

  it('exposes gt, lt, eq for salary', () => {
    expect(Object.keys(employeeFieldConfig.salary.operators)).toEqual(['gt', 'lt', 'eq'])
  })

  it('exposes is_true and is_false for isActive', () => {
    expect(Object.keys(employeeFieldConfig.isActive.operators)).toEqual(['is_true', 'is_false'])
  })

  it('exposes day_is, month_is, year_is for hireDate', () => {
    expect(Object.keys(employeeFieldConfig.hireDate.operators)).toEqual([
      'day_is',
      'month_is',
      'year_is',
    ])
  })
})

describe('name operators', () => {
  it('contains matches case-insensitively', () => {
    const op = employeeFieldConfig.name.operators.contains
    expect(op.match(baseEmployee, 'amir')).toBe(true)
    expect(op.match(baseEmployee, 'zzz')).toBe(false)
    expect(op.describe('amir')).toBe('name contains "amir"')
    expect(op.schema?.safeParse('').success).toBe(false)
    expect(op.schema?.safeParse('amir').success).toBe(true)
  })

  it('equals matches case-insensitively on full string', () => {
    const op = employeeFieldConfig.name.operators.equals
    expect(op.match(baseEmployee, 'amir hassan')).toBe(true)
    expect(op.match(baseEmployee, 'amir')).toBe(false)
    expect(op.describe('Amir Hassan')).toBe('name equals "Amir Hassan"')
  })
})

describe('country operators', () => {
  it('is matches exact country', () => {
    const op = employeeFieldConfig.country.operators.is
    expect(op.match(baseEmployee, 'EG')).toBe(true)
    expect(op.match(baseEmployee, 'SA')).toBe(false)
    expect(op.describe('EG')).toBe('country is EG')
    expect(op.schema?.safeParse('EG').success).toBe(true)
    expect(op.schema?.safeParse('FR').success).toBe(false)
  })

  it('is_not matches any other country', () => {
    const op = employeeFieldConfig.country.operators.is_not
    expect(op.match(baseEmployee, 'SA')).toBe(true)
    expect(op.match(baseEmployee, 'EG')).toBe(false)
    expect(op.describe('SA')).toBe('country is not SA')
  })
})

describe('salary operators', () => {
  it('gt/lt/eq compare numerically', () => {
    expect(employeeFieldConfig.salary.operators.gt.match(baseEmployee, 4000)).toBe(true)
    expect(employeeFieldConfig.salary.operators.gt.match(baseEmployee, 6000)).toBe(false)
    expect(employeeFieldConfig.salary.operators.lt.match(baseEmployee, 6000)).toBe(true)
    expect(employeeFieldConfig.salary.operators.eq.match(baseEmployee, 5000)).toBe(true)
  })

  it('describes each comparison', () => {
    expect(employeeFieldConfig.salary.operators.gt.describe(4000)).toBe('salary > 4000')
    expect(employeeFieldConfig.salary.operators.lt.describe(6000)).toBe('salary < 6000')
    expect(employeeFieldConfig.salary.operators.eq.describe(5000)).toBe('salary = 5000')
  })

  it('schema rejects negative salaries', () => {
    expect(employeeFieldConfig.salary.operators.gt.schema?.safeParse(-1).success).toBe(false)
    expect(employeeFieldConfig.salary.operators.gt.schema?.safeParse(0).success).toBe(true)
  })
})

describe('isActive operators', () => {
  it('is_true/is_false match boolean state and ignore value', () => {
    expect(employeeFieldConfig.isActive.operators.is_true.match(baseEmployee, undefined)).toBe(true)
    expect(employeeFieldConfig.isActive.operators.is_false.match(baseEmployee, undefined)).toBe(
      false,
    )
    expect(employeeFieldConfig.isActive.operators.is_true.describe(undefined)).toBe(
      'isActive is true',
    )
    expect(employeeFieldConfig.isActive.operators.is_false.describe(undefined)).toBe(
      'isActive is false',
    )
  })
})

describe('hireDate operators independently slice day/month/year', () => {
  it('day_is compares only the day segment', () => {
    const op = employeeFieldConfig.hireDate.operators.day_is
    expect(op.match(baseEmployee, 15)).toBe(true)
    expect(op.match(baseEmployee, 1)).toBe(false)
    expect(op.describe(15)).toBe('hire day is 15')
    expect(op.schema?.safeParse(32).success).toBe(false)
  })

  it('month_is compares only the month segment and describes with a label', () => {
    const op = employeeFieldConfig.hireDate.operators.month_is
    expect(op.match(baseEmployee, 6)).toBe(true)
    expect(op.match(baseEmployee, 1)).toBe(false)
    expect(op.describe(6)).toBe('hire month is June')
    expect(op.schema?.safeParse(13).success).toBe(false)
  })

  it('year_is compares only the year segment', () => {
    const op = employeeFieldConfig.hireDate.operators.year_is
    expect(op.match(baseEmployee, 2020)).toBe(true)
    expect(op.match(baseEmployee, 1999)).toBe(false)
    expect(op.describe(2020)).toBe('hire year is 2020')
    expect(op.schema?.safeParse(999).success).toBe(false)
  })
})
