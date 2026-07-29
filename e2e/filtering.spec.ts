import { test, expect } from '@playwright/test'

// User Story 1: a single condition narrows the table/count; changing a condition's
// field resets its operator and clears its value; a boolean operator hides the value
// input; a debounced value field updates the input every keystroke but the table only
// after the debounce pause.
test.describe('User Story 1 - single condition filtering', () => {
  test('a single condition narrows the table and match count', async ({ page }) => {
    await page.goto('/')
    await page.getByRole('button', { name: 'Add condition' }).click()

    await page.getByLabel('Field').selectOption('country')
    await page.getByLabel('Value').selectOption('EG')

    await expect(page.locator('tbody tr')).toHaveCount(8)
    await expect(page.locator('main p')).toContainText('country is EG')
    await expect(page.locator('main p')).toContainText('8 matches')
  })

  test('changing a condition\'s field resets its operator and clears its value', async ({ page }) => {
    await page.goto('/')
    await page.getByRole('button', { name: 'Add condition' }).click()

    await page.getByLabel('Field').selectOption('salary')
    await expect(page.getByLabel('Operator')).toHaveValue('gt')
    await page.getByLabel('Value').fill('5000')
    await expect(page.getByLabel('Value')).toHaveValue('5000')

    await page.getByLabel('Field').selectOption('country')
    await expect(page.getByLabel('Operator')).toHaveValue('is')
    // the value control is re-created as a <select> for `country`; it must come back empty
    await expect(page.getByLabel('Value')).toHaveValue('')
  })

  test('a boolean operator hides the value input entirely', async ({ page }) => {
    await page.goto('/')
    await page.getByRole('button', { name: 'Add condition' }).click()

    await page.getByLabel('Field').selectOption('isActive')
    await expect(page.getByLabel('Operator')).toHaveValue('is_true')
    await expect(page.getByLabel('Value')).toHaveCount(0)
    await expect(page.locator('tbody tr')).toHaveCount(25)
  })

  test('typing into a debounced value field updates the input every keystroke but the table only after the pause', async ({ page }) => {
    await page.clock.install()
    await page.goto('/')
    await page.getByRole('button', { name: 'Add condition' }).click()
    await page.getByLabel('Field').selectOption('salary')

    const valueInput = page.getByLabel('Value')
    await valueInput.pressSequentially('5000')
    // the input reflects every keystroke immediately
    await expect(valueInput).toHaveValue('5000')

    // the table/count have not yet reacted to the still-debounced value
    await expect(page.locator('tbody tr')).toHaveCount(40)
    await expect(page.locator('main p')).toContainText('40 matches')

    // advance the fake clock past the ~700ms debounce window instead of sleeping
    await page.clock.fastForward(700)

    await expect(page.locator('tbody tr')).toHaveCount(28)
    await expect(page.locator('main p')).toContainText('salary > 5000')
    await expect(page.locator('main p')).toContainText('28 matches')
  })
})

// User Story 2: a second condition in the same root group, AND/OR toggle, remove condition.
test.describe('User Story 2 - multiple conditions in one group', () => {
  test('a second condition narrows further under AND and widens under OR', async ({ page }) => {
    await page.goto('/')
    await page.getByRole('button', { name: 'Add condition' }).click()
    await page.getByLabel('Field').nth(0).selectOption('country')
    await page.getByLabel('Value').nth(0).selectOption('EG')
    await expect(page.locator('tbody tr')).toHaveCount(8)

    await page.getByRole('button', { name: 'Add condition' }).click()
    await page.getByLabel('Field').nth(1).selectOption('isActive')
    await page.getByLabel('Operator').nth(1).selectOption('is_false')

    // AND: country is EG (8) intersected with isActive is false (15) => 3
    await expect(page.locator('tbody tr')).toHaveCount(3)
    await expect(page.locator('main p')).toContainText('country is EG and isActive is false')

    await page.getByRole('button', { name: 'Group logic' }).click()

    // OR: country is EG (8) union isActive is false (15) => 20
    await expect(page.locator('tbody tr')).toHaveCount(20)
    await expect(page.locator('main p')).toContainText('country is EG or isActive is false')
  })

  test('removing a condition leaves the remaining condition applied', async ({ page }) => {
    await page.goto('/')
    await page.getByRole('button', { name: 'Add condition' }).click()
    await page.getByLabel('Field').nth(0).selectOption('country')
    await page.getByLabel('Value').nth(0).selectOption('EG')

    await page.getByRole('button', { name: 'Add condition' }).click()
    await page.getByLabel('Field').nth(1).selectOption('isActive')
    await page.getByLabel('Operator').nth(1).selectOption('is_false')
    await expect(page.locator('tbody tr')).toHaveCount(3)

    await page.getByRole('button', { name: 'Remove condition' }).nth(1).click()

    await expect(page.getByLabel('Field')).toHaveCount(1)
    await expect(page.locator('tbody tr')).toHaveCount(8)
    await expect(page.locator('main p')).toContainText('country is EG')
    await expect(page.locator('main p')).not.toContainText('isActive')
  })
})
