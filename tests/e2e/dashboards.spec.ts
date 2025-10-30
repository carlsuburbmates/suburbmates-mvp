import { test, expect } from '@playwright/test'

test.describe('Dashboards (non-blocking auth)', () => {
  test('resident dashboard shows login prompt or content', async ({ page }) => {
    await page.goto('/dashboard/resident')
    await expect(page.locator('body')).toContainText(/Login|Sign in|Dashboard/i)
  })

  test('vendor dashboard shows login prompt or content', async ({ page }) => {
    await page.goto('/dashboard/vendor')
    await expect(page.locator('body')).toContainText(
      /Login|Sign in|Vendor Dashboard|Dashboard/i
    )
  })
})
