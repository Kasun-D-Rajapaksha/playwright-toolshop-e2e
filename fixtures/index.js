const base = require('@playwright/test')
const { HomePage } = require('../pages/HomePage')
const { ProductPage } = require('../pages/ProductPage')
const { LoginPage } = require('../pages/LoginPage')
const { RegisterPage } = require('../pages/RegisterPage')
const { CartCheckoutPage } = require('../pages/CartCheckoutPage')
const { ContactPage } = require('../pages/ContactPage')
const { FavoritesPage } = require('../pages/FavoritesPage')
const { ToolshopApi, uniqueCustomer } = require('../api/toolshopApi')
const { CUSTOMER } = require('../utils/env')

/**
 * Custom fixtures: every spec imports { test, expect } from here instead of
 * from @playwright/test. Page objects and the API client are injected per
 * test, so specs never construct them by hand.
 */
const test = base.test.extend({
  homePage: async ({ page }, use) => {
    await use(new HomePage(page))
  },
  productPage: async ({ page }, use) => {
    await use(new ProductPage(page))
  },
  loginPage: async ({ page }, use) => {
    await use(new LoginPage(page))
  },
  registerPage: async ({ page }, use) => {
    await use(new RegisterPage(page))
  },
  checkoutPage: async ({ page }, use) => {
    await use(new CartCheckoutPage(page))
  },
  contactPage: async ({ page }, use) => {
    await use(new ContactPage(page))
  },
  favoritesPage: async ({ page }, use) => {
    await use(new FavoritesPage(page))
  },

  /** Browser-independent API client against the backend base URL. */
  api: async ({ playwright }, use) => {
    const api = await ToolshopApi.create(playwright.request)
    await use(api)
    await api.dispose()
  },

  /** Bearer token for the configured customer (created if missing). */
  customerToken: async ({ api }, use) => {
    await use(await api.ensureCustomer(CUSTOMER))
  },

  /** A brand-new customer registered through the API, unique per test. */
  testCustomer: async ({ api }, use) => {
    let lastStatus = 'unknown'
    for (let attempt = 1; attempt <= 3; attempt++) {
      const customer = uniqueCustomer()
      const response = await api.register(customer)
      lastStatus = response.status()
      if (lastStatus === 201) {
        await use(customer)
        return
      }
    }
    throw new Error(`Could not register test customer: HTTP ${lastStatus}`)
  },
})

module.exports = { test, expect: base.expect, uniqueCustomer }
