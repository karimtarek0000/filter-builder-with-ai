import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { employeeFieldConfig } from '../../../data/employeeFieldConfig'
import FilterCondition from './FilterCondition'
import type { FilterCondition as FilterConditionType } from '../types'

const condition = (overrides: Partial<FilterConditionType>): FilterConditionType => ({
  id: 'c1',
  kind: 'condition',
  field: 'name',
  operator: 'contains',
  value: undefined,
  ...overrides,
})

describe('FilterCondition', () => {
  it('renders a text input for a text-valued field/operator pair', () => {
    render(
      <FilterCondition
        condition={condition({ field: 'name', operator: 'contains' })}
        fieldConfig={employeeFieldConfig}
        onChange={vi.fn()}
        onRemove={vi.fn()}
      />,
    )

    expect(screen.getByLabelText('Value')).toHaveAttribute('type', 'text')
  })

  it('swaps the value control to a select when the field changes to one with select values', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()

    const { rerender } = render(
      <FilterCondition
        condition={condition({ field: 'name', operator: 'contains' })}
        fieldConfig={employeeFieldConfig}
        onChange={onChange}
        onRemove={vi.fn()}
      />,
    )

    await user.selectOptions(screen.getByLabelText('Field'), 'country')
    expect(onChange).toHaveBeenCalledWith({
      id: 'c1',
      kind: 'condition',
      field: 'country',
      operator: 'is',
      value: undefined,
    })

    rerender(
      <FilterCondition
        condition={condition({ field: 'country', operator: 'is' })}
        fieldConfig={employeeFieldConfig}
        onChange={onChange}
        onRemove={vi.fn()}
      />,
    )

    expect(screen.getByLabelText('Value').tagName).toBe('SELECT')
  })

  it('swaps the value control when the operator changes value kind (hireDate day -> month)', () => {
    const onChange = vi.fn()

    const { rerender } = render(
      <FilterCondition
        condition={condition({ field: 'hireDate', operator: 'day_is', value: 15 })}
        fieldConfig={employeeFieldConfig}
        onChange={onChange}
        onRemove={vi.fn()}
      />,
    )

    expect(screen.getByLabelText('Value')).toHaveAttribute('inputmode', 'numeric')

    rerender(
      <FilterCondition
        condition={condition({ field: 'hireDate', operator: 'month_is', value: undefined })}
        fieldConfig={employeeFieldConfig}
        onChange={onChange}
        onRemove={vi.fn()}
      />,
    )

    expect(screen.getByLabelText('Value').tagName).toBe('SELECT')
  })

  it('fires onRemove when the remove control is clicked', async () => {
    const user = userEvent.setup()
    const onRemove = vi.fn()

    render(
      <FilterCondition
        condition={condition({ field: 'name', operator: 'contains' })}
        fieldConfig={employeeFieldConfig}
        onChange={vi.fn()}
        onRemove={onRemove}
      />,
    )

    await user.click(screen.getByRole('button', { name: 'Remove condition' }))

    expect(onRemove).toHaveBeenCalledTimes(1)
  })
})
