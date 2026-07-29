import { describe, expect, it } from 'vitest'
import { formatHireDate, formatSalary } from './format'

describe('formatSalary', () => {
  it('inserts a thousands separator', () => {
    expect(formatSalary(12500)).toBe('12,500')
  })

  it('renders whole numbers with no decimal places', () => {
    expect(formatSalary(4200.75)).toBe('4,201')
  })

  it('does not include a currency symbol', () => {
    expect(formatSalary(9800)).not.toMatch(/[$€£]/)
  })

  it('formats small numbers without a separator', () => {
    expect(formatSalary(500)).toBe('500')
  })
})

describe('formatHireDate', () => {
  it('formats a date as "D MMM YYYY"', () => {
    expect(formatHireDate('2020-06-15')).toBe('15 Jun 2020')
  })

  it('formats single-digit months and days correctly', () => {
    expect(formatHireDate('2015-01-05')).toBe('5 Jan 2015')
  })

  it('formats December correctly', () => {
    expect(formatHireDate('2022-12-09')).toBe('9 Dec 2022')
  })
})
