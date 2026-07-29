import { test, expect } from '@playwright/test'

// User Story 6: an invalid condition value shows an inline error near the value
// control and is treated as unset (vacuous - matches every row) until corrected.

test('a non-numeric salary value shows an inline error and the condition is treated as unset', async ({ page }) => {
  await page.goto('/')
  await page.getByRole('button', { name: 'Add condition' }).click()
  await page.getByLabel('Field').selectOption('salary')

  await page.getByLabel('Value').fill('abc')

  await expect(page.getByText('Must be a number')).toBeVisible()
  await expect(page.locator('tbody tr')).toHaveCount(40)

  await page.getByLabel('Value').fill('5000')

  await expect(page.getByText('Must be a number')).toHaveCount(0)
  await expect(page.locator('tbody tr')).toHaveCount(28)
})

test('an out-of-range hireDate year shows an inline error and clears once corrected', async ({ page }) => {
  await page.goto('/')
  await page.getByRole('button', { name: 'Add condition' }).click()
  await page.getByLabel('Field').selectOption('hireDate')
  await page.getByLabel('Operator').selectOption('year_is')

  await page.getByLabel('Value').fill('99')

  await expect(page.getByText('Year must be a 4-digit number')).toBeVisible()
  await expect(page.locator('tbody tr')).toHaveCount(40)

  await page.getByLabel('Value').fill('2015')

  await expect(page.getByText('Year must be a 4-digit number')).toHaveCount(0)
  await expect(page.locator('tbody tr')).toHaveCount(5)
})
