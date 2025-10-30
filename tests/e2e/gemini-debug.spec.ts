import { test, expect } from '@playwright/test'

test.describe('Gemini Debug Test', () => {
  test('simple button should be visible in layout', async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('networkidle')
    const testButton = page.getByTestId('gemini-test-button')
    await expect(testButton).toBeVisible()
  })
})
