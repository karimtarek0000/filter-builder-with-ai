import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { act, renderHook } from '@testing-library/react'
import { employeeFieldConfig } from '../../../data/employeeFieldConfig'
import { useConditionRow } from './useConditionRow'
import type { FilterCondition } from '../types'

const condition = (overrides: Partial<FilterCondition>): FilterCondition => ({
  id: 'c1',
  kind: 'condition',
  field: 'name',
  operator: 'contains',
  value: undefined,
  ...overrides,
})

describe('useConditionRow', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('resets the operator to the new field default and clears the value on field change', () => {
    const onChange = vi.fn()
    const { result } = renderHook(() =>
      useConditionRow(condition({ field: 'name', operator: 'equals', value: 'Amir' }), employeeFieldConfig, onChange),
    )

    act(() => {
      result.current.handleFieldChange('salary')
    })

    expect(onChange).toHaveBeenCalledWith({
      id: 'c1',
      kind: 'condition',
      field: 'salary',
      operator: 'gt',
      value: undefined,
    })
  })

  it('clears the value on a hireDate operator change that switches value kind', () => {
    const onChange = vi.fn()
    const { result } = renderHook(() =>
      useConditionRow(
        condition({ field: 'hireDate', operator: 'day_is', value: 15 }),
        employeeFieldConfig,
        onChange,
      ),
    )

    act(() => {
      result.current.handleOperatorChange('month_is')
    })

    expect(onChange).toHaveBeenCalledWith({
      id: 'c1',
      kind: 'condition',
      field: 'hireDate',
      operator: 'month_is',
      value: undefined,
    })
  })

  it('preserves the value on an operator change that keeps the same value kind', () => {
    const onChange = vi.fn()
    const { result } = renderHook(() =>
      useConditionRow(
        condition({ field: 'salary', operator: 'gt', value: 1000 }),
        employeeFieldConfig,
        onChange,
      ),
    )

    act(() => {
      result.current.handleOperatorChange('lt')
    })

    expect(onChange).toHaveBeenCalledWith({
      id: 'c1',
      kind: 'condition',
      field: 'salary',
      operator: 'lt',
      value: 1000,
    })
  })

  it('debounces text value commits (name/contains has a delay)', () => {
    const onChange = vi.fn()
    const { result } = renderHook(() =>
      useConditionRow(condition({ field: 'name', operator: 'contains', value: undefined }), employeeFieldConfig, onChange),
    )

    act(() => {
      result.current.handleValueChange('Amir')
    })

    expect(result.current.displayValue).toBe('Amir')
    expect(onChange).not.toHaveBeenCalled()

    act(() => {
      vi.advanceTimersByTime(700)
    })

    expect(onChange).toHaveBeenCalledWith({
      id: 'c1',
      kind: 'condition',
      field: 'name',
      operator: 'contains',
      value: 'Amir',
    })
  })

  it('commits select value changes immediately (country/is has no debounce)', () => {
    const onChange = vi.fn()
    const { result } = renderHook(() =>
      useConditionRow(condition({ field: 'country', operator: 'is', value: undefined }), employeeFieldConfig, onChange),
    )

    act(() => {
      result.current.handleValueChange('EG')
    })

    act(() => {
      vi.advanceTimersByTime(0)
    })

    expect(onChange).toHaveBeenCalledWith({
      id: 'c1',
      kind: 'condition',
      field: 'country',
      operator: 'is',
      value: 'EG',
    })
  })
})
