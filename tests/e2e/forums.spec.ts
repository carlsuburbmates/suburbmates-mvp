import { test, expect } from '@playwright/test'

test.describe('Forums Page', () => {
  test('renders events and threads tabs', async ({ page }) => {
    await page.goto('/forums')
    await page.waitForLoadState('networkidle')
    await expect(page.getByRole('heading', { name: 'Civic Hub' })).toBeVisible()
    await expect(page.getByRole('tab', { name: 'Discussions' })).toBeVisible()
    await expect(page.getByRole('tab', { name: 'Local Events' })).toBeVisible()
  })
})
