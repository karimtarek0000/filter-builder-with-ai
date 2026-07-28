import type { ValueKind } from '../types'

interface InputProps {
  value: string | number | undefined
  onChange: (value: string | number | undefined) => void
  options?: readonly string[]
}

const MONTH_OPTIONS: readonly { label: string; value: number }[] = [
  { label: 'January', value: 1 },
  { label: 'February', value: 2 },
  { label: 'March', value: 3 },
  { label: 'April', value: 4 },
  { label: 'May', value: 5 },
  { label: 'June', value: 6 },
  { label: 'July', value: 7 },
  { label: 'August', value: 8 },
  { label: 'September', value: 9 },
  { label: 'October', value: 10 },
  { label: 'November', value: 11 },
  { label: 'December', value: 12 },
]

const TextInput = ({ value, onChange }: InputProps) => (
  <input
    className="border border-gray-300 p-1 w-full"
    type="text"
    aria-label="Value"
    value={typeof value === 'string' ? value : ''}
    onChange={e => onChange(e.target.value)}
  />
)

const NumberInput = ({ value, onChange }: InputProps) => (
  <input
    className="border border-gray-300 p-1 w-full"
    type="text"
    inputMode="decimal"
    aria-label="Value"
    value={value ?? ''}
    onChange={e => onChange(e.target.value === '' ? undefined : e.target.value)}
  />
)

const NumericInput = ({ value, onChange }: InputProps) => (
  <input
    className="border border-gray-300 p-1 w-full"
    type="text"
    inputMode="numeric"
    aria-label="Value"
    value={value ?? ''}
    onChange={e => onChange(e.target.value === '' ? undefined : e.target.value)}
  />
)

const SelectInput = ({ value, onChange, options }: InputProps) => (
  <select
    className="border border-gray-300 p-1 w-full"
    aria-label="Value"
    value={typeof value === 'string' ? value : ''}
    onChange={e => onChange(e.target.value === '' ? undefined : e.target.value)}
  >
    <option value="">Select...</option>
    {options?.map(option => (
      <option key={option} value={option}>
        {option}
      </option>
    ))}
  </select>
)

const MonthInput = ({ value, onChange }: InputProps) => (
  <select
    className="border border-gray-300 p-1 w-full"
    aria-label="Value"
    value={typeof value === 'number' ? value : ''}
    onChange={e => onChange(e.target.value === '' ? undefined : Number(e.target.value))}
  >
    <option value="">Select...</option>
    {MONTH_OPTIONS.map(month => (
      <option key={month.value} value={month.value}>
        {month.label}
      </option>
    ))}
  </select>
)

const NoInput = () => null

const inputsByValueKind: Record<ValueKind, (props: InputProps) => React.JSX.Element | null> = {
  text: TextInput,
  number: NumberInput,
  select: SelectInput,
  day: NumericInput,
  month: MonthInput,
  year: NumericInput,
  none: NoInput,
}

interface ValueInputProps extends InputProps {
  valueKind: ValueKind
}

export const ValueInput = ({ valueKind, value, onChange, options }: ValueInputProps) => {
  const Input = inputsByValueKind[valueKind]
  return <Input value={value} onChange={onChange} options={options} />
}
