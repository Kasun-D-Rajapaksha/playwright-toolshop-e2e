const { API_URL } = require('../utils/env')

/**
 * Thin wrapper around a Playwright APIRequestContext for the Toolshop
 * backend. Used both by pure API tests and as an app-state shortcut for
 * UI tests (e.g. creating a throwaway customer before a UI journey).
 */
class ToolshopApi {
  /** @param {import('@playwright/test').APIRequestContext} request */
  constructor(request) {
    this.request = request
  }

  /**
   * Creates a dedicated request context pointed at the API base URL,
   * independent of the browser and of the UI base URL.
   * @param {import('@playwright/test').Playwright['request']} playwrightRequest
   */
  static async create(playwrightRequest) {
    const context = await playwrightRequest.newContext({ baseURL: API_URL })
    return new ToolshopApi(context)
  }

  async dispose() {
    await this.request.dispose()
  }

  /** Logs in and returns the bearer token. */
  async login({ email, password }) {
    const response = await this.request.post('/users/login', {
      data: { email, password },
    })
    if (!response.ok()) {
      throw new Error(`Login failed for ${email}: HTTP ${response.status()}`)
    }
    const body = await response.json()
    return body.access_token
  }

  /**
   * Returns a token for the given credentials. If login fails with 401/400
   * (account missing after a demo-DB reset), registers that customer first.
   */
  async ensureCustomer({ email, password }) {
    const login = await this.request.post('/users/login', {
      data: { email, password },
    })
    if (login.ok()) {
      return (await login.json()).access_token
    }

    const loginStatus = login.status()
    if (loginStatus !== 401 && loginStatus !== 400) {
      throw new Error(`Login failed for ${email}: HTTP ${loginStatus} ${await login.text()}`)
    }

    const registered = await this.register(uniqueCustomer({ email, password }))
    if (registered.status() === 201) {
      return this.login({ email, password })
    }

    // Another worker created the same account in parallel.
    if (registered.status() === 409) {
      return this.login({ email, password })
    }

    throw new Error(
      `Could not create customer ${email} after login HTTP ${loginStatus}: register HTTP ${registered.status()} ${await registered.text()}`,
    )
  }

  /** Registers a customer; returns the raw APIResponse for assertions. */
  async register(customer) {
    return this.request.post('/users/register', { data: customer })
  }

  authHeaders(token) {
    return { Authorization: `Bearer ${token}` }
  }

  async me(token) {
    return this.request.get('/users/me', { headers: this.authHeaders(token) })
  }

  async refresh(token) {
    return this.request.get('/users/refresh', { headers: this.authHeaders(token) })
  }

  async logout(token) {
    return this.request.get('/users/logout', { headers: this.authHeaders(token) })
  }

  async products(searchParams = {}) {
    return this.request.get('/products', { params: searchParams })
  }

  /** First catalog product the UI can actually add to a cart. */
  async firstInStockProduct() {
    for (let page = 1; page <= 5; page++) {
      const body = await (await this.products({ page })).json()
      const product = body.data.find((item) => item.in_stock)
      if (product) return product
      if (!body.data.length) break
    }
    throw new Error('No in-stock product found in the catalog')
  }

  async categoriesTree() {
    return this.request.get('/categories/tree')
  }

  async invoices(token) {
    return this.request.get('/invoices', { headers: this.authHeaders(token) })
  }
}

/**
 * Factory for a unique, valid registration payload. Every call produces a
 * fresh email so tests never collide across parallel workers or browsers.
 */
function uniqueCustomer(overrides = {}) {
  const stamp = `${Date.now()}${Math.floor(Math.random() * 10_000)}`

  return {
    first_name: 'Playwright',
    last_name: 'Customer',
    email: `pw.customer.${stamp}@example.com`,
    password: 'SuperSecure@1234',
    dob: '1992-03-25',
    phone: '0712345678',
    address: {
      // Country label as shown in the <select>; the option *value* is the
      // ISO code (AT). Postcode + house number must resolve via
      // GET /postcode-lookup so invoice geo-validation accepts the address.
      street: 'placeholder',
      house_number: '1',
      city: 'placeholder',
      state: 'placeholder',
      country: 'Austria',
      postal_code: '1010',
    },
    ...overrides,
  }
}

module.exports = { ToolshopApi, uniqueCustomer }
