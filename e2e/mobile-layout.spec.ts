import { test, expect } from '@playwright/test'

// User Story 8: below Tailwind's `md` breakpoint (768px) a condition row's remove
// control renders on its own line below the field/operator/value controls (still
// tappable); at `md` and above it renders inline in the same row. Asserted on the
// rendered outcome (bounding-box position) rather than on Tailwind class names.

test('the remove control stacks below the row on mobile and returns inline on desktop', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 667 })
  await page.goto('/')
  await page.getByRole('button', { name: 'Add condition' }).click()

  const removeButton = page.getByRole('button', { name: 'Remove condition' })
  const valueControl = page.getByLabel('Value')

  const mobileValueBox = await valueControl.boundingBox()
  const mobileRemoveBox = await removeButton.boundingBox()
  if (!mobileValueBox || !mobileRemoveBox) throw new Error('expected both controls to be visible on mobile')

  // on a single-column mobile layout, the remove control sits on a row below the
  // value control (not side-by-side with it).
  expect(mobileRemoveBox.y).toBeGreaterThanOrEqual(mobileValueBox.y + mobileValueBox.height)

  // it is still tappable and functional at this viewport
  await removeButton.click()
  await expect(page.getByLabel('Field')).toHaveCount(0)

  await page.getByRole('button', { name: 'Add condition' }).click()
  await page.setViewportSize({ width: 1280, height: 800 })

  const desktopValueBox = await valueControl.boundingBox()
  const desktopRemoveBox = await removeButton.boundingBox()
  if (!desktopValueBox || !desktopRemoveBox) throw new Error('expected both controls to be visible on desktop')

  // at md and above, the remove control sits inline in the same row as the value control
  expect(Math.abs(desktopRemoveBox.y - desktopValueBox.y)).toBeLessThan(desktopValueBox.height)
})
