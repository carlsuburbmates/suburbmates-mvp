import { test, expect } from '@playwright/test'

test.describe('AI Support Chat', () => {
  test('toggle opens chat and shows title', async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('networkidle')
    // Ensure toggle is rendered before clicking; emulator banner may intercept pointer events
    const toggle = page.getByRole('button', { name: 'Toggle Chat' })
    await expect(toggle).toBeVisible()
    // Emulator banner intercepts pointer events; dispatch a programmatic click
    await page.evaluate(() => {
      const el = document.querySelector(
        'button[aria-label="Toggle Chat"]'
      ) as HTMLButtonElement | null
      el?.click()
    })
    await expect(
      page.getByText('Suburbmates Support', { exact: true })
    ).toBeVisible()
  })
})
