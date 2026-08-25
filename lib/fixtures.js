const base = require('@playwright/test')
const { HomePage } = require('./pages/HomePage')
const { ProductPage } = require('./pages/ProductPage')
const { LoginPage } = require('./pages/LoginPage')
const { RegisterPage } = require('./pages/RegisterPage')
const { CartCheckoutPage } = require('./pages/CartCheckoutPage')
const { ContactPage } = require('./pages/ContactPage')
const { FavoritesPage } = require('./pages/FavoritesPage')
const { ToolshopApi, uniqueCustomer } = require('./api/toolshopApi')
const { CUSTOMER } = require('./env')

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

  /** Bearer token for the published demo customer. */
  customerToken: async ({ api }, use) => {
    await use(await api.login(CUSTOMER))
  },

  /** A brand-new customer registered through the API, unique per test. */
  testCustomer: async ({ api }, use) => {
    const customer = uniqueCustomer()
    const response = await api.register(customer)
    if (response.status() !== 201) {
      throw new Error(`Could not register test customer: HTTP ${response.status()}`)
    }
    await use(customer)
  },
})

module.exports = { test, expect: base.expect, uniqueCustomer }
