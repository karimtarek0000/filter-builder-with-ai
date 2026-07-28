export type Field = 'name' | 'country' | 'salary' | 'isActive' | 'hireDate'

export type Operator =
  | 'contains'
  | 'equals'
  | 'is'
  | 'is_not'
  | 'gt'
  | 'lt'
  | 'eq'
  | 'is_true'
  | 'is_false'
  | 'day_is'
  | 'month_is'
  | 'year_is'

export interface FilterCondition {
  id: string
  kind: 'condition'
  field: Field
  operator: Operator
  value: string | number | undefined
}

export interface FilterGroup {
  id: string
  kind: 'group'
  logic: 'AND' | 'OR'
  children: FilterNode[]
}

export type FilterNode = FilterCondition | FilterGroup
