import { test, expect } from '@playwright/test'

test.describe('Policy Pages', () => {
  test('privacy renders', async ({ page }) => {
    await page.goto('/privacy')
    await page.waitForLoadState('networkidle')
    await expect(
      page.getByRole('heading', { name: 'Privacy Statement' })
    ).toBeVisible()
  })

  test('terms renders', async ({ page }) => {
    await page.goto('/terms')
    await page.waitForLoadState('networkidle')
    await expect(
      page.getByRole('heading', { name: 'Terms of Service' })
    ).toBeVisible()
  })

  test('accessibility renders', async ({ page }) => {
    await page.goto('/accessibility')
    await page.waitForLoadState('networkidle')
    await expect(
      page.getByRole('heading', { name: 'Accessibility Statement' })
    ).toBeVisible()
  })
})
