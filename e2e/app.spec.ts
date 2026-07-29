import { test, expect } from '@playwright/test'

test('renders the employee table', async ({ page }) => {
  await page.goto('/')
  await expect(page.getByRole('table')).toBeVisible()
})
