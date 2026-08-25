const { test, expect, uniqueCustomer } = require('../../lib/fixtures')

// Registration must start signed out.
test.use({ storageState: { cookies: [], origins: [] } })

test.describe('customer registration', () => {
  test('registers a new customer through the UI form @smoke', async ({
    registerPage,
    loginPage,
    page,
    browserName,
  }) => {
    const customer = uniqueCustomer({
      email: `pw.ui.${browserName}.${Date.now()}@example.com`,
    })

    await registerPage.goto()
    await registerPage.register(customer)

    // A successful registration redirects to the sign-in page.
    await expect(page).toHaveURL(/\/auth\/login/)

    // Prove the account actually exists by signing in with it.
    await loginPage.login(customer.email, customer.password)
    await expect(page).toHaveURL(/\/account/)
    await expect(page.getByTestId('nav-menu')).toContainText(customer.first_name)
  })

  test('shows a validation error for every missing required field', async ({
    registerPage,
  }) => {
    await registerPage.goto()
    await registerPage.submitButton.click()

    await expect(registerPage.page.getByTestId('first-name-error')).toBeVisible()
    await expect(registerPage.page.getByTestId('last-name-error')).toBeVisible()
    await expect(registerPage.page.getByTestId('email-error')).toBeVisible()
    await expect(registerPage.page.getByTestId('password-error')).toBeVisible()
  })

  test('rejects a password that does not meet the policy', async ({
    registerPage,
    browserName,
  }) => {
    const customer = uniqueCustomer({
      email: `pw.weak.${browserName}.${Date.now()}@example.com`,
      password: 'weak',
    })

    await registerPage.goto()
    await registerPage.register(customer)

    await expect(registerPage.page.getByTestId('password-error')).toBeVisible()
    await expect(registerPage.page).toHaveURL(/\/auth\/register/)
  })
})
