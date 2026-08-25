const { test, expect } = require('../../fixtures')
const { STORAGE_STATE } = require('../../utils/env')

test.describe('favorites (authenticated via storageState)', () => {
  // Reuse the session saved by the setup project: no login UI in these tests.
  test.use({ storageState: STORAGE_STATE })

  test('adds a product to favorites and removes it again @smoke', async ({
    homePage,
    productPage,
    favoritesPage,
    browserName,
  }) => {
    // Each browser project favorites a different product so parallel runs
    // against the shared demo account never race each other.
    const productIndex = { chromium: 0, firefox: 1, webkit: 2 }[browserName] ?? 3

    await homePage.goto()
    const productName = (await homePage.productNames.nth(productIndex).innerText()).trim()
    await homePage.productCards.nth(productIndex).click()

    await productPage.addToFavorites()
    await expect(productPage.toast).toContainText(/favou?rites/i)

    await favoritesPage.goto()
    await expect(favoritesPage.itemByName(productName)).toBeVisible()

    await favoritesPage.remove(productName)
    await expect(favoritesPage.itemByName(productName)).toBeHidden()
  })
})

test.describe('favorites (signed out)', () => {
  test.use({ storageState: { cookies: [], origins: [] } })

  test('cannot favorite a product without signing in', async ({
    homePage,
    productPage,
  }) => {
    await homePage.goto()
    await homePage.productCards.first().click()
    await productPage.addToFavorites()

    await expect(productPage.toast).toContainText(/unauthorized/i)
  })
})
