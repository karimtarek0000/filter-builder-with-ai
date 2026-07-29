import { test, expect } from '@playwright/test'
import { decodeFilterParam, getFParam } from './support/decodeFilterParam'

// User Story 4: the filter round-trips through the URL's `f` query param via
// history.replaceState (never pushState); a malformed param falls back silently to an
// empty filter; back does not step through prior filter states.

test('the URL\'s f parameter updates after each filter edit', async ({ page }) => {
  await page.goto('/')
  let previous = await getFParam(page)

  // Note: a freshly added condition has no value yet, and encodeFilterToParam drops
  // not-yet-valid conditions from the URL (see dropInvalidConditions in urlState.ts),
  // so the `f` param only changes once the condition holds a value that passes its
  // schema. Boolean-style operators (no schema, e.g. isActive's is_true) are the
  // exception and would appear immediately - this test exercises the general case.
  await page.getByRole('button', { name: 'Add condition' }).click()
  await page.getByLabel('Field').selectOption('country')
  await page.getByLabel('Value').selectOption('EG')
  await expect.poll(() => getFParam(page)).not.toBe(previous)
  previous = await getFParam(page)

  await page.getByRole('button', { name: 'Add nested group' }).click()
  await expect.poll(() => getFParam(page)).not.toBe(previous)

  const raw = await getFParam(page)
  const decoded = decodeFilterParam(raw!)
  expect(decoded.kind).toBe('group')
  expect(decoded.children).toHaveLength(2)
  expect(decoded.children?.[0]).toMatchObject({ kind: 'condition', field: 'country', value: 'EG' })
  expect(decoded.children?.[1]).toMatchObject({ kind: 'group', children: [] })
})

test('reloading with a seeded URL restores the same filter, sentence, and rows', async ({ page }) => {
  await page.goto('/')
  await page.getByRole('button', { name: 'Add condition' }).click()
  await page.getByLabel('Field').selectOption('country')
  await page.getByLabel('Value').selectOption('EG')
  await expect(page.locator('tbody tr')).toHaveCount(8)
  // wait for the URL itself (not just the table) to carry the committed value, so the
  // reload below is guaranteed to read a seeded URL rather than racing the replaceState.
  await expect.poll(async () => {
    const raw = await getFParam(page)
    return raw ? decodeFilterParam(raw).children?.[0] : null
  }).toMatchObject({ field: 'country', value: 'EG' })

  await page.reload()

  await expect(page.locator('tbody tr')).toHaveCount(8)
  await expect(page.locator('main p')).toContainText('country is EG')
  await expect(page.locator('main p')).toContainText('8 matches')
  await expect(page.getByLabel('Field')).toHaveValue('country')
  await expect(page.getByLabel('Value')).toHaveValue('EG')
})

test('a malformed f parameter falls back to an empty filter with no error shown', async ({ page }) => {
  const pageErrors: Error[] = []
  page.on('pageerror', error => pageErrors.push(error))

  await page.goto('/?f=not-valid-base64!!!')

  await expect(page.locator('tbody tr')).toHaveCount(40)
  await expect(page.locator('main p')).toContainText('No filter applied')
  await expect(page.locator('main p')).toContainText('40 matches')
  await expect(page.getByLabel('Field')).toHaveCount(0)
  expect(pageErrors).toHaveLength(0)
})

test('the browser back button does not step through prior filter states', async ({ page }) => {
  await page.goto('about:blank')
  await page.goto('/')

  await page.getByRole('button', { name: 'Add condition' }).click()
  await page.getByLabel('Field').selectOption('country')
  await page.getByLabel('Value').selectOption('EG')
  await expect(page.locator('tbody tr')).toHaveCount(8)

  // every edit above used replaceState, so this single history entry's URL is the
  // one with the filter applied; going back must leave the app entirely rather than
  // stepping back through the filter's edit history.
  await page.goBack()
  await expect(page).toHaveURL('about:blank')
})
