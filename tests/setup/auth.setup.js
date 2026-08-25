const { test: setup, expect } = require('@playwright/test')
const { CUSTOMER, STORAGE_STATE } = require('../../lib/env')

/**
 * Runs once before the UI projects. Signs in the published demo customer
 * through the real login form and saves the browser state (the JWT lives
 * in localStorage), so authenticated specs can opt in via
 * test.use({ storageState: STORAGE_STATE }) and skip the login UI.
 */
setup('authenticate as the demo customer', async ({ page }) => {
  await page.goto('/auth/login')
  await page.getByTestId('email').fill(CUSTOMER.email)
  await page.getByTestId('password').fill(CUSTOMER.password)

  const login = page.waitForResponse((response) => response.url().includes('/users/login'))
  await page.getByTestId('login-submit').click()
  const response = await login
  if (!response.ok()) {
    throw new Error(`Demo customer login failed: HTTP ${response.status()} ${await response.text()}`)
  }

  await expect(page).toHaveURL(/\/account/, { timeout: 20_000 })
  await expect(page.getByTestId('nav-menu')).toBeVisible()

  await page.context().storageState({ path: STORAGE_STATE })
})
