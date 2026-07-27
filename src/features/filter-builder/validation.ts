import { z } from 'zod'
import { COUNTRY_OPTIONS } from './fieldConfig'
import type { Field, FilterCondition, Operator } from './types'

type SchemaMap = Partial<Record<Operator, z.ZodTypeAny>>

const nonEmptyString = z.string().trim().min(1, 'Value is required')

const nonNegativeNumber = z.coerce.number('Must be a number').nonnegative('Must be 0 or greater')

const dayNumber = z.coerce
  .number('Must be a number')
  .int('Must be a whole number')
  .min(1, 'Day must be between 1 and 31')
  .max(31, 'Day must be between 1 and 31')

const monthNumber = z.coerce
  .number('Must be a number')
  .int('Must be a whole number')
  .min(1, 'Month must be between 1 and 12')
  .max(12, 'Month must be between 1 and 12')

const yearNumber = z.coerce
  .number('Must be a number')
  .int('Must be a whole number')
  .min(1000, 'Year must be a 4-digit number')
  .max(9999, 'Year must be a 4-digit number')

const countryEnum = z.enum(COUNTRY_OPTIONS)

const schemasByField: Record<Field, SchemaMap> = {
  name: { contains: nonEmptyString, equals: nonEmptyString },
  country: { is: countryEnum, is_not: countryEnum },
  salary: { gt: nonNegativeNumber, lt: nonNegativeNumber, eq: nonNegativeNumber },
  isActive: {},
  hireDate: { day_is: dayNumber, month_is: monthNumber, year_is: yearNumber },
}

export type ValidationResult = { valid: true } | { valid: false; error: string }

export const validateConditionValue = (condition: FilterCondition): ValidationResult => {
  const schema = schemasByField[condition.field][condition.operator]
  if (!schema) {
    return { valid: true }
  }

  const result = schema.safeParse(condition.value)

  if (result.success) {
    return { valid: true }
  }

  return { valid: false, error: result.error.issues[0]?.message ?? 'Invalid value' }
}
