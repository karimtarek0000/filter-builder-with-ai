import type { ReactNode } from 'react'
import { describeFilter, describeMatchCount, filterRows } from '../filterEngine'
import { createEmptyRoot, useFilterUrlSync } from '../hooks'
import type { FilterFieldConfig } from '../types'
import FilterGroup from './FilterGroup'

interface FilterBuilderProps<TRow> {
  fieldConfig: FilterFieldConfig<TRow>
  data: TRow[]
  children: (matchingRows: TRow[]) => ReactNode
}

const FilterBuilder = <TRow,>({ fieldConfig, data, children }: FilterBuilderProps<TRow>) => {
  console.log(fieldConfig)

  const [root, setRoot] = useFilterUrlSync(fieldConfig)

  const visibleRows = filterRows(root, data, fieldConfig)

  return (
    <div className="flex flex-col gap-4 p-4">
      <div className="flex items-center justify-between">
        <h4 className="font-bold">Filter</h4>
        <button
          type="button"
          className="border border-gray-400 px-2 py-1"
          aria-label="Clear all filters"
          onClick={() => setRoot(createEmptyRoot())}
        >
          Clear All
        </button>
      </div>

      <FilterGroup group={root} isRoot={true} fieldConfig={fieldConfig} onChange={setRoot} />

      <p className="text-gray-700 text-center">
        {describeFilter(root, fieldConfig)} ({describeMatchCount(visibleRows.length)})
      </p>

      {children(visibleRows)}
    </div>
  )
}

export default FilterBuilder
