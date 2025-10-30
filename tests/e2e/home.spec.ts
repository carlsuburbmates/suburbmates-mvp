import { test, expect } from '@playwright/test'

test.describe('Home Page', () => {
  test('renders hero and AI summaries card', async ({ page }) => {
    await page.goto('/')
    await expect(page.getByText('AI-Powered Summaries')).toBeVisible()
    await expect(page.getByText('Learn More')).toBeVisible()
  })
})
