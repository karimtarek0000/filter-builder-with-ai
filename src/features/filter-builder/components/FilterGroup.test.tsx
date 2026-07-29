import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { employeeFieldConfig } from '../../../data/employeeFieldConfig'
import FilterGroup from './FilterGroup'
import type { FilterCondition, FilterGroup as FilterGroupType } from '../types'

const condition = (overrides: Partial<FilterCondition>): FilterCondition => ({
  id: 'c1',
  kind: 'condition',
  field: 'name',
  operator: 'contains',
  value: undefined,
  ...overrides,
})

const group = (overrides: Partial<FilterGroupType>): FilterGroupType => ({
  id: 'g1',
  kind: 'group',
  logic: 'AND',
  children: [],
  ...overrides,
})

describe('FilterGroup', () => {
  it('toggles the group logic between AND and OR', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()

    render(
      <FilterGroup group={group({ logic: 'AND' })} isRoot fieldConfig={employeeFieldConfig} onChange={onChange} />,
    )

    await user.click(screen.getByRole('button', { name: 'Group logic: AND, click to toggle' }))

    expect(onChange).toHaveBeenCalledWith({
      id: 'g1',
      kind: 'group',
      logic: 'OR',
      children: [],
    })
  })

  it('adds a condition when "Add condition" is clicked', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()

    render(<FilterGroup group={group({})} isRoot fieldConfig={employeeFieldConfig} onChange={onChange} />)

    await user.click(screen.getByRole('button', { name: 'Add condition' }))

    expect(onChange).toHaveBeenCalledTimes(1)
    const updated = onChange.mock.calls[0][0] as FilterGroupType
    expect(updated.children).toHaveLength(1)
    expect(updated.children[0]).toMatchObject({ kind: 'condition', field: 'name', operator: 'contains' })
  })

  it('removes a condition when its remove control is clicked', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()

    render(
      <FilterGroup
        group={group({ children: [condition({ id: 'c1' })] })}
        isRoot
        fieldConfig={employeeFieldConfig}
        onChange={onChange}
      />,
    )

    await user.click(screen.getByRole('button', { name: 'Remove condition' }))

    expect(onChange).toHaveBeenCalledWith(group({ children: [] }))
  })

  it('adds a nested group when "Add group" is clicked (root only)', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()

    render(<FilterGroup group={group({})} isRoot fieldConfig={employeeFieldConfig} onChange={onChange} />)

    await user.click(screen.getByRole('button', { name: 'Add nested group' }))

    expect(onChange).toHaveBeenCalledTimes(1)
    const updated = onChange.mock.calls[0][0] as FilterGroupType
    expect(updated.children).toHaveLength(1)
    expect(updated.children[0]).toMatchObject({ kind: 'group', logic: 'AND', children: [] })
  })

  it('removes a nested group when its remove control is clicked', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    const nested = group({ id: 'g2', children: [] })

    render(
      <FilterGroup
        group={group({ children: [nested] })}
        isRoot
        fieldConfig={employeeFieldConfig}
        onChange={onChange}
      />,
    )

    await user.click(screen.getByRole('button', { name: 'Remove nested group' }))

    expect(onChange).toHaveBeenCalledWith(group({ children: [] }))
  })

  it('does not render the add-nested-group control when isRoot is false', () => {
    render(
      <FilterGroup
        group={group({})}
        isRoot={false}
        fieldConfig={employeeFieldConfig}
        onChange={vi.fn()}
        onRemove={vi.fn()}
      />,
    )

    expect(screen.queryByRole('button', { name: 'Add nested group' })).not.toBeInTheDocument()
  })
})
