import { test, expect } from '@playwright/test'
import { decodeFilterParam, getFParam } from './support/decodeFilterParam'

// User Story 14: Clear All (aria-label "Clear all filters") resets every condition and
// group, restores all 40 rows, resets the sentence and URL, with no confirmation
// prompt; clicking it again on an already-empty filter is a no-op.

test('Clear All resets a filter with multiple conditions and a nested group, with no confirmation prompt', async ({ page }) => {
  let dialogFired = false
  page.on('dialog', async dialog => {
    dialogFired = true
    await dialog.dismiss()
  })

  await page.goto('/')

  await page.getByRole('button', { name: 'Add condition' }).click()
  await page.getByLabel('Field').nth(0).selectOption('country')
  await page.getByLabel('Value').nth(0).selectOption('EG')

  await page.getByRole('button', { name: 'Add condition' }).click()
  await page.getByLabel('Field').nth(1).selectOption('isActive')
  await page.getByLabel('Operator').nth(1).selectOption('is_false')

  await page.getByRole('button', { name: 'Add nested group' }).click()
  const nested = page.locator('div.border-l-blue-400')
  await nested.getByRole('button', { name: 'Add condition' }).click()
  await nested.getByLabel('Field').selectOption('salary')
  await nested.getByLabel('Value').fill('5000')

  // sanity check: the filter is actually doing something before we clear it
  await expect(page.locator('tbody tr')).not.toHaveCount(40)

  await page.getByRole('button', { name: 'Clear all filters' }).click()

  await expect(page.getByLabel('Field')).toHaveCount(0)
  await expect(page.locator('div.border-l-blue-400')).toHaveCount(0)
  await expect(page.locator('tbody tr')).toHaveCount(40)
  await expect(page.locator('main p')).toContainText('No filter applied')
  await expect(page.locator('main p')).toContainText('40 matches')

  const raw = await getFParam(page)
  const decoded = decodeFilterParam(raw!)
  expect(decoded.kind).toBe('group')
  expect(decoded.children).toHaveLength(0)

  expect(dialogFired).toBe(false)

  // clicking Clear All again on an already-empty filter is a no-op
  await page.getByRole('button', { name: 'Clear all filters' }).click()

  await expect(page.getByLabel('Field')).toHaveCount(0)
  await expect(page.locator('div.border-l-blue-400')).toHaveCount(0)
  await expect(page.locator('tbody tr')).toHaveCount(40)
  await expect(page.locator('main p')).toContainText('No filter applied')
  await expect(page.locator('main p')).toContainText('40 matches')
  expect(dialogFired).toBe(false)
})
