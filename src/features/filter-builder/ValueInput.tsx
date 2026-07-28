import type { Country } from '../../data/employees'
import { MONTH_OPTIONS } from './fieldConfig'
import type { ValueKind } from './fieldConfig'

interface InputProps {
  value: string | number | undefined
  onChange: (value: string | number | undefined) => void
  options?: readonly Country[]
}

const TextInput = ({ value, onChange }: InputProps) => (
  <input
    className="border border-gray-300 p-1 w-full"
    type="text"
    value={typeof value === 'string' ? value : ''}
    onChange={e => onChange(e.target.value)}
  />
)

const NumberInput = ({ value, onChange }: InputProps) => (
  <input
    className="border border-gray-300 p-1 w-full"
    type="text"
    inputMode="decimal"
    value={value ?? ''}
    onChange={e => onChange(e.target.value === '' ? undefined : e.target.value)}
  />
)

const NumericInput = ({ value, onChange }: InputProps) => (
  <input
    className="border border-gray-300 p-1 w-full"
    type="text"
    inputMode="numeric"
    value={value ?? ''}
    onChange={e => onChange(e.target.value === '' ? undefined : e.target.value)}
  />
)

const SelectInput = ({ value, onChange, options }: InputProps) => (
  <select
    className="border border-gray-300 p-1 w-full"
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
