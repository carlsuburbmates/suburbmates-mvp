import { test, expect } from '@playwright/test'

test.describe('Vendors Page', () => {
  test('renders list and AI search input', async ({ page }) => {
    await page.goto('/vendors')
    // Prefer label-based selector for accessibility linkage
    await page.locator('#ai-search').scrollIntoViewIfNeeded()
    await expect(page.locator('#ai-search')).toBeVisible()
    await expect(page.getByLabel('AI-Powered Search')).toBeVisible()
    await expect(
      page.getByText('Use natural language to find what you need.')
    ).toBeVisible()
  })
})
