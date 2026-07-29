import { test, expect } from '@playwright/test'

// User Story 5: hireDate operators. month_is narrows by month across any year,
// year_is narrows by year alone, day_is narrows by day-of-month alone, and combining
// month_is + year_is in one AND group narrows further than either alone.

test('month_is narrows to employees hired in that month across any year', async ({ page }) => {
  await page.goto('/')
  await page.getByRole('button', { name: 'Add condition' }).click()
  await page.getByLabel('Field').selectOption('hireDate')
  await page.getByLabel('Operator').selectOption('month_is')
  await page.getByLabel('Value').selectOption('1') // January - a <select>, never free-typed

  await expect(page.locator('tbody tr')).toHaveCount(4)
  await expect(page.locator('main p')).toContainText('hire month is January')
})

test('year_is narrows by year alone', async ({ page }) => {
  await page.goto('/')
  await page.getByRole('button', { name: 'Add condition' }).click()
  await page.getByLabel('Field').selectOption('hireDate')
  await page.getByLabel('Operator').selectOption('year_is')
  await page.getByLabel('Value').fill('2015')

  await expect(page.locator('tbody tr')).toHaveCount(5)
  await expect(page.locator('main p')).toContainText('hire year is 2015')
})

test('day_is narrows by day-of-month alone', async ({ page }) => {
  await page.goto('/')
  await page.getByRole('button', { name: 'Add condition' }).click()
  await page.getByLabel('Field').selectOption('hireDate')
  // day_is is the default operator for hireDate
  await expect(page.getByLabel('Operator')).toHaveValue('day_is')
  await page.getByLabel('Value').fill('15')

  await expect(page.locator('tbody tr')).toHaveCount(3)
  await expect(page.locator('main p')).toContainText('hire day is 15')
})

test('combining month_is and year_is in one AND group narrows further than either alone', async ({ page }) => {
  await page.goto('/')
  await page.getByRole('button', { name: 'Add condition' }).click()
  await page.getByLabel('Field').nth(0).selectOption('hireDate')
  await page.getByLabel('Operator').nth(0).selectOption('month_is')
  await page.getByLabel('Value').nth(0).selectOption('1')
  await expect(page.locator('tbody tr')).toHaveCount(4) // month_is alone

  await page.getByRole('button', { name: 'Add condition' }).click()
  await page.getByLabel('Field').nth(1).selectOption('hireDate')
  await page.getByLabel('Operator').nth(1).selectOption('year_is')
  await page.getByLabel('Value').nth(1).fill('2015')

  // month_is=January (4) AND year_is=2015 (5) narrows to 2
  await expect(page.locator('tbody tr')).toHaveCount(2)
  await expect(page.locator('main p')).toContainText('hire month is January and hire year is 2015')
})
