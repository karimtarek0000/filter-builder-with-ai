import { describe, expect, it } from 'vitest'
import { employeeFieldConfig } from '../../data/employeeFieldConfig'
import { validateConditionValue } from './validation'
import type { FilterCondition } from './types'

const condition = (overrides: Partial<FilterCondition>): FilterCondition => ({
  id: 'c1',
  kind: 'condition',
  field: 'name',
  operator: 'contains',
  value: undefined,
  ...overrides,
})

describe('validateConditionValue', () => {
  it('returns invalid for an undefined value against a schema that requires one (vacuous handling happens in evaluateNode, not here)', () => {
    const result = validateConditionValue(
      condition({ field: 'salary', operator: 'gt', value: undefined }),
      employeeFieldConfig,
    )
    expect(result.valid).toBe(false)
  })

  it('returns valid when no schema is registered for the field/operator pair, regardless of value', () => {
    const result = validateConditionValue(
      condition({ field: 'isActive', operator: 'is_true', value: undefined }),
      employeeFieldConfig,
    )
    expect(result.valid).toBe(true)
  })

  describe('name', () => {
    it('accepts a non-empty string', () => {
      const result = validateConditionValue(
        condition({ field: 'name', operator: 'contains', value: 'Amir' }),
        employeeFieldConfig,
      )
      expect(result.valid).toBe(true)
    })

    it('rejects an empty string', () => {
      const result = validateConditionValue(
        condition({ field: 'name', operator: 'equals', value: '' }),
        employeeFieldConfig,
      )
      expect(result.valid).toBe(false)
    })
  })

  describe('country', () => {
    it('accepts a value within the enum', () => {
      const result = validateConditionValue(
        condition({ field: 'country', operator: 'is', value: 'EG' }),
        employeeFieldConfig,
      )
      expect(result.valid).toBe(true)
    })

    it('rejects a value outside the enum', () => {
      const result = validateConditionValue(
        condition({ field: 'country', operator: 'is', value: 'FR' }),
        employeeFieldConfig,
      )
      expect(result.valid).toBe(false)
    })
  })

  describe('salary', () => {
    it('accepts a non-negative number', () => {
      const result = validateConditionValue(
        condition({ field: 'salary', operator: 'gt', value: 1000 }),
        employeeFieldConfig,
      )
      expect(result.valid).toBe(true)
    })

    it('rejects a negative number', () => {
      const result = validateConditionValue(
        condition({ field: 'salary', operator: 'gt', value: -1 }),
        employeeFieldConfig,
      )
      expect(result.valid).toBe(false)
    })

    it('rejects a non-numeric value', () => {
      const result = validateConditionValue(
        condition({ field: 'salary', operator: 'gt', value: 'abc' }),
        employeeFieldConfig,
      )
      expect(result.valid).toBe(false)
    })
  })

  describe('hireDate day', () => {
    it('accepts a day within 1-31', () => {
      const result = validateConditionValue(
        condition({ field: 'hireDate', operator: 'day_is', value: 15 }),
        employeeFieldConfig,
      )
      expect(result.valid).toBe(true)
    })

    it('rejects a day below 1', () => {
      const result = validateConditionValue(
        condition({ field: 'hireDate', operator: 'day_is', value: 0 }),
        employeeFieldConfig,
      )
      expect(result.valid).toBe(false)
    })

    it('rejects a day above 31', () => {
      const result = validateConditionValue(
        condition({ field: 'hireDate', operator: 'day_is', value: 32 }),
        employeeFieldConfig,
      )
      expect(result.valid).toBe(false)
    })
  })

  describe('hireDate month', () => {
    it('accepts a month within 1-12', () => {
      const result = validateConditionValue(
        condition({ field: 'hireDate', operator: 'month_is', value: 6 }),
        employeeFieldConfig,
      )
      expect(result.valid).toBe(true)
    })

    it('rejects a month below 1', () => {
      const result = validateConditionValue(
        condition({ field: 'hireDate', operator: 'month_is', value: 0 }),
        employeeFieldConfig,
      )
      expect(result.valid).toBe(false)
    })

    it('rejects a month above 12', () => {
      const result = validateConditionValue(
        condition({ field: 'hireDate', operator: 'month_is', value: 13 }),
        employeeFieldConfig,
      )
      expect(result.valid).toBe(false)
    })
  })

  describe('hireDate year', () => {
    it('accepts a 4-digit year', () => {
      const result = validateConditionValue(
        condition({ field: 'hireDate', operator: 'year_is', value: 2020 }),
        employeeFieldConfig,
      )
      expect(result.valid).toBe(true)
    })

    it('rejects a year below 1000', () => {
      const result = validateConditionValue(
        condition({ field: 'hireDate', operator: 'year_is', value: 999 }),
        employeeFieldConfig,
      )
      expect(result.valid).toBe(false)
    })

    it('rejects a year above 9999', () => {
      const result = validateConditionValue(
        condition({ field: 'hireDate', operator: 'year_is', value: 10000 }),
        employeeFieldConfig,
      )
      expect(result.valid).toBe(false)
    })
  })
})
