import { test, expect, type Locator, type Page } from '@playwright/test'

// User Story 3: nested groups. The app has exactly two levels (root + flat nested
// groups). Nested groups are visually marked with a `border-l-blue-400` accent — that
// class is used here only to scope locators to "inside this specific nested group",
// since the app exposes no other DOM handle (role/label) that distinguishes one nested
// group's container from another's. No production code was changed to add one.
const nestedGroups = (page: Page): Locator => page.locator('div.border-l-blue-400')

test('adding a nested group with its own condition narrows results and updates the sentence', async ({ page }) => {
  await page.goto('/')
  await page.getByRole('button', { name: 'Add nested group' }).click()

  const group = nestedGroups(page).first()
  await expect(group.getByRole('button', { name: 'Remove nested group' })).toBeVisible()

  await group.getByRole('button', { name: 'Add condition' }).click()
  await group.getByLabel('Field').selectOption('country')
  await group.getByLabel('Value').selectOption('EG')

  await expect(page.locator('tbody tr')).toHaveCount(8)
  await expect(page.locator('main p')).toContainText('(country is EG)')
})

test('a second independent nested group can be added alongside the first', async ({ page }) => {
  await page.goto('/')
  await page.getByRole('button', { name: 'Add nested group' }).click()
  const firstGroup = nestedGroups(page).nth(0)
  await firstGroup.getByRole('button', { name: 'Add condition' }).click()
  await firstGroup.getByLabel('Field').selectOption('country')
  await firstGroup.getByLabel('Value').selectOption('EG')

  await page.getByRole('button', { name: 'Add nested group' }).click()
  await expect(nestedGroups(page)).toHaveCount(2)

  const secondGroup = nestedGroups(page).nth(1)
  await secondGroup.getByRole('button', { name: 'Add condition' }).click()
  await secondGroup.getByLabel('Field').selectOption('isActive')
  await secondGroup.getByLabel('Operator').selectOption('is_false')

  // root defaults to AND: (country is EG) and (isActive is false) => 3 matches
  await expect(page.locator('main p')).toContainText('(country is EG) and (isActive is false)')
  await expect(page.locator('tbody tr')).toHaveCount(3)
})

test('"Add nested group" is unavailable inside a nested group and stays available at the root', async ({ page }) => {
  await page.goto('/')
  await page.getByRole('button', { name: 'Add nested group' }).click()
  await page.getByRole('button', { name: 'Add nested group' }).click()

  await expect(nestedGroups(page)).toHaveCount(2)
  // the only "Add nested group" control on the page is still the root's - neither
  // nested group grew one of its own.
  await expect(page.getByRole('button', { name: 'Add nested group' })).toHaveCount(1)
  await expect(nestedGroups(page).nth(0).getByRole('button', { name: 'Add nested group' })).toHaveCount(0)
  await expect(nestedGroups(page).nth(1).getByRole('button', { name: 'Add nested group' })).toHaveCount(0)

  // and it is still clickable, i.e. it was never disabled by having children groups
  await expect(page.getByRole('button', { name: 'Add nested group' })).toBeEnabled()
  await page.getByRole('button', { name: 'Add nested group' }).click()
  await expect(nestedGroups(page)).toHaveCount(3)
})

test('the sentence reflects combined AND/OR logic across a root condition and two nested groups', async ({ page }) => {
  await page.goto('/')
  await page.getByRole('button', { name: 'Add condition' }).click()
  await page.getByLabel('Field').first().selectOption('isActive')
  // default operator for isActive is "is_true"

  await page.getByRole('button', { name: 'Add nested group' }).click()
  const g1 = nestedGroups(page).nth(0)
  await g1.getByRole('button', { name: 'Add condition' }).click()
  await g1.getByLabel('Field').selectOption('country')
  await g1.getByLabel('Value').selectOption('EG')

  await page.getByRole('button', { name: 'Add nested group' }).click()
  const g2 = nestedGroups(page).nth(1)
  await g2.getByRole('button', { name: 'Add condition' }).click()
  await g2.getByLabel('Field').selectOption('hireDate')
  await g2.getByLabel('Operator').selectOption('year_is')
  await g2.getByLabel('Value').fill('2015')

  // root AND joins: root condition, then each nested group wrapped in parens, in
  // the order they were added.
  await expect(page.locator('main p')).toContainText(
    'isActive is true and (country is EG) and (hire year is 2015)',
  )
  // active (25) AND country EG (8) AND hired in 2015 (5): only Amir Hassan (EG, 2015) qualifies
  await expect(page.locator('tbody tr')).toHaveCount(1)
  await expect(page.locator('tbody tr')).toContainText('Amir Hassan')
})
