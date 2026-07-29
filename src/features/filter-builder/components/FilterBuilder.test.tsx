import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { z } from 'zod'
import FilterBuilder from './FilterBuilder'
import type { FilterFieldConfig } from '../types'

interface Product {
  id: string
  title: string
  price: number
}

const productFieldConfig: FilterFieldConfig<Product> = {
  title: {
    label: 'title',
    operators: {
      contains: {
        label: 'contains',
        valueKind: 'text',
        schema: z.string().trim().min(1),
        match: (product, value) => product.title.toLowerCase().includes(String(value).toLowerCase()),
        describe: value => `title contains "${value ?? ''}"`,
      },
    },
  },
  price: {
    label: 'price',
    operators: {
      gt: {
        label: 'gt',
        valueKind: 'number',
        schema: z.coerce.number(),
        match: (product, value) => product.price > Number(value),
        describe: value => `price > ${value ?? ''}`,
      },
    },
  },
}

const products: Product[] = [
  { id: 'p1', title: 'Chair', price: 50 },
  { id: 'p2', title: 'Table', price: 150 },
  { id: 'p3', title: 'Lamp', price: 30 },
]

const setLocationSearch = (search: string) => {
  window.history.replaceState(null, '', `/${search}`)
}

describe('FilterBuilder', () => {
  beforeEach(() => {
    setLocationSearch('')
  })

  afterEach(() => {
    setLocationSearch('')
  })

  it('renders with no filter applied and all rows visible on initial render', () => {
    render(
      <FilterBuilder fieldConfig={productFieldConfig} data={products}>
        {matchingRows => (
          <ul>
            {matchingRows.map(row => (
              <li key={row.id}>{row.title}</li>
            ))}
          </ul>
        )}
      </FilterBuilder>,
    )

    expect(screen.getByText(/no filter applied/i)).toBeInTheDocument()
    expect(screen.getByText(/3 matches/i)).toBeInTheDocument()
    expect(screen.getByText('Chair')).toBeInTheDocument()
    expect(screen.getByText('Table')).toBeInTheDocument()
    expect(screen.getByText('Lamp')).toBeInTheDocument()
  })

  it('resets the tree to an empty root group when "Clear All" is clicked', async () => {
    const user = userEvent.setup()

    render(
      <FilterBuilder fieldConfig={productFieldConfig} data={products}>
        {matchingRows => (
          <ul>
            {matchingRows.map(row => (
              <li key={row.id}>{row.title}</li>
            ))}
          </ul>
        )}
      </FilterBuilder>,
    )

    await user.click(screen.getByRole('button', { name: 'Add condition' }))
    expect(screen.getByRole('button', { name: 'Remove condition' })).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Clear all filters' }))

    expect(screen.queryByRole('button', { name: 'Remove condition' })).not.toBeInTheDocument()
    expect(screen.getByText(/no filter applied/i)).toBeInTheDocument()
    expect(screen.getByText(/3 matches/i)).toBeInTheDocument()
  })

  it('is a no-op when "Clear All" is clicked while the filter is already empty', async () => {
    const user = userEvent.setup()

    render(
      <FilterBuilder fieldConfig={productFieldConfig} data={products}>
        {matchingRows => (
          <ul>
            {matchingRows.map(row => (
              <li key={row.id}>{row.title}</li>
            ))}
          </ul>
        )}
      </FilterBuilder>,
    )

    expect(screen.getByText(/no filter applied/i)).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Clear all filters' }))

    expect(screen.getByText(/no filter applied/i)).toBeInTheDocument()
    expect(screen.getByText(/3 matches/i)).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Remove condition' })).not.toBeInTheDocument()
  })
})
