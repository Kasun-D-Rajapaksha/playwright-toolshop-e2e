const { test, expect } = require('../../lib/fixtures')

test.use({ storageState: { cookies: [], origins: [] } })

test.describe('API failure and edge-state handling', () => {
  test('keeps the page usable when the products API returns 500', async ({
    page,
    homePage,
  }) => {
    // Catalog queries hit /products (HTTP QUERY with a JSON body).
    await page.route('**/products*', (route) =>
      route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ message: 'Internal server error' }),
      }),
    )

    await page.goto('/')

    // The app should degrade gracefully: no product cards, but the shell
    // (navigation, search) stays functional instead of crashing.
    await expect(homePage.productCards).toHaveCount(0)
    await expect(homePage.searchInput).toBeVisible()
    await expect(page.getByTestId('nav-home')).toBeVisible()
  })

  test('shows an error when the sign-in service is down', async ({
    page,
    loginPage,
  }) => {
    await page.route('**/users/login', (route) =>
      route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ message: 'Internal server error' }),
      }),
    )

    await loginPage.goto()
    await loginPage.login('customer@practicesoftwaretesting.com', 'welcome01')

    await expect(loginPage.loginError).toBeVisible()
    await expect(page).toHaveURL(/\/auth\/login/)
  })

  test('degrades gracefully when the network drops mid-session', async ({
    homePage,
    context,
  }) => {
    await homePage.goto()
    await expect(homePage.productCards.first()).toBeVisible()

    await context.setOffline(true)
    await homePage.search('hammer')

    // The SPA shell must survive the failed request.
    await expect(homePage.searchInput).toBeVisible()
    await expect(homePage.productCards).toHaveCount(0)

    // Back online, the same search works again.
    await context.setOffline(false)
    await homePage.search('hammer')
    await expect(homePage.productCards.first()).toBeVisible()
  })
})
